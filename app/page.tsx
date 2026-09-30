import { ArrowRight, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Heading } from "@/components/ui/Heading";
import { getAllCouples } from "@/lib/couples";
import { formatWeddingDate } from "@/lib/date";
import { fontStack } from "@/lib/font-registry";

/** Platform landing page: a directory of every hosted wedding site. */
export default async function HomePage() {
  const couples = await getAllCouples();

  return (
    <main className="min-h-screen bg-canvas px-4 py-20 text-on-canvas sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <Heart className="mx-auto h-10 w-10 text-accent" fill="currentColor" aria-hidden />
          <Heading as="h1" className="mt-5">
            Forever
          </Heading>
          <p className="mx-auto mt-4 max-w-xl text-on-canvas/70">
            One platform, many love stories. Every couple gets their own site, colours and typography — served from a
            single codebase.
          </p>
        </header>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {couples.map((couple) => (
            <li key={couple.id}>
              <Link
                href={`/${couple.slug}`}
                className="group block overflow-hidden rounded-3xl bg-surface shadow-lg ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={couple.hero.backgroundImage}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex h-2">
                    <span className="flex-1" style={{ backgroundColor: couple.theme.primaryColor }} />
                    <span className="flex-1" style={{ backgroundColor: couple.theme.secondaryColor }} />
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-2xl" style={{ fontFamily: fontStack(couple.theme.headingFont) }}>
                    {couple.hero.names}
                  </p>
                  <p className="mt-1 text-sm text-on-surface/60">
                    {formatWeddingDate(couple.hero.date, couple.hero.timeZone)} · {couple.hero.location}
                  </p>
                  <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                    Visit site <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
