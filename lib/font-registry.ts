import type { FontName } from "@/lib/types";

/**
 * Pure (client-safe) mapping from a couple's font names to the CSS variables
 * registered by the next/font loaders in `lib/fonts.ts`. Keep both in sync.
 */
const registry: Record<FontName, { variable: string; kind: "serif" | "sans" | "script" }> = {
  "Playfair Display": { variable: "--font-playfair-display", kind: "serif" },
  Lato: { variable: "--font-lato", kind: "sans" },
  "Cormorant Garamond": { variable: "--font-cormorant-garamond", kind: "serif" },
  Montserrat: { variable: "--font-montserrat", kind: "sans" },
  "Great Vibes": { variable: "--font-great-vibes", kind: "script" },
  "Be Vietnam Pro": { variable: "--font-be-vietnam-pro", kind: "sans" },
};

export const FONT_NAMES = Object.keys(registry) as FontName[];

const FALLBACK = { serif: "Georgia, serif", sans: "system-ui, sans-serif", script: "cursive" };

/** Resolves a font name to a CSS `font-family` value, with a safe fallback. */
export function fontStack(name: string): string {
  const entry = registry[name as FontName];
  if (!entry) return FALLBACK.sans;
  return `var(${entry.variable}), ${FALLBACK[entry.kind]}`;
}

/** Script faces are hard to read at small sizes; UI uses this to scale them. */
export function isScriptFont(name: string): boolean {
  return registry[name as FontName]?.kind === "script";
}
