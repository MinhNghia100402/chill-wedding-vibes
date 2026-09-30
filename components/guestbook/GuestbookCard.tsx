"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, Quote } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useOptionalTheme } from "@/components/theme/ThemeProvider";
import { isScriptFont } from "@/lib/font-registry";
import type { GuestbookEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Formatted in the couple's time zone so server and client output match. */
function formatTimestamp(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone }).format(new Date(iso));
}

/**
 * A stable, "random-looking" tilt per card. Derived from the id (not Math.random)
 * so the server render and the browser agree — no hydration mismatch.
 */
const TILTS = [-2.5, 1.75, -1.25, 2.25, -1.75, 1.25];
export function tiltFor(id: string): number {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return TILTS[Math.abs(hash) % TILTS.length];
}

/* ------------------------------------------------------------------ */
/* Heart / like button with a little burst                             */
/* ------------------------------------------------------------------ */

const BURST = Array.from({ length: 7 }, (_, i) => {
  const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
  return { x: Math.cos(angle) * 26, y: Math.sin(angle) * 26 - 6, delay: i * 0.015 };
});

function LikeButton({
  count,
  liked,
  author,
  onToggle,
}: {
  count: number;
  liked: boolean;
  author: string;
  onToggle: () => void;
}) {
  const [bursts, setBursts] = useState<number[]>([]);

  function handleClick() {
    if (!liked) setBursts((b) => [...b, Date.now()]);
    onToggle();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={liked}
      aria-label={`${liked ? "Unlike" : "Like"} the wish from ${author} (${count} ${count === 1 ? "heart" : "hearts"})`}
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        liked ? "bg-primary/10 text-accent" : "text-on-surface/60 hover:bg-primary/5 hover:text-accent",
      )}
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        <motion.span
          animate={liked ? { scale: [1, 1.45, 0.9, 1.12, 1] } : { scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex"
        >
          <Heart className="h-5 w-5" fill={liked ? "currentColor" : "none"} aria-hidden />
        </motion.span>

        {/* Burst of tiny hearts on each new like */}
        {bursts.map((key) => (
          <span key={key} aria-hidden className="pointer-events-none absolute inset-0">
            {BURST.map((p, i) => (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 text-primary"
                initial={{ x: "-50%", y: "-50%", scale: 0.4, opacity: 1 }}
                animate={{ x: `calc(-50% + ${p.x}px)`, y: `calc(-50% + ${p.y}px)`, scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.7, delay: p.delay, ease: "easeOut" }}
                onAnimationComplete={() => i === 0 && setBursts((b) => b.filter((k) => k !== key))}
              >
                <Heart className="h-2.5 w-2.5" fill="currentColor" />
              </motion.span>
            ))}
          </span>
        ))}
      </span>

      {/* Count rolls up/down when it changes */}
      <span className="relative inline-flex min-w-[1.5ch] justify-start overflow-hidden tabular-nums">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={count}
            initial={{ y: liked ? 12 : -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: liked ? -12 : 12, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {count}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

function Media({ entry }: { entry: GuestbookEntry }) {
  const headingFont = useOptionalTheme()?.theme.headingFont;
  if (!entry.mediaUrl || entry.mediaType === "text") {
    // Text-only wishes become a soft "note" in the photo slot. Long messages in a script
    // face are hard to read, so script themes get an italic serif here instead.
    const scriptHeading = headingFont !== undefined && isScriptFont(headingFont);
    return (
      <div className="flex min-h-[9rem] flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-5 py-8 text-center">
        <Quote className="h-6 w-6 text-primary/50" aria-hidden />
        <p
          className={cn(
            "whitespace-pre-line break-words leading-snug",
            scriptHeading ? "font-serif text-lg italic" : "font-heading text-xl",
          )}
        >
          {entry.message}
        </p>
      </div>
    );
  }
  if (entry.mediaType === "video") {
    return (
      <video
        src={entry.mediaUrl}
        controls
        playsInline
        preload="metadata"
        className="aspect-[4/3] w-full bg-black object-cover"
        aria-label={`Video from ${entry.authorName}`}
      />
    );
  }
  return (
    <Image
      src={entry.mediaUrl}
      alt={`Photo from ${entry.authorName}`}
      width={800}
      height={800}
      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
      // Freshly uploaded files are local blob: URLs, which the optimiser can't fetch.
      unoptimized={entry.mediaUrl.startsWith("blob:")}
      draggable={false}
      className="h-auto w-full select-none object-cover"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Polaroid card                                                       */
/* ------------------------------------------------------------------ */

export function GuestbookCard({
  entry,
  timeZone,
  highlight,
  liked,
  onToggleLike,
}: {
  entry: GuestbookEntry;
  timeZone: string;
  highlight?: boolean;
  liked: boolean;
  onToggleLike: () => void;
}) {
  const [bigHeart, setBigHeart] = useState(0);
  const pending = entry.status === "pending";
  const isLocal = entry.id.startsWith("local_");
  const hasMedia = Boolean(entry.mediaUrl) && entry.mediaType !== "text";
  const count = (entry.likes ?? 0) + (liked ? 1 : 0);

  // Double-click / double-tap the photo to heart it (never un-hearts).
  function heartFromPhoto() {
    setBigHeart((n) => n + 1);
    if (!liked) onToggleLike();
  }

  return (
    <motion.article
      initial={false}
      animate={{ rotate: tiltFor(entry.id) }}
      whileHover={{ rotate: 0, y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn(
        "relative rounded-[3px] bg-surface p-3 pb-4 text-on-surface",
        "shadow-[0_14px_30px_-14px_rgb(var(--color-on-secondary-rgb)/0.45)] ring-1 ring-on-surface/5",
        "transition-shadow duration-300 hover:shadow-[0_24px_45px_-18px_rgb(var(--color-primary-rgb)/0.55)]",
        highlight && "ring-2 ring-primary",
        pending && "opacity-90",
      )}
    >
      {/* Washi tape */}
      <span
        aria-hidden
        className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-[2px] bg-primary/25 shadow-sm backdrop-blur-[1px]"
      />

      <div
        className="relative overflow-hidden rounded-[2px] bg-on-surface/5"
        onDoubleClick={hasMedia ? heartFromPhoto : undefined}
      >
        <Media entry={entry} />
        <AnimatePresence>
          {bigHeart > 0 && (
            <motion.span
              key={bigHeart}
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center text-white drop-shadow-lg"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.25, 1], opacity: [0, 1, 1] }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.45 }}
              onAnimationComplete={() => window.setTimeout(() => setBigHeart(0), 350)}
            >
              <Heart className="h-20 w-20" fill="currentColor" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* The Polaroid's wide bottom margin: caption, signature, hearts */}
      <div className="px-1.5 pt-4">
        {hasMedia && <p className="whitespace-pre-line break-words text-[0.95rem] leading-relaxed">{entry.message}</p>}
        <div className={cn("flex items-end justify-between gap-3", hasMedia && "mt-3")}>
          <div className="min-w-0">
            <p className="truncate font-heading text-xl leading-tight text-accent">— {entry.authorName}</p>
            <time dateTime={entry.timestamp} className="text-xs opacity-60">
              {isLocal ? "Just now" : formatTimestamp(entry.timestamp, timeZone)}
            </time>
          </div>
          <LikeButton count={count} liked={liked} author={entry.authorName} onToggle={onToggleLike} />
        </div>

        {pending && (
          <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-accent">
            Awaiting the couple&apos;s approval — only you can see this for now.
          </p>
        )}
      </div>
    </motion.article>
  );
}
