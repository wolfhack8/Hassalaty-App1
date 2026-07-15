"use client";

import { useLocale, useTranslations } from "next-intl";
import { Wallet, Users, CreditCard, TrendingDown, ArrowRight, Building2 } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Money } from "@/components/ui/money";
import { useFinance } from "@/components/finance/finance-provider";
import { pick } from "@/lib/localized";
import { formatRelativeTime, DEMO_NOW } from "@/lib/format";

export function CompanyDashboard() {
  const locale = useLocale() as Locale;
  const t = useTranslations("company");
  const { company } = useFinance();

  if (!company) return null;

  const ranked = [...company.employees].sort((a, b) => b.monthSpend - a.monthSpend);
  const maxSpend = Math.max(1, ...ranked.map((e) => e.monthSpend));

  return (
    <section className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary-strong">
            <Building2 className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{t("yourCompany")}</p>
            <h2 className="text-base font-semibold text-foreground">{pick(company.name, locale)}</h2>
          </div>
        </div>
        <Link
          href="/company"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("openConsole")}
          <ArrowRight className="h-4 w-4 rtl-flip" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("treasury")}
          accent="var(--brand)"
          icon={<Wallet className="h-4 w-4" />}
          value={<Money value={company.treasury} locale={locale} compact />}
        />
        <StatCard
          label={t("headcount")}
          accent="var(--info)"
          icon={<Users className="h-4 w-4" />}
          value={company.employeeCount}
        />
        <StatCard
          label={t("teamWallets")}
          accent="var(--positive)"
          icon={<CreditCard className="h-4 w-4" />}
          value={<Money value={company.totalEmployeeWallet} locale={locale} compact />}
        />
        <StatCard
          label={t("teamSpend")}
          accent="var(--negative)"
          icon={<TrendingDown className="h-4 w-4" />}
          value={<Money value={company.totalEmployeeSpend} locale={locale} compact />}
        />
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground">{t("teamLeaderboard")}</h3>
        <ul className="mt-4 space-y-4">
          {ranked.map((e) => {
            const pct = Math.min(100, Math.round((e.monthSpend / maxSpend) * 100));
            const overLimit = e.spendLimit != null && e.monthSpend > e.spendLimit;
            return (
              <li key={e.id}>
                <Link href={`/company/employees/${e.id}`} className="group block">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground group-hover:underline">
                        {pick(e.name, locale)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e.lastActivity
                          ? formatRelativeTime(e.lastActivity, locale, DEMO_NOW)
                          : t("noActivityYet")}
                      </p>
                    </div>
                    <div className="text-end">
                      <Money value={e.monthSpend} locale={locale} decimals={0} className="text-sm font-semibold text-foreground" />
                      {e.spendLimit != null && (
                        <p className={`text-xs ${overLimit ? "text-negative" : "text-subtle-foreground"}`}>
                          {pct >= 100 ? "≥100%" : `${Math.round((e.monthSpend / (e.spendLimit || 1)) * 100)}%`} {t("ofLimit")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <span
                      className={`block h-full rounded-full ${overLimit ? "bg-negative" : "bg-primary"}`}
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
}
