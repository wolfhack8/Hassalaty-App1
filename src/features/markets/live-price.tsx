"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/routing";
import { Money } from "@/components/ui/money";
import { cn } from "@/lib/utils";

/**
 * A monetary value that briefly flashes green/red whenever it changes — the
 * signature "live ticking" feel of a trading screen.
 */
export function LivePrice({
  value,
  locale,
  currency,
  decimals = 2,
  className,
}: {
  value: number;
  locale: Locale;
  currency?: string;
  decimals?: number;
  className?: string;
}) {
  const [flash, setFlash] = useState<"" | "up" | "down">("");
  const prev = useRef(value);

  useEffect(() => {
    if (value > prev.current) setFlash("up");
    else if (value < prev.current) setFlash("down");
    prev.current = value;
    const id = setTimeout(() => setFlash(""), 550);
    return () => clearTimeout(id);
  }, [value]);

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-1 transition-colors duration-500",
        flash === "up" && "bg-positive/15",
        flash === "down" && "bg-negative/15",
        className,
      )}
    >
      <Money value={value} locale={locale} currency={currency} decimals={decimals} />
    </span>
  );
}
