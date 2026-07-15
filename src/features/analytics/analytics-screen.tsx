"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Percent } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { CashflowBars } from "@/components/charts/bar-chart";
import { AreaChart } from "@/components/charts/area-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { useFinance } from "@/components/finance/finance-provider";
import { categories } from "@/data/categories";
import { pick } from "@/lib/localized";
import { formatPercent, formatDate } from "@/lib/format";
import { Money } from "@/components/ui/money";

export function AnalyticsScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("analytics");
  const {
    cashflow,
    spendingByCategory,
    monthlySpend,
    monthlyIncome,
    balanceHistory,
    spendingPulse,
  } = useFinance();
  const [activeSlice, setActiveSlice] = useState<string | null>(null);

  const net = monthlyIncome - monthlySpend;
  const savingsRate = (net / monthlyIncome) * 100;
  const avgExpense = cashflow.reduce((s, c) => s + c.expense, 0) / cashflow.length;
  const avgDaily = spendingPulse.reduce((s, d) => s + d.v, 0) / spendingPulse.length;

  const donutSlices = spendingByCategory.slice(0, 6).map((s) => ({
    id: s.category,
    label: pick(categories[s.category].name, locale),
    value: s.amount,
    color: categories[s.category].color,
  }));
  const active = donutSlices.find((s) => s.id === activeSlice);

  return (
    <div className="space-y-6">
      {/* Stat row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("income")}
          accent="var(--positive)"
          icon={<ArrowDownLeft className="h-4 w-4" />}
          value={<Money value={monthlyIncome} locale={locale} decimals={0} />}
        />
        <StatCard
          label={t("expenses")}
          accent="var(--negative)"
          icon={<ArrowUpRight className="h-4 w-4" />}
          value={<Money value={monthlySpend} locale={locale} decimals={0} />}
        />
        <StatCard
          label={t("netSavings")}
          accent="var(--brand)"
          icon={<PiggyBank className="h-4 w-4" />}
          value={<Money value={net} locale={locale} decimals={0} />}
        />
        <StatCard
          label={t("savingsRate")}
          accent="var(--info)"
          icon={<Percent className="h-4 w-4" />}
          value={formatPercent(savingsRate, locale, { decimals: 0 })}
        />
      </div>

      {/* Income vs expenses — full width */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t("incomeVsExpense")}</CardTitle>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              {t("monthlyAverage")}: <Money value={avgExpense} locale={locale} compact />
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">{t("income")}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
              <span className="text-muted-foreground">{t("expenses")}</span>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <CashflowBars
            data={cashflow}
            height={300}
            formatValue={(v) => <Money value={v} locale={locale} decimals={0} />}
            formatLabel={(tt) => formatDate(`${tt}-01`, locale, { month: "short" })}
          />
        </CardContent>
      </Card>

      {/* Breakdown donut + category bars */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("breakdown")}</CardTitle>
            <span className="text-xs text-muted-foreground">{t("thisMonth")}</span>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 sm:flex-row">
            <DonutChart
              data={donutSlices}
              size={188}
              thickness={22}
              onActiveChange={setActiveSlice}
              center={
                <div>
                  <p className="text-[0.7rem] text-muted-foreground">
                    {active ? active.label : t("total")}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    <Money
                      value={active ? active.value : monthlySpend}
                      locale={locale}
                      compact
                    />
                  </p>
                </div>
              }
            />
            <ul className="w-full flex-1 space-y-2.5">
              {donutSlices.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3"
                  onPointerEnter={() => setActiveSlice(s.id)}
                  onPointerLeave={() => setActiveSlice(null)}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="flex-1 truncate text-sm text-foreground">{s.label}</span>
                  <span className="text-sm font-medium text-muted-foreground tnum">
                    {formatPercent((s.value / monthlySpend) * 100, locale, { decimals: 0 })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("spendingByCategory")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {spendingByCategory.slice(0, 7).map((s) => {
              const cat = categories[s.category];
              const share = (s.amount / monthlySpend) * 100;
              return (
                <div key={s.category}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                      style={{ backgroundColor: `color-mix(in oklab, ${cat.color} 16%, transparent)`, color: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1 truncate text-sm text-foreground">
                      {pick(cat.name, locale)}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      <Money value={s.amount} locale={locale} decimals={0} />
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 ps-9">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                      <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: cat.color }} />
                    </div>
                    <span className="w-12 shrink-0 text-end text-xs text-muted-foreground tnum">
                      {formatPercent(share, locale, { decimals: 0 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Net worth trend + daily spending */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{t("netWorthTrend")}</p>
              <p className="text-xs text-muted-foreground">{t("last12")}</p>
            </div>
          </div>
          <AreaChart
            data={balanceHistory}
            height={200}
            formatValue={(v) => <Money value={v} locale={locale} decimals={0} />}
            formatLabel={(tt) => formatDate(`${tt}-01`, locale, { month: "long", year: "numeric" })}
          />
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{t("dailySpending")}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {t("avgDailySpend")}: <Money value={avgDaily} locale={locale} decimals={0} />
              </p>
            </div>
          </div>
          <AreaChart
            data={spendingPulse}
            height={200}
            color="var(--negative)"
            formatValue={(v) => <Money value={v} locale={locale} decimals={0} />}
          />
        </Card>
      </div>
    </div>
  );
}
