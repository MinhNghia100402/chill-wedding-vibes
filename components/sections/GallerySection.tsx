"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import type { GalleryImage } from "@/lib/types";

/** Varying aspect ratios give the CSS-columns masonry its rhythm. */
const ASPECTS = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[4/3]", "aspect-[2/3]"];

export function GallerySection({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (delta: number) => setIndex((i) => (i === null ? i : (i + delta + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, close, step]);

  return (
    <Section id="gallery" eyebrow="Moments" title="Photo Gallery" tone="alt">
      <div className="columns-2 gap-3 sm:gap-4 md:columns-3">
        {images.map((image, i) => (
          <Reveal key={image.src} delay={(i % 3) * 0.08} className="mb-3 break-inside-avoid sm:mb-4">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className={`group relative block w-full overflow-hidden rounded-2xl ${ASPECTS[i % ASPECTS.length]} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
              aria-label={`Open photo: ${image.alt}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-primary/0 opacity-0 transition-all duration-300 group-hover:bg-primary/35 group-hover:opacity-100">
                <Maximize2 className="h-7 w-7 text-on-primary" aria-hidden />
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      <AnimatePresence>
        {index !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={images[index].alt}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <motion.div
              key={images[index].src}
              className="relative h-[80vh] w-full max-w-5xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={images[index].src} alt={images[index].alt} fill sizes="100vw" className="object-contain" />
            </motion.div>

            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-white/80">
              {index + 1} / {images.length}
            </p>
            {[
              { label: "Close", icon: X, pos: "right-4 top-4", action: close },
              { label: "Previous photo", icon: ChevronLeft, pos: "left-2 top-1/2 -translate-y-1/2 sm:left-6", action: () => step(-1) },
              { label: "Next photo", icon: ChevronRight, pos: "right-2 top-1/2 -translate-y-1/2 sm:right-6", action: () => step(1) },
            ].map(({ label, icon: Icon, pos, action }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                autoFocus={label === "Close"}
                onClick={(e) => {
                  e.stopPropagation();
                  action();
                }}
                className={`absolute ${pos} rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-primary hover:text-on-primary`}
              >
                <Icon className="h-6 w-6" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}
