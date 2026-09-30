"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircleHeart } from "lucide-react";
import { useEffect, useState } from "react";
import { GuestbookCard } from "@/components/guestbook/GuestbookCard";
import { useGuestbook } from "@/components/guestbook/GuestbookProvider";
import { buttonClasses } from "@/components/ui/button-styles";

const PAGE_SIZE = 9;

/**
 * Masonry wall (CSS columns). Every card has `layout`, so when a new wish is
 * prepended Framer Motion FLIP-animates the existing cards to their new spots
 * while the new one springs in.
 */
export function GuestbookWall({ timeZone }: { timeZone: string }) {
  const { entries, lastAddedId } = useGuestbook();
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
      <div className="rounded-3xl border-2 border-dashed border-primary/25 px-6 py-16 text-center">
        <MessageCircleHeart className="mx-auto h-10 w-10 text-accent" aria-hidden />
        <p className="mt-4 font-medium">No wishes yet</p>
        <p className="mt-1 text-sm text-on-canvas/65">Be the first to leave a message for the happy couple!</p>
      </div>
    );
  }

  const shown = entries.slice(0, visible);

  return (
    <div>
      <ul aria-label="Guestbook wishes" aria-live="polite" className="columns-1 gap-5 sm:columns-2">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((entry) => (
            <motion.li
              key={entry.id}
              layout
              initial={{ opacity: 0, scale: 0.85, y: -24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="mb-5 break-inside-avoid"
            >
              <GuestbookCard entry={entry} timeZone={timeZone} highlight={entry.id === highlightId} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {entries.length > visible && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className={buttonClasses("outline")}
          >
            Show more wishes ({entries.length - visible})
          </button>
        </div>
      )}
    </div>
  );
}
