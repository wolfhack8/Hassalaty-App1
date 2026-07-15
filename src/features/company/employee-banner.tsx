"use client";

import { useLocale, useTranslations } from "next-intl";
import { Building2, ShieldCheck } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Money } from "@/components/ui/money";
import { useFinance } from "@/components/finance/finance-provider";
import { pick } from "@/lib/localized";

/**
 * Scoped banner for a non-owner employee: shows only their own company
 * membership — their spend limit and this month's spend. No company-wide or
 * other-employee data is ever loaded into their context.
 */
export function EmployeeBanner() {
  const locale = useLocale() as Locale;
  const t = useTranslations("company");
  const { membership, monthlySpend } = useFinance();

  if (!membership || membership.role === "OWNER") return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs animate-fade-up">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary-strong">
          <Building2 className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            {t("memberBanner", { company: pick(membership.companyName, locale) })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("spentThisMonth")}: <Money value={monthlySpend} locale={locale} decimals={0} />
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span className="text-xs text-muted-foreground">{t("yourLimit")}</span>
        <span className="text-sm font-semibold text-foreground">
          {membership.spendLimit != null ? (
            <Money value={membership.spendLimit} locale={locale} decimals={0} />
          ) : (
            t("noLimit")
          )}
        </span>
      </div>
    </div>
  );
}
