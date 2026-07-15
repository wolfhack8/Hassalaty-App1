import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, de-duplicating Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Deterministic pseudo-random in [0,1) from a seed — stable demo visuals. */
export function seeded(seed: number) {
  const x = Math.sin(seed * 9973.13) * 43758.5453;
  return x - Math.floor(x);
}
