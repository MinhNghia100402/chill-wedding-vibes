import { Heart } from "lucide-react";
import { Heading } from "@/components/ui/Heading";
import { formatWeddingDate } from "@/lib/date";
import type { Hero } from "@/lib/types";

export function Footer({ hero }: { hero: Hero }) {
  return (
    <footer className="bg-primary px-4 pb-28 pt-16 text-center text-on-primary sm:pb-16">
      <Heading as="p" size="lg">
        {hero.names}
      </Heading>
      <p className="mt-2 text-sm opacity-80">
        {formatWeddingDate(hero.date, hero.timeZone)} · {hero.location}
      </p>
      <p className="mt-8 inline-flex items-center gap-1.5 text-xs opacity-70">
        Made with <Heart className="h-3 w-3" fill="currentColor" aria-label="love" /> for our favourite people
      </p>
    </footer>
  );
}
