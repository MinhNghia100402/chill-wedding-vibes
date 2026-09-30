/**
 * Works out how to play a pasted media link (background music or the couple's
 * film), so the platform never has to store the file itself:
 *   - direct files (.mp3/.m4a/.mp4/.webm…, Dropbox `?raw=1`) → native <audio>/<video>
 *   - YouTube (watch, youtu.be, shorts, embed, music.youtube.com) → YouTube player
 */
export type MediaSource =
  | { kind: "file"; src: string }
  | { kind: "youtube"; videoId: string; start: number }
  | { kind: "unsupported"; reason: string };

const YT_ID = /^[\w-]{11}$/;

/** Parses "90", "90s", "1m30s", "1h2m3s" into seconds. */
function parseStart(value: string | null): number {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

/** undefined = not a YouTube link; null = a YouTube link without a video (channel, search…). */
function youTubeId(url: URL): string | null | undefined {
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  if (host === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
  if (host !== "youtube.com" && host !== "youtube-nocookie.com") return undefined;
  if (url.pathname === "/watch") return url.searchParams.get("v");
  const [, kind, id] = url.pathname.split("/");
  return ["embed", "shorts", "live", "v"].includes(kind) ? id ?? null : null;
}

export function resolveMediaSource(raw: string): MediaSource {
  // Relative paths (e.g. "/music/song.mp3") are files served from /public.
  if (raw.startsWith("/")) return { kind: "file", src: raw };

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { kind: "unsupported", reason: "This link isn't a valid URL." };
  }

  const ytId = youTubeId(url);
  if (ytId !== undefined) {
    if (!ytId || !YT_ID.test(ytId)) {
      return { kind: "unsupported", reason: "That YouTube link doesn't point to a video. Paste a video link (youtube.com/watch?v=…)." };
    }
    // Playlist/radio params (list=, start_radio=) are ignored: we loop the single video.
    return { kind: "youtube", videoId: ytId, start: parseStart(url.searchParams.get("t") ?? url.searchParams.get("start")) };
  }

  if (/(^|\.)(spotify\.com|soundcloud\.com|zingmp3\.vn|nhaccuatui\.com|apple\.com)$/.test(url.hostname)) {
    return { kind: "unsupported", reason: `Links from ${url.hostname} can't be played here. Use a YouTube link or a direct media file.` };
  }
  // Anything else is assumed to be a direct file; <audio>/<video> report an error if it isn't.
  return { kind: "file", src: url.toString() };
}
