import { CalendarPlus, Clock, MapPin, Shirt } from "lucide-react";
import { buttonClasses } from "@/components/ui/button-styles";
import { Heading } from "@/components/ui/Heading";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { googleCalendarUrl } from "@/lib/date";
import type { WeddingEvent } from "@/lib/types";

export function EventsSection({ events, coupleNames }: { events: WeddingEvent[]; coupleNames: string }) {
  return (
    <Section id="events" eyebrow="The celebration" title="Wedding Events" tone="alt">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event, index) => (
          <Reveal key={event.name} delay={index * 0.1} className="h-full">
            <article className="flex h-full flex-col rounded-3xl bg-surface p-7 text-on-surface shadow-lg shadow-on-canvas/5 ring-1 ring-primary/10 transition-transform duration-300 hover:-translate-y-1">
              <Heading as="h3" size="md" className="text-accent">
                {event.name}
              </Heading>
              {event.description && <p className="mt-3 text-sm leading-relaxed opacity-75">{event.description}</p>}

              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex gap-3">
                  <dt className="sr-only">Time</dt>
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <dd>{event.time}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="sr-only">Location</dt>
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <dd>
                    <span className="block font-semibold">{event.locationName}</span>
                    <span className="opacity-75">{event.address}</span>
                  </dd>
                </div>
                {event.dressCode && (
                  <div className="flex gap-3">
                    <dt className="sr-only">Dress code</dt>
                    <Shirt className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                    <dd>{event.dressCode}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-auto flex flex-wrap gap-2 pt-7">
                <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses("solid")}>
                  <MapPin className="h-4 w-4" aria-hidden />
                  View Map
                </a>
                <a
                  href={googleCalendarUrl({
                    title: `${coupleNames} — ${event.name}`,
                    startsAt: event.startsAt,
                    endsAt: event.endsAt,
                    location: `${event.locationName}, ${event.address}`,
                    details: event.description,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("outline")}
                >
                  <CalendarPlus className="h-4 w-4" aria-hidden />
                  Add to calendar
                </a>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
