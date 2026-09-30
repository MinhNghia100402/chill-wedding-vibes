/**
 * Data contract for a single tenant (couple). Everything rendered on a
 * couple's site comes from one of these objects — components never hold
 * couple-specific copy of their own.
 */

export type FontName =
  | "Playfair Display"
  | "Lato"
  | "Cormorant Garamond"
  | "Montserrat"
  | "Great Vibes"
  | "Be Vietnam Pro";

export interface Theme {
  primaryColor: string;
  secondaryColor: string;
  headingFont: FontName;
  bodyFont: FontName;
}

export interface Seo {
  title: string;
  description: string;
}

export interface Hero {
  names: string;
  /** ISO-8601 timestamp of the ceremony; drives the countdown. */
  date: string;
  /** IANA time zone used to display the date in the couple's local time. */
  timeZone: string;
  location: string;
  backgroundImage: string;
  tagline: string;
}

/** The couple's journey / pre-wedding film. `url`: YouTube link or direct .mp4/.webm file. */
export interface Film {
  title: string;
  description?: string;
  url: string;
  /** Optional cover image; YouTube films fall back to the video thumbnail. */
  poster?: string;
}

export interface TimelineItem {
  date: string;
  title: string;
  description: string;
  image: string;
}

export interface Story {
  title: string;
  content: string;
  timeline: TimelineItem[];
}

export interface WeddingEvent {
  name: string;
  /** ISO-8601 start/end; used for the "Add to calendar" link. */
  startsAt: string;
  endsAt: string;
  time: string;
  locationName: string;
  address: string;
  mapUrl: string;
  dressCode?: string;
  description?: string;
}

export interface Hotel {
  name: string;
  distance: string;
  bookingLink: string;
  note?: string;
}

export interface Travel {
  intro?: string;
  hotels: Hotel[];
}

export interface GalleryImage {
  src: string;
  alt: string;
}

export interface BankAccount {
  /** Whose account this is, e.g. "Bride" or "Groom". */
  label: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  /** String encoded into the QR code (EMVCo / VietQR payload, IBAN, payment URL…). */
  qrPayload: string;
}

export interface RegistryLink {
  store: string;
  url: string;
}

export interface Registry {
  message: string;
  links: RegistryLink[];
  accounts: BankAccount[];
}

export interface RsvpConfig {
  /** ISO date (YYYY-MM-DD); RSVPs close at the end of this day, UTC. */
  deadline: string;
  maxGuests: number;
  askDietary: boolean;
  askSong: boolean;
}

export interface Music {
  title: string;
  artist: string;
  url: string;
  /**
   * Start automatically (default true). Browsers only allow sound after the
   * guest interacts, so the music begins on their first tap/click/key press.
   */
  autoplay?: boolean;
}

export type GuestbookMediaType = "text" | "image" | "video";

export interface GuestbookConfig {
  allowPhotos: boolean;
  allowVideos: boolean;
  /** When true, new wishes are hidden from the public wall until approved. */
  requireApproval: boolean;
  maxFileSizeMB: number;
}

export interface GuestbookEntry {
  id: string;
  authorName: string;
  message: string;
  mediaType: GuestbookMediaType;
  mediaUrl: string | null;
  /** ISO-8601 timestamp. */
  timestamp: string;
  status?: "approved" | "pending";
  /** Hearts from other guests (seed/mock value; the visitor's own like is added client-side). */
  likes?: number;
}

export interface Couple {
  id: string;
  slug: string;
  seo: Seo;
  theme: Theme;
  hero: Hero;
  story: Story;
  film?: Film;
  events: WeddingEvent[];
  travel?: Travel;
  gallery: GalleryImage[];
  registry?: Registry;
  rsvpConfig: RsvpConfig;
  guestbookConfig?: GuestbookConfig;
  guestbookEntries?: GuestbookEntry[];
  music?: Music;
}

export type CoupleDatabase = Record<string, Couple>;
