"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Delta } from "@/components/ui/trend";
import { AreaChart } from "@/components/charts/area-chart";
import { Money } from "@/components/ui/money";
import { useFinance } from "@/components/finance/finance-provider";
import { formatDate } from "@/lib/format";

type Period = "quarter" | "halfYear" | "year" | "all";
const windows: Record<Period, number> = { quarter: 3, halfYear: 6, year: 12, all: 12 };

export function NetWorthCard() {
  const locale = useLocale() as Locale;
  const t = useTranslations("dashboard");
  const tp = useTranslations("periods");
  const { netWorth, balanceHistory } = useFinance();
  const [period, setPeriod] = useState<Period>("year");

  const data = useMemo(
    () => balanceHistory.slice(-windows[period]),
    [period, balanceHistory],
  );

  const change = useMemo(() => {
    const first = data[0]?.v ?? 0;
    const last = data[data.length - 1]?.v ?? 0;
    if (!first) return 0;
    return ((last - first) / first) * 100;
  }, [data]);

  return (
    <Card className="overflow-hidden p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {t("netWorth")}
          </p>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-3xl font-semibold tracking-tight text-foreground">
              <Money value={netWorth} locale={locale} decimals={0} />
            </span>
            <Delta value={change} />
          </div>
        </div>
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
      </div>

      <div className="mt-4">
        <AreaChart
          data={data}
          height={220}
          formatValue={(v) => <Money value={v} locale={locale} decimals={0} />}
          formatLabel={(tt) =>
            formatDate(`${tt}-01`, locale, { month: "long", year: "numeric" })
          }
        />
      </div>
    </Card>
  );
}
