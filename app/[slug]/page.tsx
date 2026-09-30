import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuestbookProvider } from "@/components/guestbook/GuestbookProvider";
import { GuestbookSection } from "@/components/guestbook/GuestbookSection";
import { AudioPlayer } from "@/components/sections/AudioPlayer";
import { EventsSection } from "@/components/sections/EventsSection";
import { FilmSection } from "@/components/sections/FilmSection";
import { Footer } from "@/components/sections/Footer";
import { GallerySection } from "@/components/sections/GallerySection";
import { GiftSection } from "@/components/sections/GiftSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { Navigation, type NavItem } from "@/components/sections/Navigation";
import { RSVPForm } from "@/components/sections/RSVPForm";
import { StorySection } from "@/components/sections/StorySection";
import { TravelSection } from "@/components/sections/TravelSection";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { getAllSlugs, getCoupleBySlug } from "@/lib/couples";
import { isRsvpOpen } from "@/lib/date";
import type { Couple } from "@/lib/types";

type Params = Promise<{ slug: string }>;

/** Pre-render every known couple at build time… */
export async function generateStaticParams() {
  return (await getAllSlugs()).map((slug) => ({ slug }));
}

/** …and 404 anything else without touching the data layer. */
export const dynamicParams = false;

/** Re-render hourly so time-based state (RSVP deadline) stays fresh. */
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const couple = await getCoupleBySlug((await params).slug);
  if (!couple) return { title: "Wedding not found" };

  return {
    title: couple.seo.title,
    description: couple.seo.description,
    openGraph: {
      title: couple.seo.title,
      description: couple.seo.description,
      type: "website",
      images: [{ url: couple.hero.backgroundImage, width: 2000, height: 1333, alt: couple.hero.names }],
    },
    twitter: { card: "summary_large_image", title: couple.seo.title, description: couple.seo.description },
  };
}

/** Navigation only lists sections this couple actually has content for. */
function buildNavItems(couple: Couple): NavItem[] {
  const items: (NavItem | false)[] = [
    { id: "home", label: "Home" },
    couple.story.timeline.length > 0 && { id: "story", label: "Our Story" },
    Boolean(couple.film) && { id: "film", label: "Film" },
    couple.events.length > 0 && { id: "events", label: "Events" },
    Boolean(couple.travel?.hotels.length) && { id: "travel", label: "Travel" },
    couple.gallery.length > 0 && { id: "gallery", label: "Gallery" },
    Boolean(couple.guestbookConfig) && { id: "guestbook", label: "Guestbook" },
    { id: "rsvp", label: "RSVP" },
    Boolean(couple.registry) && { id: "gifts", label: "Gifts" },
  ];
  return items.filter((item): item is NavItem => Boolean(item));
}

export default async function CouplePage({ params }: { params: Params }) {
  const couple = await getCoupleBySlug((await params).slug);
  if (!couple) notFound();

  // Only approved wishes are public; pending ones stay server-side until moderated.
  const publicEntries = (couple.guestbookEntries ?? []).filter((entry) => entry.status !== "pending");

  const page = (
    <>
      <Navigation brand={couple.hero.names} items={buildNavItems(couple)} />
      <main>
        <HeroSection hero={couple.hero} />
        {couple.story.timeline.length > 0 && <StorySection story={couple.story} />}
        {couple.film && <FilmSection film={couple.film} />}
        {couple.events.length > 0 && <EventsSection events={couple.events} coupleNames={couple.hero.names} />}
        {couple.travel && couple.travel.hotels.length > 0 && <TravelSection travel={couple.travel} />}
        {couple.gallery.length > 0 && <GallerySection images={couple.gallery} />}
        {couple.guestbookConfig && <GuestbookSection timeZone={couple.hero.timeZone} />}
        <RSVPForm slug={couple.slug} config={couple.rsvpConfig} isOpen={isRsvpOpen(couple.rsvpConfig.deadline)} />
        {couple.registry && <GiftSection registry={couple.registry} />}
      </main>
      <Footer hero={couple.hero} />
      {couple.music && <AudioPlayer track={couple.music} />}
      <ThemeSwitcher />
    </>
  );

  return (
    <ThemeProvider initialTheme={couple.theme}>
      {couple.guestbookConfig ? (
        <GuestbookProvider config={couple.guestbookConfig} initialEntries={publicEntries}>
          {page}
        </GuestbookProvider>
      ) : (
        page
      )}
    </ThemeProvider>
  );
}
