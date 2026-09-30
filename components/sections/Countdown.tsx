"use client";

import { PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function diff(target: number, now: number): Remaining | null {
  const ms = target - now;
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

/**
 * Live countdown to the ceremony. Time is only read after mount, so the
 * server-rendered HTML (placeholders) always matches the first client render.
 */
export function Countdown({ date }: { date: string }) {
  const target = new Date(date).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (now !== null && now >= target) {
    const daysAgo = Math.floor((now - target) / 86_400_000);
    return (
      <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm backdrop-blur-sm sm:text-base">
        <PartyPopper className="h-5 w-5" aria-hidden />
        Just married{daysAgo > 0 ? ` · ${daysAgo} day${daysAgo === 1 ? "" : "s"} ago` : " · today!"}
      </p>
    );
  }

  const remaining = now === null ? null : diff(target, now);
  const units: [keyof Remaining, string][] = [
    ["days", "Days"],
    ["hours", "Hours"],
    ["minutes", "Minutes"],
    ["seconds", "Seconds"],
  ];

  return (
    <div role="timer" aria-label="Time until the wedding" className="grid grid-cols-4 gap-2 sm:gap-4">
      {units.map(([key, label]) => (
        <div
          key={key}
          className="min-w-[4.25rem] rounded-2xl border border-white/25 bg-white/10 px-2 py-3 backdrop-blur-md sm:min-w-[6rem] sm:px-4 sm:py-4"
        >
          <span className="block font-heading text-3xl tabular-nums sm:text-5xl" suppressHydrationWarning>
            {remaining ? String(remaining[key]).padStart(2, "0") : "--"}
          </span>
          <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.2em] text-white/80 sm:text-xs">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
