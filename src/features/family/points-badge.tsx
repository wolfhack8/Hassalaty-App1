"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildHome } from "./child-home-provider";

/** Small reusable points pill, reading the live shared balance from
 *  `ChildHomeContext` — used in the shell header and on the home page so
 *  both stay in sync the instant a game round or reward redemption changes it. */
export function PointsBadge({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const { points } = useChildHome();
  const sizes = {
    sm: "text-xs px-2.5 py-1 gap-1",
    md: "text-sm px-3.5 py-1.5 gap-1.5",
    lg: "text-lg px-5 py-2.5 gap-2",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-warning-soft font-semibold text-warning",
        sizes[size],
        className,
      )}
    >
      <Star className={size === "lg" ? "h-5 w-5 fill-warning" : "h-3.5 w-3.5 fill-warning"} />
      {points.toLocaleString("en-US")}
    </span>
  );
}
