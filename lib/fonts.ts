import {
  Be_Vietnam_Pro,
  Cormorant_Garamond,
  Great_Vibes,
  Lato,
  Montserrat,
  Playfair_Display,
} from "next/font/google";

/**
 * next/font must be called statically at module scope, so every font a couple
 * may choose is registered here once. Each exposes a CSS variable; the
 * ThemeProvider then points `--font-heading` / `--font-body` at the right one.
 * Browsers only download a font file when a rendered element actually uses it.
 */
const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair-display",
  display: "swap",
  preload: false,
});
const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
  display: "swap",
  preload: false,
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant-garamond",
  display: "swap",
  preload: false,
});
const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-montserrat",
  display: "swap",
  preload: false,
});
const greatVibes = Great_Vibes({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  variable: "--font-great-vibes",
  display: "swap",
  preload: false,
});
const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
  preload: false,
});

/** Class list to put on <html> so every font CSS variable is defined. */
export const fontVariables = [playfair, lato, cormorant, montserrat, greatVibes, beVietnam]
  .map((font) => font.variable)
  .join(" ");
