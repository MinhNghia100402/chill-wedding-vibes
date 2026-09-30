"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, LoaderCircle, Maximize, Minimize, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { claimAudio, onAudioClaimed } from "@/lib/media-bus";
import { resolveMediaSource } from "@/lib/media-source";
import type { Film } from "@/lib/types";
import { cn } from "@/lib/utils";
import { loadYouTubeApi } from "@/lib/youtube-api";

type Phase = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

/** The minimal surface both engines (YouTube, <video>) expose to the custom controls. */
interface Engine {
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  time(): number;
  duration(): number;
  setMuted(muted: boolean): void;
}

const EMBED_BLOCKED = "The owner of this YouTube video doesn't allow it to be played on other websites.";
const YT_ERRORS: Record<number, string> = {
  2: "That YouTube link has an invalid video ID.",
  5: "This video can't be played in the browser.",
  100: "This YouTube video was removed or is private.",
  101: EMBED_BLOCKED,
  150: EMBED_BLOCKED,
};

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

/* ------------------------------------------------------------------ */
/* YouTube engine that keeps YouTube's own UI out of sight             */
/* ------------------------------------------------------------------ */

/**
 * YouTube overlays its title bar, share button, logo and a play/pause glyph
 * for ≈3–4 s whenever playback starts *or the position jumps* (seek), and shows
 * "More videos" while paused. To keep only the picture visible, every start,
 * resume and seek is "masked": behind our cover, muted, we jump MASK_SECONDS
 * *before* the target and let it play up to the target — by the time it gets
 * there the overlay has faded, and we reveal without any further jump.
 * (At the very start of the film there is nothing before 0:00, so the visible
 * film begins MASK_SECONDS in.) Pausing really pauses; our cover hides
 * YouTube's pause screen.
 */
const MASK_SECONDS = 3.8;

type YouTubeMode = "idle" | "masking" | "live" | "paused";

interface YouTubeEngine extends Engine {
  handleState(state: number): void;
}

function hideCaptions(p: YT.Player) {
  const player = p as YT.Player & { unloadModule?: (name: string) => void };
  player.unloadModule?.("captions");
  player.unloadModule?.("cc");
}

function createYouTubeEngine(
  p: YT.Player,
  api: typeof YT,
  startAt: number,
  { onPhase }: { onPhase: (phase: Phase) => void },
): YouTubeEngine {
  let mode: YouTubeMode = "idle";
  let resumeAt = startAt; // what the guest should see next
  let revealAt = 0; // playback time at which the mask comes off
  let landed = false; // the pre-roll seek has actually taken effect
  let userMuted = false;
  let watch: number | undefined;

  const applyMute = () => (userMuted ? p.mute() : p.unMute());
  const stopWatch = () => {
    window.clearInterval(watch);
    watch = undefined;
  };

  function goLive() {
    stopWatch();
    applyMute();
    mode = "live";
    onPhase("playing");
  }

  /** Plays muted from MASK_SECONDS before `target`, revealing when it reaches the target. */
  function maskTo(target: number) {
    const from = Math.max(0, target - MASK_SECONDS);
    stopWatch();
    // Too close to the end to pre-roll: accept a brief overlay instead.
    if (p.getDuration() - from < MASK_SECONDS + 0.5) {
      p.seekTo(target, true);
      p.playVideo();
      goLive();
      return;
    }
    mode = "masking";
    revealAt = from + MASK_SECONDS;
    resumeAt = revealAt;
    landed = false;
    p.mute();
    p.seekTo(from, true);
    p.playVideo();
    onPhase("loading");
    watch = window.setInterval(() => {
      const t = p.getCurrentTime();
      if (!landed) landed = Math.abs(t - from) < 1.5; // ignore the pre-seek position
      else if (t >= revealAt - 0.05) goLive();
    }, 100);
  }

  return {
    play() {
      if (mode === "live" || mode === "masking") return;
      maskTo(resumeAt);
    },
    pause() {
      if (mode === "live") resumeAt = p.getCurrentTime();
      if (mode === "live" || mode === "masking") {
        stopWatch();
        p.pauseVideo();
        mode = "paused";
        onPhase("paused");
      }
    },
    seek(seconds) {
      resumeAt = seconds;
      if (mode === "live" || mode === "masking") maskTo(seconds);
    },
    time: () => (mode === "live" ? p.getCurrentTime() : resumeAt),
    duration: () => p.getDuration(),
    setMuted(muted) {
      userMuted = muted;
      if (mode === "live") applyMute();
    },
    handleState(state) {
      if (state === api.PlayerState.PLAYING) {
        hideCaptions(p);
        if (mode === "live") onPhase("playing");
      } else if (state === api.PlayerState.BUFFERING && mode === "live") {
        onPhase("loading");
      } else if (state === api.PlayerState.ENDED) {
        stopWatch();
        mode = "paused";
        resumeAt = startAt;
        onPhase("ended");
      }
    },
  };
}

/**
 * Chrome-less film player: only the picture and our own themed controls.
 *
 * For YouTube links the native player UI is disabled (`controls=0`), a
 * transparent layer stops YouTube's hover UI from ever appearing, and our own
 * cover image hides YouTube's pause/end screens ("More videos", title bar…).
 * Note: YouTube's API terms discourage obscuring its player — for production,
 * a direct .mp4/.webm file (or a video CDN) is the fully clean, compliant option.
 */
export function FilmPlayer({ film }: { film: Film }) {
  const source = useMemo(() => resolveMediaSource(film.url), [film.url]);
  const containerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const ytInstanceRef = useRef<YT.Player | null>(null);
  const creatingRef = useRef(false);
  const wantPlayRef = useRef(false);
  const hideTimer = useRef<number>(undefined);

  const [phase, setPhase] = useState<Phase>(source.kind === "unsupported" ? "error" : "idle");
  const [error, setError] = useState(source.kind === "unsupported" ? source.reason : undefined);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [controlsShown, setControlsShown] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);

  const isYouTube = source.kind === "youtube";
  const poster = film.poster ?? (isYouTube ? `https://i.ytimg.com/vi/${source.videoId}/hqdefault.jpg` : undefined);

  const fail = useCallback((message: string) => {
    setError(message);
    setPhase("error");
  }, []);

  /* ---------------- YouTube engine ---------------- */

  const createYouTube = useCallback(async () => {
    if (source.kind !== "youtube" || creatingRef.current) return;
    creatingRef.current = true;
    let api: typeof YT;
    try {
      api = await loadYouTubeApi();
    } catch {
      creatingRef.current = false;
      fail("Couldn't reach YouTube — check your connection and try again.");
      return;
    }
    const target = document.createElement("div"); // replaced by the iframe; not owned by React
    hostRef.current!.replaceChildren(target);

    ytInstanceRef.current = new api.Player(target, {
      videoId: source.videoId,
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 0,
        controls: 0, // no YouTube control bar
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3, // no annotations
        rel: 0,
        playsinline: 1,
        cc_load_policy: 0,
        start: source.start,
        origin: window.location.origin,
      },
      events: {
        onReady: (e) => {
          const p = e.target;
          engineRef.current = createYouTubeEngine(p, api, source.start, {
            onPhase: (next) => {
              if (next === "playing") setStarted(true);
              setPhase(next);
            },
          });
          setDuration(p.getDuration());
          if (wantPlayRef.current) engineRef.current.play();
        },
        onStateChange: (e) => (engineRef.current as YouTubeEngine | null)?.handleState(e.data),
        // Captions load lazily with playback; keep auto-generated subtitles off the picture.
        onApiChange: (e) => hideCaptions(e.target),
        onError: (e) => fail(YT_ERRORS[e.data] ?? "This video couldn't be played."),
      },
    });
  }, [source, fail]);

  // Prepare the YouTube player shortly before the section scrolls into view,
  // so pressing play starts almost instantly.
  useEffect(() => {
    if (!isYouTube || !containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          void createYouTube();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isYouTube, createYouTube]);

  useEffect(() => () => ytInstanceRef.current?.destroy(), []);

  /* ---------------- <video> engine ---------------- */

  useEffect(() => {
    const v = videoRef.current;
    if (source.kind !== "file" || !v) return;
    engineRef.current = {
      play: () => void v.play().catch(() => setPhase("paused")),
      pause: () => v.pause(),
      seek: (s) => (v.currentTime = s),
      time: () => v.currentTime,
      duration: () => v.duration,
      setMuted: (m) => (v.muted = m),
    };
  }, [source.kind]);

  /* ---------------- shared behaviour ---------------- */

  const pause = useCallback(() => {
    wantPlayRef.current = false;
    engineRef.current?.pause();
  }, []);

  useEffect(() => onAudioClaimed("film", pause), [pause]);

  function play() {
    if (phase === "error") return;
    claimAudio("film");
    wantPlayRef.current = true;
    const engine = engineRef.current;
    if (!engine) {
      setPhase("loading");
      void createYouTube(); // onReady will start playback
      return;
    }
    if (source.kind === "file") {
      if (phase === "ended") engine.seek(0);
      if (!started) setPhase("loading");
    }
    engine.play();
  }

  const togglePlay = () => (phase === "playing" || (phase === "loading" && wantPlayRef.current) ? pause() : play());

  // Progress polling while playing.
  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;
      setTime(engine.time());
      setDuration(engine.duration());
    }, 250);
    return () => window.clearInterval(id);
  }, [phase]);

  // Fullscreen support is only known in the browser.
  useEffect(() => {
    setCanFullscreen(Boolean(document.fullscreenEnabled || (videoRef.current as { webkitEnterFullscreen?: unknown } | null)?.webkitEnterFullscreen));
    const onChange = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (containerRef.current?.requestFullscreen) void containerRef.current.requestFullscreen();
    else (videoRef.current as { webkitEnterFullscreen?: () => void } | null)?.webkitEnterFullscreen?.(); // iOS
  }

  function toggleMute() {
    engineRef.current?.setMuted(!muted);
    setMuted(!muted);
  }

  // Auto-hide the control bar while playing and the pointer is idle.
  function revealControls() {
    setControlsShown(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setControlsShown(false), 2500);
  }
  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const playing = phase === "playing";
  // YouTube: always cover with our poster when not playing (hides YouTube's pause/end screens).
  // Files: poster before the first play, then just a light scrim over the paused frame.
  const opaqueCover = isYouTube || !started;
  const showCover = !playing;
  const showBar = started && phase !== "error" && (!playing || controlsShown);

  return (
    <div
      ref={containerRef}
      onPointerMove={revealControls}
      onPointerLeave={() => playing && setControlsShown(false)}
      className={cn(
        "relative aspect-video overflow-hidden bg-black shadow-2xl shadow-on-canvas/20 ring-1 ring-primary/20",
        fullscreen ? "rounded-none" : "rounded-3xl",
        playing && !controlsShown && "cursor-none",
      )}
    >
      {/* Media layer — never receives pointer events, so YouTube's hover UI never appears. */}
      {isYouTube && (
        <div ref={hostRef} aria-hidden className="pointer-events-none absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full" />
      )}
      {source.kind === "file" && (
        <video
          ref={videoRef}
          src={source.src}
          playsInline
          preload="metadata"
          onPlaying={() => {
            setStarted(true);
            setPhase("playing");
          }}
          onPause={() => setPhase((p) => (p === "ended" ? p : "paused"))}
          onEnded={() => setPhase("ended")}
          onWaiting={() => wantPlayRef.current && setPhase("loading")}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onError={() => fail("This video file couldn't be loaded. Check that the link points directly to an .mp4/.webm file.")}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        />
      )}

      {/* Click anywhere on the picture to play/pause. */}
      <button
        type="button"
        onClick={togglePlay}
        onFocus={revealControls}
        aria-label={playing ? `Pause film: ${film.title}` : `Play film: ${film.title}`}
        className="absolute inset-0 z-10 focus-visible:outline-none"
      />

      <AnimatePresence>
        {showCover && (
          <motion.div
            key="cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-0 z-[11]"
          >
            {opaqueCover && poster && (
              <Image src={poster} alt="" fill sizes="(min-width: 1024px) 64rem, 100vw" className="object-cover" />
            )}
            <div className={cn("absolute inset-0", opaqueCover ? "bg-gradient-to-t from-black/60 via-black/10 to-black/25" : "bg-black/35")} />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
              {phase === "error" ? (
                <>
                  <CircleAlert className="h-10 w-10" aria-hidden />
                  <p className="max-w-md text-sm">{error}</p>
                </>
              ) : (
                <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-on-primary shadow-2xl shadow-black/40 sm:h-24 sm:w-24">
                  {phase === "idle" && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-primary/40" />}
                  {phase === "loading" ? (
                    <LoaderCircle className="h-9 w-9 animate-spin" aria-hidden />
                  ) : phase === "ended" ? (
                    <RotateCcw className="h-9 w-9" aria-hidden />
                  ) : (
                    <Play className="relative ml-1 h-9 w-9 sm:h-10 sm:w-10" fill="currentColor" aria-hidden />
                  )}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom control bar */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 text-white transition-opacity duration-300 sm:gap-3 sm:px-5 sm:pb-4",
          showBar ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="rounded-full p-1.5 transition hover:bg-white/15">
          {playing ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}
        </button>
        <span className="w-[5.5rem] shrink-0 text-xs tabular-nums sm:text-sm">
          {formatTime(time)} / {formatTime(duration)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(time, duration || 0)}
          onChange={(e) => {
            const s = Number(e.target.value);
            engineRef.current?.seek(s);
            setTime(s);
          }}
          onPointerDown={revealControls}
          aria-label="Seek"
          className="h-1 min-w-0 flex-1 cursor-pointer accent-primary"
        />
        <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="rounded-full p-1.5 transition hover:bg-white/15">
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        {canFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Exit full screen" : "Full screen"}
            className="rounded-full p-1.5 transition hover:bg-white/15"
          >
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        )}
      </div>
    </div>
  );
}
