import type { CSSProperties } from "react";
import { contrastRatio, hexToRgb, luminance, mix, readableOn, toTriplet, type Rgb } from "@/lib/color";
import { fontStack } from "@/lib/font-registry";
import type { Theme } from "@/lib/types";

const WHITE: Rgb = [255, 255, 255];

/**
 * Nudges `color` toward `target` until it reaches `minContrast` against `bg`,
 * so primary-coloured text stays legible even when a user picks a pale tone.
 */
function ensureContrast(color: Rgb, bg: Rgb, target: Rgb, minContrast: number): Rgb {
  let result = color;
  for (let step = 1; step <= 10 && contrastRatio(result, bg) < minContrast; step++) {
    result = mix(color, target, step / 10);
  }
  return result;
}

/**
 * Converts a couple's two-colour theme into the full set of CSS custom
 * properties consumed by Tailwind (see tailwind.config.ts). Pure, so it runs
 * identically on the server (first paint) and in the live ThemeSwitcher.
 */
export function buildThemeVariables(theme: Theme): CSSProperties {
  const primary = hexToRgb(theme.primaryColor);
  const secondary = hexToRgb(theme.secondaryColor);
  const onSecondary = readableOn(secondary);
  const isLightCanvas = luminance(secondary) > 0.4;

  const surface = mix(secondary, WHITE, isLightCanvas ? 0.65 : 0.08);
  const canvasAlt = mix(secondary, primary, 0.07);
  const accent = ensureContrast(primary, secondary, onSecondary, 3.5);

  return {
    "--color-primary": theme.primaryColor,
    "--color-secondary": theme.secondaryColor,
    "--color-primary-rgb": toTriplet(primary),
    "--color-on-primary-rgb": toTriplet(readableOn(primary)),
    "--color-secondary-rgb": toTriplet(secondary),
    "--color-on-secondary-rgb": toTriplet(onSecondary),
    "--color-canvas-alt-rgb": toTriplet(canvasAlt),
    "--color-surface-rgb": toTriplet(surface),
    "--color-on-surface-rgb": toTriplet(readableOn(surface)),
    "--color-accent-rgb": toTriplet(accent),
    "--font-heading": fontStack(theme.headingFont),
    "--font-body": fontStack(theme.bodyFont),
  } as CSSProperties;
}

/** Curated palettes offered as one-click swatches in the ThemeSwitcher. */
export const THEME_PRESETS: { name: string; primaryColor: string; secondaryColor: string }[] = [
  { name: "Champagne", primaryColor: "#B8912F", secondaryColor: "#F7F3E8" },
  { name: "Navy & Silver", primaryColor: "#1F2E4D", secondaryColor: "#EEF0F3" },
  { name: "Sage & Blush", primaryColor: "#6B8F71", secondaryColor: "#FBF1EE" },
  { name: "Burgundy", primaryColor: "#7A1F3D", secondaryColor: "#FAF3F0" },
  { name: "Terracotta", primaryColor: "#C0643F", secondaryColor: "#FBF6EF" },
  { name: "Midnight", primaryColor: "#E3C27A", secondaryColor: "#141B2D" },
];
