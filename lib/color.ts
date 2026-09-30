/**
 * Small, dependency-free colour helpers used by the theming engine to derive
 * a complete, readable palette from just two user-picked colours.
 */

export type Rgb = [number, number, number];

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Normalises "#abc" / "abc" / "#AABBCC" to lowercase "#aabbcc". */
export function normalizeHex(value: string): string | null {
  const match = HEX_RE.exec(value.trim());
  if (!match) return null;
  let hex = match[1].toLowerCase();
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  return `#${hex}`;
}

export function hexToRgb(hex: string): Rgb {
  const normalized = normalizeHex(hex) ?? "#000000";
  const int = parseInt(normalized.slice(1), 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

/** Linear interpolation between two colours; `amount` = weight of `b`. */
export function mix(a: Rgb, b: Rgb, amount: number): Rgb {
  return a.map((channel, i) => Math.round(channel + (b[i] - channel) * amount)) as Rgb;
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function luminance([r, g, b]: Rgb): number {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const INK: Rgb = [28, 25, 23];
const WHITE: Rgb = [255, 255, 255];

/** Picks near-black or white text, whichever reads better on `bg`. */
export function readableOn(bg: Rgb): Rgb {
  return contrastRatio(bg, INK) >= contrastRatio(bg, WHITE) ? INK : WHITE;
}

export const toTriplet = ([r, g, b]: Rgb) => `${r} ${g} ${b}`;
