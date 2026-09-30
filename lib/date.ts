/** Formats an ISO timestamp in the couple's local time zone. */
export function formatWeddingDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone,
  }).format(new Date(iso));
}

export function formatDeadline(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

/** RSVPs stay open through the whole deadline day (UTC). */
export function isRsvpOpen(deadline: string, now: Date = new Date()): boolean {
  return now.getTime() <= new Date(`${deadline}T23:59:59.999Z`).getTime();
}

/** Google Calendar "template" link — works without any API key. */
export function googleCalendarUrl(opts: {
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  details?: string;
}): string {
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${fmt(opts.startsAt)}/${fmt(opts.endsAt)}`,
    location: opts.location,
    details: opts.details ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
