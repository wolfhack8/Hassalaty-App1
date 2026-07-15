"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  PiggyBank,
  ShoppingBag,
  TrendingUp,
  Target,
  TriangleAlert,
  CalendarClock,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/components/finance/finance-provider";
import type { Insight } from "@/data/types";
import { pick } from "@/lib/localized";
import { formatPercent } from "@/lib/format";
import { Money } from "@/components/ui/money";
import { cn } from "@/lib/utils";

const kindIcon: Record<Insight["kind"], LucideIcon> = {
  saving: PiggyBank,
  spending: ShoppingBag,
  investment: TrendingUp,
  goal: Target,
  alert: TriangleAlert,
};

const toneClasses: Record<Insight["tone"], { ring: string; icon: string; chip: string }> = {
  positive: { ring: "border-positive/30", icon: "text-positive bg-positive-soft", chip: "text-positive" },
  neutral: { ring: "border-info/25", icon: "text-info bg-info-soft", chip: "text-info" },
  warning: { ring: "border-warning/30", icon: "text-warning bg-warning-soft", chip: "text-warning" },
};

export function InsightsScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("insights");
  const { insights } = useFinance();

  const kindLabel = (k: Insight["kind"]) =>
    t(`kind${k.charAt(0).toUpperCase()}${k.slice(1)}` as
      | "kindSaving"
      | "kindSpending"
      | "kindInvestment"
      | "kindGoal"
      | "kindAlert");

  const renderMetric = (ins: Insight) => {
    if (ins.metric == null) return null;
    return ins.metricKind === "currency" ? (
      <Money value={ins.metric} locale={locale} decimals={0} />
    ) : (
      formatPercent(ins.metric, locale, { decimals: 0 })
    );
  };

  const [featured, ...rest] = insights;
  const featuredTone = toneClasses[featured.tone];
  const FeaturedIcon = kindIcon[featured.kind];

  return (
    <div className="space-y-6">
      {/* Featured */}
      <Card className={cn("relative overflow-hidden border bg-gradient-to-br from-brand-soft/50 via-card to-card", featuredTone.ring)}>
        <div className="pointer-events-none absolute -end-12 -top-12 h-44 w-44 rounded-full bg-brand/15 blur-3xl" />
        <CardBody className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", featuredTone.icon)}>
              <FeaturedIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-subtle-foreground">
                {t("potentialSavings")}
              </p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
                {pick(featured.title, locale)}
              </p>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
                {pick(featured.body, locale)}
              </p>
            </div>
          </div>
          <Button className="shrink-0">
            {t("act")}
            <ArrowRight className="h-4 w-4 rtl-flip" />
          </Button>
        </CardBody>
      </Card>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {rest.map((ins) => {
          const tone = toneClasses[ins.tone];
          const Icon = kindIcon[ins.kind];
          const metric = renderMetric(ins);
          return (
            <Card key={ins.id} className="flex flex-col p-5">
              <div className="flex items-center justify-between">
                <span className={cn("grid h-10 w-10 place-items-center rounded-xl", tone.icon)}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className={cn("text-xs font-medium uppercase tracking-wider", tone.chip)}>
                  {kindLabel(ins.kind)}
                </span>
              </div>
              <p className="mt-3 text-base font-semibold text-foreground">
                {pick(ins.title, locale)}
              </p>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">
                {pick(ins.body, locale)}
              </p>
              {metric && (
                <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground tnum" dir="ltr">
                  {metric}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Weekly digest */}
      <Card>
        <CardBody className="flex items-center gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-foreground">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{t("weeklyDigest")}</p>
            <p className="text-xs text-muted-foreground">{t("digestBody")}</p>
          </div>
          <Button variant="outline" size="sm">{t("forYou")}</Button>
        </CardBody>
      </Card>
    </div>
  );
}
