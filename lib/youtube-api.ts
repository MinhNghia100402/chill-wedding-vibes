declare global {
  interface Window {
    /** Called by https://www.youtube.com/iframe_api once the API is ready. */
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youTubeApi: Promise<typeof YT> | null = null;

/** Loads the YouTube IFrame Player API once per page (client-only). */
export function loadYouTubeApi(): Promise<typeof YT> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  youTubeApi ??= new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      youTubeApi = null;
      script.remove();
      reject(new Error("Failed to load the YouTube player"));
    };
    document.head.appendChild(script);
  });
  return youTubeApi;
}
