"use client";

import { useTranslations } from "next-intl";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";

export function AskAiCard() {
  const t = useTranslations("dashboard");

  return (
    <Link
      href="/assistant"
      className="group relative block overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand-soft via-card to-card p-5 shadow-xs transition-shadow hover:shadow-md"
    >
      <div className="pointer-events-none absolute -end-8 -top-8 h-28 w-28 rounded-full bg-brand/20 blur-2xl" />
      <div className="relative">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </span>
        <p className="mt-3 text-sm font-semibold text-foreground">
          {t("askAi")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          “{t("askAiPrompt")}”
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-strong">
          {t("askAi")}
          <ArrowRight className="h-4 w-4 rtl-flip transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
