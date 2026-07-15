"use client";

import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { stocks } from "@/data/markets";
import { StockLogo } from "@/components/finance/stock-logo";
import { Money } from "@/components/ui/money";
import { cn } from "@/lib/utils";

/** Auto-scrolling live-markets ticker for the landing page. */
export function MarketsTicker() {
  const locale = useLocale() as Locale;
  const row = [...stocks, ...stocks];

  return (
    <div className="group relative overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max animate-marquee items-center gap-3 group-hover:[animation-play-state:paused]">
        {row.map((s, i) => {
          const up = s.change >= 0;
          return (
            <div
              key={`${s.symbol}-${i}`}
              className="flex items-center gap-2.5 rounded-full border border-border bg-card px-3 py-2 shadow-xs"
            >
              <StockLogo domain={s.domain} symbol={s.symbol} color={s.color} size={24} />
              <span className="text-sm font-semibold text-foreground" dir="ltr">
                {s.symbol}
              </span>
              <span className="text-sm text-muted-foreground">
                <Money
                  value={s.price}
                  locale={locale}
                  currency={s.market === "us" ? "USD" : "SAR"}
                  decimals={2}
                />
              </span>
              <span
                className={cn("text-xs font-medium tnum", up ? "text-positive" : "text-negative")}
                dir="ltr"
              >
                {up ? "▲" : "▼"} {Math.abs(s.change).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
