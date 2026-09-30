import { FilmPlayer } from "@/components/sections/FilmPlayer";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import type { Film } from "@/lib/types";

/** The couple's journey film (YouTube link or direct video file). */
export function FilmSection({ film }: { film: Film }) {
  return (
    <Section id="film" eyebrow="Our film" title={film.title} intro={film.description} tone="alt">
      <Reveal className="mx-auto max-w-5xl">
        <FilmPlayer film={film} />
      </Reveal>
    </Section>
  );
}
