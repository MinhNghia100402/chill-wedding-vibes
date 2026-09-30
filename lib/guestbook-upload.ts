import type { GuestbookConfig, GuestbookMediaType } from "@/lib/types";

/**
 * Client-side media handling for the guestbook.
 *
 * `uploadMedia` is a MOCK: it simulates network progress, then returns a local
 * object URL so the new card can show the file immediately. To go live, keep
 * the signature and replace the body with a real upload, e.g.
 *   - Supabase: supabase.storage.from("guestbook").upload(path, file) → getPublicUrl(path)
 *   - Cloudinary: POST the file to https://api.cloudinary.com/v1_1/<cloud>/auto/upload
 *     (use XMLHttpRequest's `upload.onprogress` to drive `onProgress`).
 */

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export function mediaTypeOf(file: File): Exclude<GuestbookMediaType, "text"> | null {
  if (IMAGE_TYPES.includes(file.type)) return "image";
  if (VIDEO_TYPES.includes(file.type)) return "video";
  return null;
}

/** The `accept` attribute for the file input, derived from what the couple allows. */
export function acceptAttribute(config: GuestbookConfig): string {
  return [...(config.allowPhotos ? IMAGE_TYPES : []), ...(config.allowVideos ? VIDEO_TYPES : [])].join(",");
}

/** Returns a user-facing error, or null if the file is acceptable. */
export function validateFile(file: File, config: GuestbookConfig): string | null {
  const type = mediaTypeOf(file);
  if (!type) return "Unsupported file. Please choose a JPG, PNG, WebP or GIF image, or an MP4/WebM/MOV video.";
  if (type === "image" && !config.allowPhotos) return "Photos aren't enabled for this guestbook.";
  if (type === "video" && !config.allowVideos) return "Videos aren't enabled for this guestbook — try a photo instead.";
  if (file.size > config.maxFileSizeMB * 1024 * 1024) {
    return `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${config.maxFileSizeMB} MB.`;
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface UploadOptions {
  onProgress: (percent: number) => void;
  signal?: AbortSignal;
}

/** Resolves after `ms` (mock network latency); rejects with AbortError if cancelled. */
export function mockDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(id);
        reject(new DOMException("Cancelled", "AbortError"));
      },
      { once: true },
    );
  });
}

/** Mock upload: ~1.5 s of simulated progress (a little longer for big files, max 2.5 s). */
export function uploadMedia(file: File, { onProgress, signal }: UploadOptions): Promise<{ url: string }> {
  const duration = Math.min(2500, 1500 + file.size / 200_000);
  const started = performance.now();

  return new Promise((resolve, reject) => {
    const abort = () => {
      window.clearInterval(timer);
      reject(new DOMException("Upload cancelled", "AbortError"));
    };
    const timer = window.setInterval(() => {
      // Ease-out curve so it feels like a real transfer rather than a linear bar.
      const t = Math.min(1, (performance.now() - started) / duration);
      onProgress(Math.round((1 - (1 - t) ** 2) * 100));
      if (t >= 1) {
        window.clearInterval(timer);
        signal?.removeEventListener("abort", abort);
        resolve({ url: URL.createObjectURL(file) });
      }
    }, 80);
    if (signal?.aborted) abort();
    signal?.addEventListener("abort", abort, { once: true });
  });
}
