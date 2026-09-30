import { cn } from "@/lib/utils";

/** Shared button classes so every CTA tracks the live primary colour. */
export function buttonClasses(variant: "solid" | "outline" = "solid", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold",
    "transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    "disabled:cursor-not-allowed disabled:opacity-60",
    variant === "solid"
      ? "bg-primary text-on-primary shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25"
      : "border border-primary/40 text-accent hover:border-primary hover:bg-primary hover:text-on-primary",
    className,
  );
}
