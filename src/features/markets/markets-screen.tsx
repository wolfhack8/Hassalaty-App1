"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { Star, ArrowUpDown, Plus, Search, X } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Delta } from "@/components/ui/trend";
import { AreaChart } from "@/components/charts/area-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { StockLogo } from "@/components/finance/stock-logo";
import { markets, stocksFor, stockBySymbol, type MarketId, type Stock } from "@/data/markets";
import { useMarket, SAR_PER_USD } from "./store";
import { useLiveMarket, type Quote } from "./use-live-market";
import { LivePrice } from "./live-price";
import { TradeDialog } from "./trade-dialog";
import { pick } from "@/lib/localized";
import { Money } from "@/components/ui/money";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

type Filter = "all" | "gainers" | "losers" | "watch";

export function MarketsScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("markets");
  const { cash, positions, watchlist, toggleWatch, orders } = useMarket();
  const { quotes, indices } = useLiveMarket();

  const [market, setMarket] = useState<MarketId>("sa");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [trade, setTrade] = useState<{ stock: Stock; side: "buy" | "sell"; price: number } | null>(null);

  const deferredQuery = useDeferredValue(query);
  const meta = markets[market];
  const currency = meta.currency;
  const idx = indices[market];

  const q = (symbol: string): Quote =>
    quotes[symbol] ?? {
      price: stockBySymbol(symbol)!.price,
      change: stockBySymbol(symbol)!.change,
      open: stockBySymbol(symbol)!.price,
      series: stockBySymbol(symbol)!.series,
    };

  // Live positions value in SAR across all markets.
  const positionsValue = useMemo(() => {
    return Object.entries(positions).reduce((sum, [sym, pos]) => {
      const s = stockBySymbol(sym);
      if (!s) return sum;
      const fx = s.market === "us" ? SAR_PER_USD : 1;
      return sum + pos.units * q(sym).price * fx;
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, quotes]);

  const ownedList = useMemo(
    () =>
      Object.entries(positions)
        .map(([sym, pos]) => ({ stock: stockBySymbol(sym)!, pos }))
        .filter((x) => x.stock),
    [positions],
  );

  const list = useMemo(() => {
    const base = stocksFor(market);
    const term = deferredQuery.trim().toLowerCase();
    let out = base.filter((s) => {
      if (filter === "watch" && !watchlist.includes(s.symbol)) return false;
      if (filter === "gainers" && q(s.symbol).change < 0) return false;
      if (filter === "losers" && q(s.symbol).change >= 0) return false;
      if (!term) return true;
      return (
        s.symbol.toLowerCase().includes(term) ||
        s.name.en.toLowerCase().includes(term) ||
        s.name.ar.includes(deferredQuery.trim())
      );
    });
    if (filter === "gainers") out = [...out].sort((a, b) => q(b.symbol).change - q(a.symbol).change);
    if (filter === "losers") out = [...out].sort((a, b) => q(a.symbol).change - q(b.symbol).change);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, deferredQuery, filter, watchlist, quotes]);

  const money = (v: number, cur = currency, decimals = 2) => (
    <Money value={v} locale={locale} currency={cur} decimals={decimals} />
  );

  const indexData = idx.series.map((v, i) => ({ t: String(i), v }));

  function openTrade(stock: Stock, side: "buy" | "sell") {
    setTrade({ stock, side, price: q(stock.symbol).price });
  }

  return (
    <div className="space-y-6">
      {/* Market selector bar */}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-1.5">
        {(Object.values(markets) as (typeof markets)[MarketId][]).map((m) => {
          const active = m.id === market;
          return (
            <button
              key={m.id}
              onClick={() => setMarket(m.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                active ? "text-background" : "text-muted-foreground hover:bg-accent",
              )}
            >
              {active && (
                <motion.span
                  layoutId="market-active"
                  className="absolute inset-0 rounded-xl bg-foreground shadow-sm"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <span className="text-base leading-none">{m.flag}</span>
                <span>{pick(m.label, locale)}</span>
                <span className={cn("text-xs font-normal", active ? "text-background/70" : "text-subtle-foreground")}>
                  {pick(m.index, locale)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Index hero + stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 sm:p-6 lg:col-span-2">
          <motion.div
            key={market}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {pick(meta.index, locale)}
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-positive-soft px-2 py-0.5 text-[0.7rem] font-medium text-positive">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-positive" />
                  </span>
                  {t("live")}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-3xl font-semibold tracking-tight text-foreground tnum tabular-nums">
                  {formatNumber(idx.value, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <Delta value={idx.change} />
              </div>
            </div>
          </div>
          <div className="mt-2">
            <AreaChart
              data={indexData}
              height={200}
              color={idx.change >= 0 ? "var(--brand)" : "var(--negative)"}
              formatValue={(v) => formatNumber(v, locale, { maximumFractionDigits: 0 })}
            />
          </div>
          </motion.div>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <Card className="p-5">
            <p className="text-sm font-medium text-muted-foreground">{t("portfolioValue")}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              <LivePrice value={positionsValue} locale={locale} currency="SAR" decimals={0} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground tnum">
              {ownedList.length} {t("holdings")}
            </p>
          </Card>
          <Card className="flex flex-col p-5">
            <p className="text-sm font-medium text-muted-foreground">{t("buyingPower")}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground tnum">
              {money(cash, "SAR", 0)}
            </p>
            <button className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-primary-strong hover:underline">
              <Plus className="h-3.5 w-3.5" />
              {t("addFunds")}
            </button>
          </Card>
        </div>
      </div>

      {/* Your positions */}
      {ownedList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("yourPositions")}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4">
            <div className="space-y-0.5">
              {ownedList.map(({ stock, pos }) => {
                const cur = stock.market === "us" ? "USD" : "SAR";
                const live = q(stock.symbol);
                const value = pos.units * live.price;
                const ret = ((live.price - pos.avgCost) / pos.avgCost) * 100;
                return (
                  <button
                    key={stock.symbol}
                    onClick={() => openTrade(stock, "sell")}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors hover:bg-surface-muted"
                  >
                    <StockLogo domain={stock.domain} symbol={stock.symbol} color={stock.color} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {pick(stock.name, locale)}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground tnum" dir="ltr">
                        {formatNumber(pos.units, locale)} {t("unit")} · {t("avgCost")}{" "}
                        <Money value={pos.avgCost} locale={locale} currency={cur} decimals={2} />
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="flex justify-end text-sm font-semibold text-foreground">
                        <LivePrice value={value} locale={locale} currency={cur} decimals={0} />
                      </p>
                      <Delta value={ret} withBackground={false} />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stocks table */}
      <Card>
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <CardTitle className="shrink-0">
            {pick(meta.label, locale)} · {t("allStocks")}
          </CardTitle>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <label className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-10 w-full rounded-xl border border-border bg-surface ps-9 pe-9 text-sm text-foreground placeholder:text-subtle-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute inset-y-0 end-3 my-auto text-muted-foreground hover:text-foreground"
                  aria-label="clear"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
            <Segmented
              size="sm"
              value={filter}
              onChange={(v) => setFilter(v as Filter)}
              options={[
                { value: "all", label: t("filterAll") },
                { value: "gainers", label: t("gainers") },
                { value: "losers", label: t("losers") },
                { value: "watch", label: t("watchlist") },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-3">
          {list.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t("noMatch")}</p>
          ) : (
            <motion.div layout className="space-y-0.5">
              <AnimatePresence mode="popLayout" initial={false}>
                {list.map((stock) => {
                  const watched = watchlist.includes(stock.symbol);
                  const live = q(stock.symbol);
                  return (
                    <motion.div
                      layout
                      key={stock.symbol}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-muted"
                    >
                      <button
                        onClick={() => toggleWatch(stock.symbol)}
                        aria-label={t("watchlist")}
                        className="shrink-0"
                      >
                        <Star
                          className={cn(
                            "h-4 w-4 transition-colors",
                            watched ? "fill-warning text-warning" : "text-subtle-foreground hover:text-warning",
                          )}
                        />
                      </button>
                      <StockLogo domain={stock.domain} symbol={stock.symbol} color={stock.color} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {pick(stock.name, locale)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground" dir="ltr">
                          {stock.symbol} · {pick(stock.sector, locale)}
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <Sparkline
                          data={live.series}
                          width={80}
                          height={32}
                          color={live.change >= 0 ? "var(--positive)" : "var(--negative)"}
                        />
                      </div>
                      <div className="w-24 text-end">
                        <p className="flex justify-end text-sm font-semibold text-foreground">
                          <LivePrice value={live.price} locale={locale} currency={stock.market === "us" ? "USD" : "SAR"} decimals={2} />
                        </p>
                        <Delta value={live.change} withBackground={false} />
                      </div>
                      <Button
                        size="sm"
                        variant="subtle"
                        className="hidden shrink-0 sm:inline-flex"
                        onClick={() => openTrade(stock, "buy")}
                      >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        {t("trade")}
                      </Button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recentOrders")}</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("noOrders")}</p>
          ) : (
            <div className="space-y-0.5">
              {orders.slice(0, 6).map((o) => {
                const s = stockBySymbol(o.symbol);
                if (!s) return null;
                const cur = s.market === "us" ? "USD" : "SAR";
                return (
                  <div key={o.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold",
                        o.side === "buy" ? "bg-positive-soft text-positive" : "bg-negative-soft text-negative",
                      )}
                    >
                      {o.side === "buy" ? t("buy")[0] : t("sell")[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {pick(s.name, locale)}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground tnum" dir="ltr">
                        {formatNumber(o.units, locale)} {t("unit")} @{" "}
                        <Money value={o.price} locale={locale} currency={cur} decimals={2} />
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      <Money value={o.units * o.price} locale={locale} currency={cur} decimals={0} />
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TradeDialog
        stock={trade?.stock ?? null}
        price={trade?.price}
        open={!!trade}
        onClose={() => setTrade(null)}
        initialSide={trade?.side ?? "buy"}
      />
    </div>
  );
}
