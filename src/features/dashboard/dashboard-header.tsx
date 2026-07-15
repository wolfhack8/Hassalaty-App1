"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { useFinance } from "@/components/finance/finance-provider";
import { pick } from "@/lib/localized";
import { DEMO_NOW } from "@/lib/format";

export function DashboardHeader() {
  const locale = useLocale() as Locale;
  const t = useTranslations("dashboard");
  const { user } = useFinance();

  const hour = DEMO_NOW.getHours();
  const greetingKey =
    hour < 12 ? "greetingMorning" : hour < 18 ? "greetingAfternoon" : "greetingEvening";

  return (
    <header className="animate-fade-up">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
        {t(greetingKey, { name: pick(user.firstName, locale) })}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
    </header>
  );
}
