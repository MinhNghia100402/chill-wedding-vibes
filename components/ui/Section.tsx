import type { ReactNode } from "react";
import { Heading } from "@/components/ui/Heading";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

interface SectionProps {
  id: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  tone?: "canvas" | "alt";
  className?: string;
  children: ReactNode;
}

/** Standard page section: anchor target, animated heading, consistent spacing. */
export function Section({ id, eyebrow, title, intro, tone = "canvas", className, children }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        // overflow-x-clip: slide-in reveals must not cause sideways scroll on mobile.
        "scroll-mt-20 overflow-x-clip px-4 py-20 sm:px-6 sm:py-28",
        tone === "alt" ? "bg-canvas-alt" : "bg-canvas",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          {eyebrow && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
          )}
          <Heading className="text-accent">{title}</Heading>
          <div aria-hidden className="mx-auto mt-5 h-px w-16 bg-primary/60" />
          {intro && <p className="mt-6 text-base leading-relaxed text-on-canvas/75 sm:text-lg">{intro}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  );
}
