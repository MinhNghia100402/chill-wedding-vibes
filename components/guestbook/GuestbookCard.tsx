"use client";

import { Clock, Quote } from "lucide-react";
import Image from "next/image";
import type { GuestbookEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "♥";

/** Formatted in the couple's time zone so server and client output match. */
function formatTimestamp(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(iso));
}

function Media({ entry }: { entry: GuestbookEntry }) {
  if (!entry.mediaUrl || entry.mediaType === "text") return null;

  if (entry.mediaType === "video") {
    return (
      <video
        src={entry.mediaUrl}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full bg-black object-cover"
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
      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      // Freshly uploaded files are local blob: URLs, which the optimiser can't fetch.
      unoptimized={entry.mediaUrl.startsWith("blob:")}
      className="h-auto w-full object-cover"
    />
  );
}

export function GuestbookCard({
  entry,
  timeZone,
  highlight,
}: {
  entry: GuestbookEntry;
  timeZone: string;
  highlight?: boolean;
}) {
  const pending = entry.status === "pending";
  const isLocal = entry.id.startsWith("local_");

  return (
    <article
      className={cn(
        "overflow-hidden rounded-3xl bg-surface text-on-surface shadow-lg shadow-on-canvas/5 ring-1 transition-shadow duration-700",
        highlight ? "shadow-primary/30 ring-2 ring-primary" : "ring-primary/10",
        pending && "opacity-80",
      )}
    >
      <Media entry={entry} />
      <div className="p-5">
        <Quote className="h-5 w-5 text-primary/40" aria-hidden />
        <p className="mt-2 whitespace-pre-line break-words leading-relaxed">{entry.message}</p>
        <footer className="mt-5 flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary"
          >
            {initials(entry.authorName)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{entry.authorName}</p>
            <p className="flex items-center gap-1 text-xs opacity-60">
              <Clock className="h-3 w-3" aria-hidden />
              <time dateTime={entry.timestamp}>{isLocal ? "Just now" : formatTimestamp(entry.timestamp, timeZone)}</time>
            </p>
          </div>
        </footer>
        {pending && (
          <p className="mt-4 rounded-xl bg-primary/10 px-3 py-2 text-xs font-medium text-accent">
            Awaiting the couple&apos;s approval — only you can see this for now.
          </p>
        )}
      </div>
    </article>
  );
}
