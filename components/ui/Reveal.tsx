"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

type Direction = "up" | "left" | "right" | "none";

const offsets: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 32 },
  left: { x: -48 },
  right: { x: 48 },
  none: {},
};

interface RevealProps extends HTMLMotionProps<"div"> {
  direction?: Direction;
  delay?: number;
}

/** Fades/slides its children in once when scrolled into view. */
export function Reveal({ direction = "up", delay = 0, children, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
