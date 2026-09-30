"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircleHeart } from "lucide-react";
import { useEffect, useState } from "react";
import { GuestbookCard } from "@/components/guestbook/GuestbookCard";
import { useGuestbook } from "@/components/guestbook/GuestbookProvider";
import { buttonClasses } from "@/components/ui/button-styles";

const PAGE_SIZE = 9;

/**
 * "Wall of Love": a CSS-columns masonry of Polaroid cards. Every card has
 * `layout`, so when a new wish is prepended Framer Motion FLIP-animates the
 * others to their new spots while the new one drops in.
 */
export function GuestbookWall({ timeZone }: { timeZone: string }) {
  const { entries, lastAddedId, likedIds, toggleLike } = useGuestbook();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    if (!lastAddedId) return;
    setHighlightId(lastAddedId);
    setVisible((v) => v + 1); // keep the previously visible cards on screen
    const id = window.setTimeout(() => setHighlightId(null), 4000);
    return () => window.clearTimeout(id);
  }, [lastAddedId]);

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border-2 border-dashed border-primary/25 px-6 py-16 text-center">
        <MessageCircleHeart className="mx-auto h-10 w-10 text-accent" aria-hidden />
        <p className="mt-4 font-medium">No wishes yet</p>
        <p className="mt-1 text-sm text-on-canvas/65">Be the first to leave a little love for the happy couple!</p>
      </div>
    );
  }

  return (
    <div>
      <ul aria-label="Guestbook wishes" aria-live="polite" className="columns-1 gap-7 sm:columns-2 lg:columns-3">
        <AnimatePresence initial={false} mode="popLayout">
          {entries.slice(0, visible).map((entry) => (
            <motion.li
              key={entry.id}
              layout
              initial={{ opacity: 0, y: -40, scale: 0.8, rotate: -8 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              // pt leaves room for the washi tape that sticks out above each card
              className="mb-8 break-inside-avoid px-1 pt-4"
            >
              <GuestbookCard
                entry={entry}
                timeZone={timeZone}
                highlight={entry.id === highlightId}
                liked={likedIds.has(entry.id)}
                onToggleLike={() => toggleLike(entry.id)}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {entries.length > visible && (
        <div className="mt-2 text-center">
          <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className={buttonClasses("outline")}>
            Show more wishes ({entries.length - visible})
          </button>
        </div>
      )}
    </div>
  );
}
