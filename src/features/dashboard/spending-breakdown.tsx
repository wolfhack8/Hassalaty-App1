"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DonutChart } from "@/components/charts/donut-chart";
import { useFinance } from "@/components/finance/finance-provider";
import { categories } from "@/data/categories";
import { pick } from "@/lib/localized";
import { Money } from "@/components/ui/money";
import { formatPercent } from "@/lib/format";

export function SpendingBreakdown() {
  const locale = useLocale() as Locale;
  const t = useTranslations("dashboard");
  const { spendingByCategory, monthlySpend } = useFinance();
  const [active, setActive] = useState<string | null>(null);

  const slices = spendingByCategory.slice(0, 6).map((s) => ({
    id: s.category,
    label: pick(categories[s.category].name, locale),
    value: s.amount,
    color: categories[s.category].color,
  }));

  const activeSlice = slices.find((s) => s.id === active);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{t("spendingThisMonth")}</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("byCategory")}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <DonutChart
          data={slices}
          size={172}
          thickness={20}
          onActiveChange={setActive}
          center={
            <div>
              <p className="text-[0.7rem] text-muted-foreground">
                {activeSlice ? activeSlice.label : t("thisMonth")}
              </p>
              <p className="text-lg font-semibold text-foreground">
                <Money
                  value={activeSlice ? activeSlice.value : monthlySpend}
                  locale={locale}
                  compact
                />
              </p>
            </div>
          }
        />
        <ul className="w-full flex-1 space-y-2.5">
          {slices.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3"
              onPointerEnter={() => setActive(s.id)}
              onPointerLeave={() => setActive(null)}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="flex-1 truncate text-sm text-foreground">
                {s.label}
              </span>
              <span className="text-sm font-medium text-muted-foreground tnum">
                {formatPercent((s.value / monthlySpend) * 100, locale, { decimals: 0 })}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
