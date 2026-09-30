import { BedDouble, ExternalLink } from "lucide-react";
import { buttonClasses } from "@/components/ui/button-styles";
import { Heading } from "@/components/ui/Heading";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import type { Travel } from "@/lib/types";

export function TravelSection({ travel }: { travel: Travel }) {
  return (
    <Section id="travel" eyebrow="Getting there" title="Travel & Stay" intro={travel.intro}>
      <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
        {travel.hotels.map((hotel, index) => (
          <Reveal key={hotel.name} delay={index * 0.1}>
            <article className="flex h-full items-start gap-4 rounded-3xl bg-surface p-6 text-on-surface ring-1 ring-primary/10">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-accent">
                <BedDouble className="h-5 w-5" aria-hidden />
              </span>
              <div className="flex-1">
                <Heading as="h3" size="md">
                  {hotel.name}
                </Heading>
                <p className="mt-1 text-sm opacity-75">{hotel.distance}</p>
                {hotel.note && <p className="mt-2 text-sm font-medium text-accent">{hotel.note}</p>}
                <a
                  href={hotel.bookingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("outline", "mt-4 px-4 py-2 text-xs")}
                >
                  Book a room <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
