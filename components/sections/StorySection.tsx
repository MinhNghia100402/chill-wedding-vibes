import { Heart } from "lucide-react";
import Image from "next/image";
import { Heading } from "@/components/ui/Heading";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/utils";
import type { Story } from "@/lib/types";

export function StorySection({ story }: { story: Story }) {
  return (
    <Section id="story" eyebrow="Our journey" title={story.title} intro={story.content}>
      <ol className="relative">
        {/* Rail: left edge on mobile, centred on desktop. */}
        <div aria-hidden className="absolute bottom-0 left-4 top-0 w-px bg-primary/30 md:left-1/2 md:-translate-x-1/2" />

        {story.timeline.map((item, index) => {
          const imageLeft = index % 2 === 0;
          return (
            <li key={`${item.date}-${item.title}`} className="relative pb-14 pl-12 last:pb-0 md:pl-0">
              <span
                aria-hidden
                className="absolute left-4 top-2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-on-primary shadow-md ring-4 ring-canvas md:left-1/2"
              >
                <Heart className="h-4 w-4" fill="currentColor" />
              </span>

              <div className="grid items-center gap-6 md:grid-cols-2 md:gap-16">
                <Reveal
                  direction={imageLeft ? "left" : "right"}
                  className={cn(!imageLeft && "md:order-2")}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl shadow-on-canvas/10">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(min-width: 768px) 45vw, 90vw"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                </Reveal>

                <Reveal
                  direction={imageLeft ? "right" : "left"}
                  delay={0.1}
                  className={cn(imageLeft ? "md:text-left" : "md:order-1 md:text-right")}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">{item.date}</p>
                  <Heading as="h3" size="lg" className="mt-2">
                    {item.title}
                  </Heading>
                  <p className="mt-3 leading-relaxed text-on-canvas/75">{item.description}</p>
                </Reveal>
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
