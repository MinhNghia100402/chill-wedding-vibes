"use client";

import type { ReactNode } from "react";
import { useOptionalTheme } from "@/components/theme/ThemeProvider";
import { isScriptFont } from "@/lib/font-registry";
import { cn } from "@/lib/utils";

type Size = "display" | "xl" | "lg" | "md";

/** Script faces have tiny x-heights, so they get a step up in size. */
const sizes: Record<Size, { normal: string; script: string }> = {
  display: { normal: "text-5xl sm:text-7xl md:text-8xl", script: "text-6xl sm:text-8xl md:text-9xl" },
  xl: { normal: "text-4xl sm:text-5xl", script: "text-5xl sm:text-6xl" },
  lg: { normal: "text-2xl sm:text-3xl", script: "text-3xl sm:text-4xl" },
  md: { normal: "text-xl sm:text-2xl", script: "text-2xl sm:text-3xl" },
};

interface HeadingProps {
  as?: "h1" | "h2" | "h3" | "p";
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Heading({ as: Tag = "h2", size = "xl", className, children }: HeadingProps) {
  const headingFont = useOptionalTheme()?.theme.headingFont;
  const variant = headingFont && isScriptFont(headingFont) ? "script" : "normal";
  return (
    <Tag className={cn("font-heading leading-tight", sizes[size][variant], className)}>{children}</Tag>
  );
}
