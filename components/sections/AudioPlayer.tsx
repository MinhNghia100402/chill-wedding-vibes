"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Music, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { claimAudio, onAudioClaimed } from "@/lib/media-bus";
import { loadYouTubeApi } from "@/lib/youtube-api";
import { resolveMediaSource } from "@/lib/media-source";
import type { Music as MusicTrack } from "@/lib/types";
import { cn } from "@/lib/utils";

type State = "paused" | "loading" | "playing" | "error";

/**
 * Floating background-music control. `music.url` may be a direct audio file
 * or a YouTube link (see lib/media-source.ts).
 *
 * Autoplay: browsers refuse sound before the visitor interacts with the page,
 * so we try once on load (allowed on sites the browser already trusts) and
 * otherwise start on the guest's first tap/click/key press anywhere.
 */
export function AudioPlayer({ track }: { track: MusicTrack }) {
  const source = useMemo(() => resolveMediaSource(track.url), [track.url]);
  const autoplay = track.autoplay !== false;

  switch (source.kind) {
    case "file":
      return <HtmlAudioPlayer track={track} src={source.src} autoplay={autoplay} />;
    case "youtube":
      return <YouTubeAudioPlayer track={track} videoId={source.videoId} start={source.start} autoplay={autoplay} />;
    default:
      return <PlayerShell track={track} state="error" error={source.reason} onToggle={() => undefined} />;
  }
}

/* ------------------------------------------------------------------ */
/* Autoplay on first interaction                                       */
/* ------------------------------------------------------------------ */

/**
 * Events that grant "user activation" (what browsers require before playing
 * sound). Note `touchstart`/`pointerdown` do *not* count on touch screens —
 * only the completed tap does.
 */
const ACTIVATION_EVENTS = ["click", "keydown", "touchend"] as const;

/**
 * While armed, calls `start(true)` on every qualifying interaction anywhere on
 * the page (plus one silent `start(false)` attempt on mount). Disarm once the
 * music is audible or the guest takes control; re-arm if a start was blocked.
 */
function useAutoStart(enabled: boolean, start: (fromGesture: boolean) => void) {
  const startRef = useRef(start);
  const [armed, setArmed] = useState(enabled);

  useEffect(() => {
    startRef.current = start;
  });

  // One silent attempt on load — succeeds only where the browser already allows sound.
  useEffect(() => {
    if (enabled) startRef.current(false);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !armed) return;
    const onInteract = (event: Event) => {
      // Explicit use of the music button or the film is handled by those controls.
      if ((event.target as Element | null)?.closest?.("[data-music-toggle], #film")) return;
      startRef.current(true);
    };
    ACTIVATION_EVENTS.forEach((type) => window.addEventListener(type, onInteract, { capture: true, passive: true }));
    return () => ACTIVATION_EVENTS.forEach((type) => window.removeEventListener(type, onInteract, true));
  }, [enabled, armed]);

  const disarm = useCallback(() => setArmed(false), []);
  const rearm = useCallback(() => enabled && setArmed(true), [enabled]);
  return { armed: enabled && armed, disarm, rearm };
}

/* ------------------------------------------------------------------ */
/* Shared floating button + label                                      */
/* ------------------------------------------------------------------ */

function PlayerShell({
  track,
  state,
  error,
  hint,
  onToggle,
  children,
}: {
  track: MusicTrack;
  state: State;
  error?: string;
  /** Shown instead of the track name while autoplay waits for the first tap. */
  hint?: string;
  onToggle: () => void;
  children?: ReactNode;
}) {
  const [showLabel, setShowLabel] = useState(true);
  const playing = state === "playing";
  const failed = state === "error";

  useEffect(() => {
    const id = window.setTimeout(() => setShowLabel(false), 6000);
    return () => window.clearTimeout(id);
  }, []);

  // Surface errors even if the label had already auto-hidden.
  useEffect(() => {
    if (failed) setShowLabel(true);
  }, [failed]);

  const label = failed
    ? `Music error: ${error ?? "couldn't load"}`
    : playing
      ? `Pause “${track.title}”`
      : `Play “${track.title}”`;

  return (
    <>
      {/* Bottom-right, beside the ThemeSwitcher FAB (right-5 + 3rem + gap). The bottom-left
          corner is avoided because Next.js's dev-tools badge covers it during `next dev`. */}
      <div className="fixed bottom-5 right-20 z-50 flex flex-row-reverse items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          data-music-toggle
          aria-label={label}
          aria-pressed={playing}
          onMouseEnter={() => setShowLabel(true)}
          onMouseLeave={() => !failed && setShowLabel(false)}
          onFocus={() => setShowLabel(true)}
          onBlur={() => !failed && setShowLabel(false)}
          className={cn(
            "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30 transition hover:scale-105",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
            failed && "opacity-60",
          )}
        >
          {playing && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-primary/40" />}
          <span className="relative">
            {state === "loading" ? (
              <Music className="h-5 w-5 animate-pulse" />
            ) : playing ? (
              <Pause className="h-5 w-5" fill="currentColor" />
            ) : (
              <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
            )}
          </span>
        </button>

        <AnimatePresence>
          {(showLabel || (Boolean(hint) && !playing)) && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              role={failed ? "status" : undefined}
              className={cn(
                "rounded-2xl bg-surface/95 px-4 py-2 text-xs text-on-surface shadow-md backdrop-blur",
                // The track label is desktop-only; errors and the autoplay hint show everywhere.
                failed || hint ? "block max-w-[calc(100vw-10rem)] sm:max-w-xs" : "hidden sm:block",
              )}
            >
              {failed ? (
                <span>{error ?? "Couldn't load music — tap to retry"}</span>
              ) : hint && !playing ? (
                <span className="font-medium">{hint}</span>
              ) : (
                <>
                  <span className="font-semibold">{track.title}</span>
                  <span className="opacity-70"> · {track.artist}</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {children}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Direct audio files                                                  */
/* ------------------------------------------------------------------ */

const AUTOPLAY_HINT = "♪ Tap anywhere to play music";

function HtmlAudioPlayer({ track, src, autoplay }: { track: MusicTrack; src: string; autoplay: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<State>("paused");

  const auto = useAutoStart(autoplay, () => {
    const audio = audioRef.current;
    if (!audio || !audio.paused) return;
    claimAudio("music");
    // Rejected until the guest interacts — stay quiet and wait for the next tap.
    audio.play().catch(() => undefined);
  });

  // Something else (the film) took over the sound: pause, and stop auto-starting.
  const { disarm } = auto;
  useEffect(
    () =>
      onAudioClaimed("music", () => {
        disarm();
        audioRef.current?.pause();
      }),
    [disarm],
  );

  async function toggle() {
    auto.disarm();
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    if (state === "error") audio.load(); // retry after a network failure
    claimAudio("music");
    setState("loading");
    try {
      await audio.play();
    } catch {
      setState("error");
    }
  }

  return (
    <PlayerShell
      track={track}
      state={state}
      error="Couldn't load this audio file — tap to retry. The link must point directly to an .mp3/.m4a/.ogg file, or be a YouTube video link."
      hint={auto.armed ? AUTOPLAY_HINT : undefined}
      onToggle={toggle}
    >
      <audio
        ref={audioRef}
        src={src}
        loop
        preload="none"
        onPlaying={() => {
          auto.disarm();
          setState("playing");
        }}
        onPause={() => setState("paused")}
        onError={() => setState("error")}
      />
    </PlayerShell>
  );
}

/* ------------------------------------------------------------------ */
/* YouTube as background audio                                         */
/* ------------------------------------------------------------------ */

const EMBED_BLOCKED =
  "The owner of this YouTube video doesn't allow it to be played on other websites. Try another upload of the song.";
const YT_ERRORS: Record<number, string> = {
  2: "That YouTube link has an invalid video ID.",
  5: "YouTube couldn't play this video in the browser.",
  100: "This YouTube video was removed or is private.",
  101: EMBED_BLOCKED,
  150: EMBED_BLOCKED,
};

/**
 * Plays a YouTube video's soundtrack with the player kept invisible, so guests
 * only see the music button.
 *
 * Caveats (documented in the README): YouTube's API terms ask for a visible
 * player, and iOS Safari may refuse to start hidden playback — a direct audio
 * file is the most reliable choice for production.
 */
function YouTubeAudioPlayer({
  track,
  videoId,
  start,
  autoplay,
}: {
  track: MusicTrack;
  videoId: string;
  start: number;
  autoplay: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  /** Set only once the player fires onReady — before that its methods don't exist. */
  const readyRef = useRef<YT.Player | null>(null);
  const instanceRef = useRef<YT.Player | null>(null);
  /** True from the moment creation starts, so a tap during warm-up can't build a second player. */
  const creatingRef = useRef(false);
  const wantPlayingRef = useRef(false);
  /**
   * True once sound was requested from inside a real guest gesture. The silent
   * on-load autoplay attempt leaves it false, so a blocked or muted attempt
   * never makes the button look like it is playing/loading.
   */
  const audibleRef = useRef(false);
  const stateRef = useRef<State>("paused");
  const [state, setStateRaw] = useState<State>("paused");
  const [error, setError] = useState<string>();
  /** The guest tapped before YouTube was ready; the next tap will start the music. */
  const [needsTapAgain, setNeedsTapAgain] = useState(false);

  const setState = (next: State) => {
    stateRef.current = next;
    setStateRaw(next);
  };

  useEffect(
    () => () => {
      instanceRef.current?.destroy();
    },
    [],
  );

  // Loading YouTube takes several seconds, so prepare it early (immediately when autoplaying).
  useEffect(() => {
    const id = window.setTimeout(() => void createPlayer(true), autoplay ? 0 : 2500);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const auto = useAutoStart(autoplay, (fromGesture) => {
    if (stateRef.current === "playing" || stateRef.current === "error") return;
    const player = readyRef.current;
    // No silent on-load attempt for YouTube: once the browser blocks one, YouTube
    // tends to ignore the next play command too, so the guest's first tap must be
    // the first play request.
    if (!fromGesture) return;
    wantPlayingRef.current = true;
    claimAudio("music");
    if (player) resumeAudible(player); // synchronously inside the tap, so sound is allowed
    else audibleRef.current = true; // not ready yet: onReady will unmute + play
  });

  const { disarm } = auto;
  useEffect(
    () =>
      onAudioClaimed("music", () => {
        disarm();
        wantPlayingRef.current = false;
        readyRef.current?.pauseVideo();
      }),
    [disarm],
  );

  /** `warmUp`: build the player silently in advance so the first tap starts quickly. */
  async function createPlayer(warmUp = false) {
    if (creatingRef.current) return;
    creatingRef.current = true;
    if (!warmUp) setState("loading");
    let api: typeof YT;
    try {
      api = await loadYouTubeApi();
    } catch {
      creatingRef.current = false;
      setError("Couldn't reach YouTube — check your connection and tap to retry.");
      setState("error");
      return;
    }
    // The API replaces its target element with an <iframe>; give it a node React doesn't own.
    const target = document.createElement("div");
    hostRef.current!.replaceChildren(target);

    instanceRef.current = new api.Player(target, {
      videoId,
      width: 200,
      height: 200,
      // Playback is started explicitly via playVideo(), so warm-up never makes a sound.
      playerVars: { autoplay: 0, playsinline: 1, controls: 0, rel: 0, start, origin: window.location.origin },
      events: {
        onReady: (e) => {
          readyRef.current = e.target;
          // Never call playVideo() here: we're outside any tap, so the browser would block
          // it — and after one blocked attempt YouTube ignores later play() calls until its
          // own (hidden) player is clicked. If the guest already tapped, ask for one more tap.
          if (wantPlayingRef.current) {
            wantPlayingRef.current = false;
            setNeedsTapAgain(true);
            auto.rearm();
          }
          setState("paused");
        },
        onStateChange: (e) => {
          if (e.data === api.PlayerState.PLAYING) {
            // A pause may have been requested while it was still buffering.
            if (!wantPlayingRef.current) e.target.pauseVideo();
            // YouTube may fall back to *muted* autoplay when sound isn't allowed yet;
            // that isn't audible, so keep showing "play" until the guest's tap unmutes it.
            // (After a tap, trust our unMute() even if isMuted() hasn't caught up yet.)
            else if (!audibleRef.current && e.target.isMuted()) setState("paused");
            else {
              auto.disarm();
              setState("playing");
            }
          } else if (e.data === api.PlayerState.PAUSED) setState("paused");
          else if (e.data === api.PlayerState.BUFFERING && audibleRef.current && wantPlayingRef.current) {
            setState("loading");
          } else if (e.data === api.PlayerState.UNSTARTED && stateRef.current === "loading") {
            blocked();
          }
          else if (e.data === api.PlayerState.ENDED) {
            e.target.seekTo(start, true); // loop the song
            e.target.playVideo();
          }
        },
        onError: (e) => {
          setError(YT_ERRORS[e.data] ?? "YouTube couldn't play this video.");
          setState("error");
        },
      },
    });
  }

  /**
   * The browser refused to start (typically: the guest tapped before YouTube
   * finished loading, so play() ran outside the tap). Wait for the next tap.
   */
  function blocked() {
    setState("paused");
    if (wantPlayingRef.current) auto.rearm();
  }

  /** Unmutes and plays. If YouTube was already playing muted, restart the song audibly. */
  function resumeAudible(player: YT.Player) {
    audibleRef.current = true;
    setNeedsTapAgain(false);
    const alreadyPlaying = player.getPlayerState() === YT.PlayerState.PLAYING;
    player.unMute();
    if (alreadyPlaying) {
      player.seekTo(start, true); // it was playing silently — begin the song from the top
      auto.disarm();
      setState("playing");
    } else {
      player.playVideo();
    }
  }

  function toggle() {
    auto.disarm();
    if (state === "playing" || (state === "loading" && wantPlayingRef.current && audibleRef.current)) {
      wantPlayingRef.current = false;
      readyRef.current?.pauseVideo();
      if (state === "loading") setState("paused");
      return;
    }
    wantPlayingRef.current = true;
    audibleRef.current = true; // this is a real tap
    claimAudio("music");

    if (state === "error") {
      // Retry from scratch (e.g. the network came back).
      instanceRef.current?.destroy();
      instanceRef.current = readyRef.current = null;
      creatingRef.current = false;
      setError(undefined);
      void createPlayer();
    } else if (readyRef.current) {
      setState("loading");
      resumeAudible(readyRef.current);
    } else if (!creatingRef.current) {
      void createPlayer(); // onReady will ask for one more tap
    } else {
      setState("loading"); // still initialising (e.g. warm-up); onReady will ask for one more tap
    }
  }

  return (
    <PlayerShell track={track} state={state} error={error} hint={needsTapAgain ? "♪ Tap again to play music" : auto.armed ? AUTOPLAY_HINT : undefined}
      onToggle={toggle}
    >
      {/* Invisible, non-interactive host for the YouTube iframe (kept at 200×200 so YouTube
          doesn't reject it as too small). */}
      <div
        ref={hostRef}
        aria-hidden
        className="pointer-events-none fixed bottom-0 left-0 -z-10 h-[200px] w-[200px] overflow-hidden opacity-0"
      />
    </PlayerShell>
  );
}
