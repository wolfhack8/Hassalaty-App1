"use client";

import { useEffect, useState } from "react";
import { stocks as baseStocks, markets as baseMarkets, type MarketId } from "@/data/markets";

export type Quote = { price: number; change: number; open: number; series: number[] };
export type IndexQuote = { value: number; change: number; open: number; series: number[] };

const SERIES_LEN = 48;
const TICK_MS = 1500;

/** Seeded (deterministic) starting quotes — identical on server and client. */
function seedQuotes(): Record<string, Quote> {
  const q: Record<string, Quote> = {};
  for (const s of baseStocks) {
    q[s.symbol] = {
      price: s.price,
      change: s.change,
      open: s.price / (1 + s.change / 100),
      series: s.series.slice(-SERIES_LEN),
    };
  }
  return q;
}

function seedIndices(): Record<MarketId, IndexQuote> {
  const out = {} as Record<MarketId, IndexQuote>;
  (Object.keys(baseMarkets) as MarketId[]).forEach((id) => {
    const m = baseMarkets[id];
    out[id] = {
      value: m.indexValue,
      change: m.indexChange,
      open: m.indexValue / (1 + m.indexChange / 100),
      series: m.series.slice(-SERIES_LEN),
    };
  });
  return out;
}

/**
 * Simulated live market data. Prices random-walk with gentle mean reversion
 * toward their reference price, day-change is recomputed from the session open,
 * and each series grows so sparklines animate. Updates run only on the client
 * (after mount), so the seeded server render hydrates cleanly.
 */
export function useLiveMarket(enabled = true) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>(seedQuotes);
  const [indices, setIndices] = useState<Record<MarketId, IndexQuote>>(seedIndices);

  useEffect(() => {
    if (!enabled) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const tick = () => {
      setQuotes((prev) => {
        const next: Record<string, Quote> = {};
        for (const s of baseStocks) {
          const cur = prev[s.symbol] ?? {
            price: s.price,
            change: s.change,
            open: s.price,
            series: [s.price],
          };
          const vol = s.market === "us" ? 0.0024 : 0.0016;
          const rnd = Math.random() * 2 - 1;
          const drift = (s.price - cur.price) * 0.015;
          const price = Math.max(0.01, cur.price + drift + cur.price * vol * rnd);
          const change = ((price - cur.open) / cur.open) * 100;
          next[s.symbol] = {
            ...cur,
            price,
            change,
            series: [...cur.series.slice(-(SERIES_LEN - 1)), price],
          };
        }
        return next;
      });

      setIndices((prev) => {
        const next = { ...prev };
        (Object.keys(prev) as MarketId[]).forEach((id) => {
          const cur = prev[id];
          const base = baseMarkets[id].indexValue;
          const rnd = Math.random() * 2 - 1;
          const drift = (base - cur.value) * 0.015;
          const value = cur.value + drift + cur.value * 0.0006 * rnd;
          const change = ((value - cur.open) / cur.open) * 100;
          next[id] = {
            ...cur,
            value,
            change,
            series: [...cur.series.slice(-(SERIES_LEN - 1)), value],
          };
        });
        return next;
      });
    };

    const interval = setInterval(tick, TICK_MS);
    return () => clearInterval(interval);
  }, [enabled]);

  return { quotes, indices };
}
