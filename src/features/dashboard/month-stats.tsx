"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowDownLeft, ArrowUpRight, PiggyBank } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { StatCard } from "@/components/ui/stat-card";
import { Delta } from "@/components/ui/trend";
import { Money } from "@/components/ui/money";
import { useFinance } from "@/components/finance/finance-provider";
import { formatPercent } from "@/lib/format";

export function MonthStats() {
  const locale = useLocale() as Locale;
  const t = useTranslations("dashboard");
  const { monthlyIncome, monthlySpend } = useFinance();

  const saved = monthlyIncome - monthlySpend;
  const savingsRate = (saved / monthlyIncome) * 100;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label={t("income")}
        accent="var(--positive)"
        icon={<ArrowDownLeft className="h-4 w-4" />}
        value={<Money value={monthlyIncome} locale={locale} decimals={0} />}
        footer={<span className="text-muted-foreground">{t("thisMonth")}</span>}
      />
      <StatCard
        label={t("expenses")}
        accent="var(--negative)"
        icon={<ArrowUpRight className="h-4 w-4" />}
        value={<Money value={monthlySpend} locale={locale} decimals={0} />}
        footer={<Delta value={-7.8} withBackground={false} />}
      />
      <StatCard
        label={t("savingsRate")}
        accent="var(--brand)"
        icon={<PiggyBank className="h-4 w-4" />}
        value={formatPercent(savingsRate, locale, { decimals: 0 })}
        footer={
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            {t("saved")} <Money value={saved} locale={locale} compact />
          </span>
        }
      />
    </div>
  );
}
