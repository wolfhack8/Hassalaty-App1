"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Delta } from "@/components/ui/trend";
import { AreaChart } from "@/components/charts/area-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { useFinance } from "@/components/finance/finance-provider";
import { HoldingDetailPanel } from "@/components/finance/holding-detail-panel";
import { AddFundsDialog } from "./add-funds-dialog";
import type { Holding } from "@/data/types";
import { pick } from "@/lib/localized";
import { formatPercent, formatDate, formatNumber } from "@/lib/format";
import { Money } from "@/components/ui/money";

type Period = "quarter" | "halfYear" | "year" | "all";
const windows: Record<Period, number> = { quarter: 3, halfYear: 6, year: 12, all: 12 };

export function PortfolioScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("portfolio");
  const tp = useTranslations("periods");
  const {
    holdings,
    portfolioHistory,
    portfolioValue,
    portfolioGain,
    portfolioGainPercent,
    allocationTargets,
  } = useFinance();
  const [period, setPeriod] = useState<Period>("year");
  const [activeAlloc, setActiveAlloc] = useState<string | null>(null);
  const [fundsOpen, setFundsOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);

  const data = useMemo(() => portfolioHistory.slice(-windows[period]), [period, portfolioHistory]);

  const todayChange = useMemo(() => {
    const weighted = holdings.reduce((s, h) => s + h.dayChange * h.value, 0);
    return portfolioValue > 0 ? weighted / portfolioValue : 0;
  }, [holdings, portfolioValue]);

  const allocSlices = allocationTargets.map((a, i) => ({
    id: String(i),
    label: pick(a.label, locale),
    value: a.value,
    color: a.color,
  }));
  const activeSlice = allocSlices.find((s) => s.id === activeAlloc);

  return (
    <div className="space-y-6">
      {/* Hero + performance */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("totalValue")}</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-3xl font-semibold tracking-tight text-foreground">
                <Money value={portfolioValue} locale={locale} decimals={0} />
              </span>
              <Delta value={todayChange} />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              {t("totalGain")}:
              <span className="inline-flex items-center gap-1 font-medium text-positive" dir="ltr">
                <Money value={portfolioGain} locale={locale} signed decimals={2} /> ({formatPercent(portfolioGainPercent, locale, { signed: true })})
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Segmented
              size="sm"
              value={period}
              onChange={setPeriod}
              options={[
                { value: "quarter", label: tp("quarter") },
                { value: "halfYear", label: tp("halfYear") },
                { value: "year", label: tp("year") },
                { value: "all", label: tp("all") },
              ]}
            />
            <Button size="sm" onClick={() => setFundsOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("addFunds")}
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <motion.div
            key={period}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <AreaChart
              data={data}
              height={240}
              formatValue={(v) => <Money value={v} locale={locale} decimals={0} />}
              formatLabel={(tt) => formatDate(`${tt}-01`, locale, { month: "long", year: "numeric" })}
            />
          </motion.div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Holdings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("holdings")}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4">
            <div className="hidden grid-cols-[1.6fr_1fr_1fr_0.8fr] gap-3 px-3 pb-2 text-xs font-medium text-subtle-foreground sm:grid">
              <span>{t("asset")}</span>
              <span className="text-end">{t("marketValue")}</span>
              <span className="text-end">{t("units")}</span>
              <span className="text-end">{t("return")}</span>
            </div>
            <div className="space-y-0.5">
              {holdings.map((h) => {
                const ret = ((h.value - h.cost) / h.cost) * 100;
                return (
                  <div
                    key={h.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedHolding(h)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedHolding(h);
                      }
                    }}
                    className="grid cursor-pointer grid-cols-2 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:grid-cols-[1.6fr_1fr_1fr_0.8fr]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
                        style={{ backgroundColor: h.color }}
                        dir="ltr"
                      >
                        {h.symbol.slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {pick(h.name, locale)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {pick(h.kind, locale)} · {pick(h.market, locale)}
                        </p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-semibold text-foreground">
                        <Money value={h.value} locale={locale} decimals={0} />
                      </p>
                      <p className="text-xs text-muted-foreground tnum sm:hidden">
                        <Delta value={ret} withBackground={false} />
                      </p>
                    </div>
                    <p className="hidden text-end text-sm text-muted-foreground tnum sm:block">
                      {formatNumber(h.units, locale)}
                    </p>
                    <div className="hidden justify-end sm:flex">
                      <Delta value={ret} withBackground={false} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>{t("allocation")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5">
            <DonutChart
              data={allocSlices}
              size={180}
              thickness={22}
              onActiveChange={setActiveAlloc}
              center={
                <div>
                  <p className="text-[0.7rem] text-muted-foreground">
                    {activeSlice ? activeSlice.label : t("allocation")}
                  </p>
                  <p className="text-lg font-semibold text-foreground tnum">
                    {formatPercent(activeSlice ? activeSlice.value : 100, locale, { decimals: 0 })}
                  </p>
                </div>
              }
            />
            <ul className="w-full space-y-2.5">
              {allocSlices.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3"
                  onPointerEnter={() => setActiveAlloc(s.id)}
                  onPointerLeave={() => setActiveAlloc(null)}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="flex-1 text-sm text-foreground">{s.label}</span>
                  <span className="text-sm font-medium text-muted-foreground tnum">
                    {formatPercent(s.value, locale, { decimals: 0 })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <AddFundsDialog open={fundsOpen} onClose={() => setFundsOpen(false)} />

      <HoldingDetailPanel
        holding={selectedHolding}
        open={selectedHolding !== null}
        onClose={() => setSelectedHolding(null)}
      />
    </div>
  );
}
