"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Minus, Plus, Check, TrendingUp } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import type { Stock } from "@/data/markets";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Delta } from "@/components/ui/trend";
import { StockLogo } from "@/components/finance/stock-logo";
import { Sparkline } from "@/components/charts/sparkline";
import { useMarket, SAR_PER_USD } from "./store";
import { pick } from "@/lib/localized";
import { Money } from "@/components/ui/money";
import { formatNumber } from "@/lib/format";

export function TradeDialog({
  stock,
  price: priceProp,
  open,
  onClose,
  initialSide = "buy",
}: {
  stock: Stock | null;
  price?: number;
  open: boolean;
  onClose: () => void;
  initialSide?: "buy" | "sell";
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("markets");
  const { cash, positions, buy, sell } = useMarket();
  const [side, setSide] = useState<"buy" | "sell">(initialSide);
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);

  // Price is frozen at the moment the dialog opens so the order value is stable
  // while the user picks a quantity (live ticks don't move it under them).
  const price = priceProp ?? stock?.price ?? 0;

  useEffect(() => {
    if (open) {
      setSide(initialSide);
      setQty(1);
      setDone(false);
    }
  }, [open, initialSide, stock?.symbol]);

  const owned = stock ? positions[stock.symbol]?.units ?? 0 : 0;
  const fx = stock?.market === "us" ? SAR_PER_USD : 1;
  const currency = stock?.market === "us" ? "USD" : "SAR";

  const buyingPowerNative = cash / fx;
  const maxQty = stock
    ? side === "buy"
      ? Math.max(0, Math.floor(buyingPowerNative / price))
      : owned
    : 0;

  const orderValue = stock ? qty * price : 0;
  const canSubmit = stock && qty > 0 && qty <= maxQty;

  const errorMsg = useMemo(() => {
    if (!stock || qty <= maxQty) return null;
    return side === "buy" ? t("insufficientFunds") : t("notEnoughShares");
  }, [stock, qty, maxQty, side, t]);

  if (!stock) return null;

  function submit() {
    if (!stock || !canSubmit) return;
    if (side === "buy") buy(stock.symbol, qty, price);
    else sell(stock.symbol, qty, price);
    setDone(true);
    setTimeout(onClose, 1400);
  }

  const money = (v: number) => (
    <Money value={v} locale={locale} currency={currency} decimals={2} />
  );

  return (
    <Dialog open={open} onClose={onClose} title={pick(stock.name, locale)}>
      {done ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-positive-soft text-positive">
            <Check className="h-8 w-8" strokeWidth={2.5} />
          </span>
          <p className="text-lg font-semibold text-foreground">{t("orderFilled")}</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {t("orderFilledBody", {
              side: side === "buy" ? t("buy") : t("sell"),
              units: formatNumber(qty, locale),
              unit: t("unit"),
              name: pick(stock.name, locale),
            })}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3 pe-8">
            <StockLogo domain={stock.domain} symbol={stock.symbol} color={stock.color} size={44} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-foreground">
                {pick(stock.name, locale)}
              </p>
              <p className="text-xs text-muted-foreground" dir="ltr">
                {stock.symbol} · {pick(stock.sector, locale)}
              </p>
            </div>
            <div className="text-end">
              <p className="text-base font-semibold text-foreground tnum" dir="ltr">
                {money(price)}
              </p>
              <Delta value={stock.change} />
            </div>
          </div>

          {/* Mini chart */}
          <div className="rounded-2xl bg-surface-muted p-3">
            <Sparkline
              data={stock.series}
              width={420}
              height={64}
              color={stock.change >= 0 ? "var(--positive)" : "var(--negative)"}
            />
          </div>

          {/* Buy / Sell */}
          <Segmented
            value={side}
            onChange={(v) => {
              setSide(v);
              setQty(1);
            }}
            className="w-full [&>button]:flex-1"
            options={[
              { value: "buy", label: t("buy") },
              { value: "sell", label: t("sell") },
            ]}
          />

          {/* Quantity stepper */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{t("quantity")}</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                {side === "buy" ? (
                  <>
                    {t("available")}: {money(buyingPowerNative)}
                  </>
                ) : (
                  t("owned", { units: formatNumber(owned, locale), unit: t("unit") })
                )}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border text-foreground hover:bg-accent"
                aria-label="-"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(Math.max(0, Math.floor(Number(e.target.value.replace(/\D/g, "")) || 0)))}
                className="h-11 flex-1 rounded-xl border border-border bg-surface text-center text-lg font-semibold text-foreground tnum focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
              <button
                onClick={() => setQty((q) => q + 1)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border text-foreground hover:bg-accent"
                aria-label="+"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Order value */}
          <div className="flex items-center justify-between rounded-2xl bg-surface-muted px-4 py-3">
            <span className="text-sm text-muted-foreground">{t("orderValue")}</span>
            <span className="text-lg font-semibold text-foreground tnum" dir="ltr">
              {money(orderValue)}
            </span>
          </div>

          {errorMsg && (
            <p className="text-center text-sm font-medium text-negative">{errorMsg}</p>
          )}

          <Button
            className="w-full"
            size="lg"
            variant={side === "sell" ? "destructive" : "primary"}
            disabled={!canSubmit}
            onClick={submit}
          >
            <TrendingUp className="h-4 w-4" />
            {side === "buy"
              ? t("confirmBuy", { symbol: stock.symbol })
              : t("confirmSell", { symbol: stock.symbol })}
          </Button>
        </div>
      )}
    </Dialog>
  );
}
