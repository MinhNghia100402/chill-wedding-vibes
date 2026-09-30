import type { Config } from "tailwindcss";

/**
 * Every theme colour resolves to a CSS custom property holding an "R G B"
 * triplet, so opacity modifiers (e.g. `bg-primary/10`) keep working while
 * the ThemeProvider swaps the values at runtime.
 */
const themeColor = (name: string) => `rgb(var(--color-${name}-rgb) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: themeColor("primary"),
        "on-primary": themeColor("on-primary"),
        canvas: themeColor("secondary"),
        "canvas-alt": themeColor("canvas-alt"),
        "on-canvas": themeColor("on-secondary"),
        surface: themeColor("surface"),
        "on-surface": themeColor("on-surface"),
        accent: themeColor("accent"),
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
