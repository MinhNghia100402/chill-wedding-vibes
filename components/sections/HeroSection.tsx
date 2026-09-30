"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, MapPin } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { Countdown } from "@/components/sections/Countdown";
import { Heading } from "@/components/ui/Heading";
import { formatWeddingDate } from "@/lib/date";
import type { Hero } from "@/lib/types";

export function HeroSection({ hero }: { hero: Hero }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      id="home"
      className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden text-white"
    >
      <motion.div style={{ y: imageY }} className="absolute inset-0 -z-10 scale-110">
        <Image src={hero.backgroundImage} alt="" fill priority sizes="100vw" className="object-cover" />
      </motion.div>
      {/* Tinted overlay follows the live primary colour. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/35 to-primary/60 transition-colors duration-500"
      />

      <motion.div
        style={{ opacity: contentOpacity }}
        className="flex flex-col items-center px-4 py-24 text-center"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.18 } } }}
      >
        {[
          <p key="tag" className="mb-4 text-xs uppercase tracking-[0.4em] text-white/85 sm:text-sm">
            {hero.tagline}
          </p>,
          <Heading key="names" as="h1" size="display" className="drop-shadow-lg">
            {hero.names}
          </Heading>,
          <div key="meta" className="mt-6 flex flex-col items-center gap-2 text-base sm:flex-row sm:gap-4 sm:text-lg">
            <time dateTime={hero.date}>{formatWeddingDate(hero.date, hero.timeZone)}</time>
            <span aria-hidden className="hidden h-1.5 w-1.5 rounded-full bg-primary sm:block" />
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" aria-hidden />
              {hero.location}
            </span>
          </div>,
          <div key="countdown" className="mt-10">
            <Countdown date={hero.date} />
          </div>,
        ].map((child) => (
          <motion.div
            key={child.key}
            variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>

      <a
        href="#story"
        aria-label="Scroll to our story"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce rounded-full p-2 text-white/80 hover:text-white"
      >
        <ChevronDown className="h-7 w-7" />
      </a>
    </section>
  );
}
