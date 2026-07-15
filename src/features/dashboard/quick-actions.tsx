"use client";

import { useTranslations } from "next-intl";
import { Send, Plus, TrendingUp, ReceiptText, Lock, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useFinance } from "@/components/finance/finance-provider";

export function QuickActions() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("company");
  const { membership } = useFinance();

  // Employees are gated by their company access flags; owners/personal users
  // are never restricted (an owner's membership is OWNER with full flags).
  const isEmployee = membership?.role === "EMPLOYEE";
  const canSpend = !isEmployee || membership.canSpend;
  const canTopup = !isEmployee || membership.canTopup;

  const actions: { icon: LucideIcon; label: string; href: string; allowed: boolean }[] = [
    { icon: Send, label: t("send"), href: "/payments", allowed: canSpend },
    { icon: Plus, label: t("topUp"), href: "/wallet", allowed: canTopup },
    { icon: TrendingUp, label: t("invest"), href: "/markets", allowed: true },
    { icon: ReceiptText, label: t("payBill"), href: "/payments", allowed: canSpend },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((a) =>
        a.allowed ? (
          <Link
            key={a.label}
            href={a.href}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-primary-strong transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <a.icon className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium text-foreground sm:text-sm">{a.label}</span>
          </Link>
        ) : (
          <div
            key={a.label}
            title={tc("actionRestricted")}
            aria-disabled="true"
            className="flex cursor-not-allowed flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center opacity-50 shadow-xs sm:p-4"
          >
            <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-surface-muted text-subtle-foreground">
              <a.icon className="h-5 w-5" />
              <span className="absolute -bottom-0.5 -end-0.5 grid h-4 w-4 place-items-center rounded-full bg-foreground text-background">
                <Lock className="h-2.5 w-2.5" />
              </span>
            </span>
            <span className="text-xs font-medium text-muted-foreground sm:text-sm">{a.label}</span>
          </div>
        ),
      )}
    </div>
  );
}
