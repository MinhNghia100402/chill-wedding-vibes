"use client";

import { Heart } from "lucide-react";
import { useRef } from "react";
import { GuestbookForm } from "@/components/guestbook/GuestbookForm";
import { GuestbookProvider, useGuestbook } from "@/components/guestbook/GuestbookProvider";
import { GuestbookWall } from "@/components/guestbook/GuestbookWall";
import { Heading } from "@/components/ui/Heading";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import type { GuestbookConfig, GuestbookEntry } from "@/lib/types";

export interface DigitalGuestbookProps {
  /** Couple slug; namespaces the visitor's hearts in localStorage. */
  slug: string;
  config: GuestbookConfig;
  /** Approved wishes only. Pending ones must be filtered out on the server. */
  entries: GuestbookEntry[];
  /** Couple's IANA time zone, used to format wish dates consistently. */
  timeZone: string;
}

/**
 * The Digital Guestbook: a glassmorphism submission form above a Polaroid
 * "Wall of Love". Owns its own state provider, so the page only renders
 * `<DigitalGuestbook … />`. Every colour comes from the theme's CSS variables,
 * so it re-themes live with the ThemeSwitcher.
 */
export function DigitalGuestbook({ slug, config, entries, timeZone }: DigitalGuestbookProps) {
  return (
    <GuestbookProvider slug={slug} config={config} initialEntries={entries}>
      <GuestbookContent timeZone={timeZone} />
    </GuestbookProvider>
  );
}

function GuestbookContent({ timeZone }: { timeZone: string }) {
  const { config, entries } = useGuestbook();
  const wallRef = useRef<HTMLDivElement>(null);
  const media = [config.allowPhotos && "a photo", config.allowVideos && "a short video"].filter(Boolean).join(" or ");
  const count = entries.length;

  function scrollToWall() {
    const wall = wallRef.current;
    // Only needed when the wall is out of view below the form.
    if (wall && wall.getBoundingClientRect().top > window.innerHeight * 0.6) {
      wall.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <Section
      id="guestbook"
      eyebrow="Leave some love"
      title="Digital Guestbook"
      intro={`Write a wish${media ? `, add ${media},` : ""} and pin it to our wall of love.`}
    >
      {/* Soft theme-coloured glow behind the glass form, so the blur has something to blur. */}
      <div className="relative mx-auto max-w-2xl">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -left-10 top-6 h-56 w-56 rounded-full bg-primary/30 blur-3xl sm:-left-24" />
          <div className="absolute -right-8 bottom-4 h-64 w-64 rounded-full bg-accent/20 blur-3xl sm:-right-24" />
        </div>
        <Reveal className="relative">
          <GuestbookForm onPosted={scrollToWall} />
        </Reveal>
      </div>

      <div ref={wallRef} className="mt-20 scroll-mt-24">
        <Reveal className="mb-10 flex items-center justify-center gap-3 text-center">
          <Heart className="h-5 w-5 text-primary" fill="currentColor" aria-hidden />
          <Heading as="h3" size="lg" className="text-accent">
            Wall of Love
          </Heading>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-accent">
            {count} {count === 1 ? "wish" : "wishes"}
          </span>
        </Reveal>
        <GuestbookWall timeZone={timeZone} />
      </div>
    </Section>
  );
}
