"use client";

import { useRef } from "react";
import { GuestbookForm } from "@/components/guestbook/GuestbookForm";
import { useGuestbook } from "@/components/guestbook/GuestbookProvider";
import { GuestbookWall } from "@/components/guestbook/GuestbookWall";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";

export function GuestbookSection({ timeZone }: { timeZone: string }) {
  const { config, entries } = useGuestbook();
  const wallRef = useRef<HTMLDivElement>(null);
  const media = [config.allowPhotos && "photos", config.allowVideos && "short videos"].filter(Boolean).join(" or ");

  function scrollToWall() {
    const wall = wallRef.current;
    // Only needed when the wall is below the form (mobile) and out of view.
    if (wall && wall.getBoundingClientRect().top > window.innerHeight * 0.6) {
      wall.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <Section
      id="guestbook"
      eyebrow="Leave some love"
      title="Digital Guestbook"
      intro={`Write a wish${media ? `, share ${media},` : ""} and see it appear on the wall. ${entries.length} ${entries.length === 1 ? "wish" : "wishes"} so far.`}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start">
        <Reveal className="lg:sticky lg:top-24">
          <GuestbookForm onPosted={scrollToWall} />
        </Reveal>
        <div ref={wallRef} className="scroll-mt-24">
          <GuestbookWall timeZone={timeZone} />
        </div>
      </div>
    </Section>
  );
}
