"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Image that renders at its natural height (full screenshot, never cropped)
 * once loaded, and shows a branded placeholder — at the given aspect ratio —
 * while loading or if the file is missing. Preloading via JS avoids the native
 * broken-image icon and the missed pre-hydration error event.
 */
function MockupImage({
  src,
  alt,
  dir,
  ratio = "aspect-[16/10]",
}: {
  src: string;
  alt: string;
  dir?: "ltr" | "rtl";
  ratio?: string;
}) {
  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");

  useEffect(() => {
    let active = true;
    const img = new window.Image();
    img.onload = () => active && setStatus("ok");
    img.onerror = () => active && setStatus("fail");
    img.src = src;
    return () => {
      active = false;
    };
  }, [src]);

  if (status === "ok") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      // -mb-0.5 crops ~2px off the bottom (clipped by the frame's overflow-hidden).
      <img src={src} alt={alt} dir={dir} className="-mb-0.5 block h-auto w-full" />
    );
  }

  return (
    <div
      className={cn(
        "grid w-full place-items-center bg-gradient-to-br from-brand-soft via-surface to-surface-muted",
        ratio,
      )}
    >
      <div className="flex flex-col items-center gap-1.5 text-subtle-foreground">
        <span className="text-base font-semibold text-primary-strong">naqd</span>
        <span className="text-xs">{alt}</span>
      </div>
    </div>
  );
}

/** macOS-style browser window wrapping a product screenshot (shown in full). */
export function BrowserFrame({
  src,
  alt,
  url = "naqd.sa",
  className,
}: {
  src: string;
  alt: string;
  url?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-xl",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="mx-auto flex items-center gap-1.5 rounded-md bg-surface-muted px-3 py-1 text-xs text-muted-foreground" dir="ltr">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {url}
        </span>
      </div>
      <MockupImage src={src} alt={alt} ratio="aspect-[16/10]" />
    </div>
  );
}

/** iPhone-style frame wrapping a mobile screenshot (shown in full). */
export function PhoneFrame({
  src,
  alt,
  dir,
  className,
}: {
  src: string;
  alt: string;
  dir?: "ltr" | "rtl";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-[230px] overflow-hidden rounded-[2.4rem] border-[7px] border-[#0c0d0f] bg-[#0c0d0f] shadow-2xl",
        className,
      )}
    >
      <div className="absolute left-1/2 top-2.5 z-10 h-4 w-24 -translate-x-1/2 rounded-full bg-[#0c0d0f]" />
      <div className="overflow-hidden rounded-[1.9rem] bg-surface">
        <MockupImage src={src} alt={alt} dir={dir} ratio="aspect-[9/19]" />
      </div>
    </div>
  );
}
