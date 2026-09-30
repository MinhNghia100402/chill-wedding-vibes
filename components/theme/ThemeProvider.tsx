"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { buildThemeVariables } from "@/lib/theme";
import type { Theme } from "@/lib/types";

interface ThemeContextValue {
  /** The live theme (initial couple theme + any preview overrides). */
  theme: Theme;
  /** The couple's saved theme from the database. */
  initialTheme: Theme;
  isDirty: boolean;
  updateTheme: (patch: Partial<Theme>) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Like useTheme, but returns null outside a couple's site (landing, 404). */
export function useOptionalTheme(): ThemeContextValue | null {
  return useContext(ThemeContext);
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

interface ThemeProviderProps {
  initialTheme: Theme;
  children: ReactNode;
}

/**
 * Holds the live theme for a couple's site and exposes it as CSS custom
 * properties on a wrapper element. Every component styles itself through
 * those variables (via Tailwind tokens), so an update here repaints the whole
 * page instantly — no re-fetch, no reload.
 */
export function ThemeProvider({ initialTheme, children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const updateTheme = useCallback((patch: Partial<Theme>) => {
    setTheme((current) => ({ ...current, ...patch }));
  }, []);
  const resetTheme = useCallback(() => setTheme(initialTheme), [initialTheme]);

  const isDirty =
    theme.primaryColor !== initialTheme.primaryColor ||
    theme.secondaryColor !== initialTheme.secondaryColor ||
    theme.headingFont !== initialTheme.headingFont ||
    theme.bodyFont !== initialTheme.bodyFont;

  const value = useMemo(
    () => ({ theme, initialTheme, isDirty, updateTheme, resetTheme }),
    [theme, initialTheme, isDirty, updateTheme, resetTheme],
  );
  const style = useMemo(() => buildThemeVariables(theme), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      <div
        style={style}
        className="min-h-screen bg-canvas font-body text-on-canvas antialiased transition-colors duration-500"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
