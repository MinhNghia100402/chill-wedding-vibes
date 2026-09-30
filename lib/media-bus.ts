/**
 * Tiny page-wide signal so only one thing plays sound at a time. Whatever
 * starts playing (background music, the couple's film) claims the audio, and
 * every other player pauses itself.
 */
export type AudioOwner = "music" | "film";

const EVENT = "wedding:audio-claimed";

export function claimAudio(owner: AudioOwner) {
  window.dispatchEvent(new CustomEvent<AudioOwner>(EVENT, { detail: owner }));
}

/** Calls `pause` whenever someone other than `self` claims the audio. Returns an unsubscribe fn. */
export function onAudioClaimed(self: AudioOwner, pause: () => void) {
  const handler = (event: Event) => {
    if ((event as CustomEvent<AudioOwner>).detail !== self) pause();
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
