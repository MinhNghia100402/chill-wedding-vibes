"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Palette, RotateCcw, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { normalizeHex } from "@/lib/color";
import { FONT_NAMES } from "@/lib/font-registry";
import { THEME_PRESETS } from "@/lib/theme";
import type { FontName, Theme } from "@/lib/types";
import { cn } from "@/lib/utils";

type ColorKey = "primaryColor" | "secondaryColor";

/** Native colour picker paired with a hex text field (handy for pasting brand colours). */
function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commit = (raw: string) => {
    const hex = normalizeHex(raw);
    if (hex) onChange(hex);
    else setDraft(value);
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider opacity-70">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-on-surface/15 p-1.5 focus-within:border-primary">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-11 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />
        <input
          aria-label={`${label} hex value`}
          value={draft}
          spellCheck={false}
          maxLength={7}
          onChange={(e) => {
            setDraft(e.target.value);
            const hex = normalizeHex(e.target.value);
            if (hex && e.target.value.replace("#", "").length === 6) onChange(hex);
          }}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit(e.currentTarget.value)}
          className="w-full bg-transparent font-mono text-sm uppercase outline-none"
        />
      </div>
    </div>
  );
}

function FontControl({ label, value, onChange }: { label: string; value: FontName; onChange: (font: FontName) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider opacity-70">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as FontName)}
        className="w-full rounded-xl border border-on-surface/15 bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
      >
        {FONT_NAMES.map((font) => (
          <option key={font} value={font}>
            {font}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Floating "preview mode" customiser. It only writes to ThemeProvider state,
 * so every themed element on the page repaints instantly. Changes are not
 * persisted — "Copy theme JSON" exports them for pasting into the database.
 */
export function ThemeSwitcher() {
  const { theme, isDirty, updateTheme, resetTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const setColor = (key: ColorKey) => (hex: string) => updateTheme({ [key]: hex } as Partial<Theme>);

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ theme }, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      <AnimatePresence>
        {open && (
          <motion.div
            id="theme-switcher-panel"
            role="dialog"
            aria-label="Live theme customizer"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="mb-3 max-h-[calc(100svh-7rem)] w-[min(20rem,calc(100vw-2.5rem))] origin-bottom-right overflow-y-auto rounded-3xl bg-surface p-5 text-on-surface shadow-2xl ring-1 ring-on-surface/10"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="font-semibold">Live Theme Preview</p>
                <p className="text-xs opacity-60">Changes apply instantly and aren&apos;t saved.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close customizer" className="rounded-full p-1 hover:bg-on-surface/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-70">Presets</p>
            <div className="mb-5 grid grid-cols-6 gap-2">
              {THEME_PRESETS.map((preset) => {
                const active =
                  preset.primaryColor.toLowerCase() === theme.primaryColor.toLowerCase() &&
                  preset.secondaryColor.toLowerCase() === theme.secondaryColor.toLowerCase();
                return (
                  <button
                    key={preset.name}
                    type="button"
                    title={preset.name}
                    aria-label={`Apply ${preset.name} palette`}
                    aria-pressed={active}
                    onClick={() => updateTheme({ primaryColor: preset.primaryColor, secondaryColor: preset.secondaryColor })}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-surface transition hover:scale-110",
                      active ? "ring-primary" : "ring-transparent",
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${preset.primaryColor} 50%, ${preset.secondaryColor} 50%)`,
                    }}
                  />
                );
              })}
            </div>

            <div className="space-y-4">
              <ColorControl label="Primary color" value={theme.primaryColor} onChange={setColor("primaryColor")} />
              <ColorControl label="Secondary color" value={theme.secondaryColor} onChange={setColor("secondaryColor")} />
              <FontControl label="Heading font" value={theme.headingFont} onChange={(headingFont) => updateTheme({ headingFont })} />
              <FontControl label="Body font" value={theme.bodyFont} onChange={(bodyFont) => updateTheme({ bodyFont })} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={resetTheme}
                disabled={!isDirty}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-on-surface/15 px-3 py-2 text-xs font-semibold transition hover:border-primary disabled:opacity-40"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button
                type="button"
                onClick={copyJson}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-on-primary transition hover:opacity-90"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy JSON"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close theme customizer" : "Open theme customizer"}
        aria-expanded={open}
        aria-controls="theme-switcher-panel"
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-surface text-accent shadow-lg ring-1 ring-on-surface/10 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }}>
          {open ? <X className="h-5 w-5" /> : <Palette className="h-5 w-5" />}
        </motion.span>
        {isDirty && !open && (
          <span aria-hidden className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-primary ring-2 ring-surface" />
        )}
      </button>
    </div>
  );
}
