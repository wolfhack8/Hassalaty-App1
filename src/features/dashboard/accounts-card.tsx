"use client";

import { useLocale, useTranslations } from "next-intl";
import { Wallet, PiggyBank, LineChart } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFinance } from "@/components/finance/finance-provider";
import { pick } from "@/lib/localized";
import { Money } from "@/components/ui/money";

const icons = { current: Wallet, savings: PiggyBank, investment: LineChart };

export function AccountsCard() {
  const locale = useLocale() as Locale;
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { accounts } = useFinance();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("accounts")}</CardTitle>
        <Link
          href="/wallet"
          className="text-xs font-medium text-primary-strong hover:underline"
        >
          {tc("seeAll")}
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {accounts.map((acc) => {
          const Icon = icons[acc.kind];
          return (
            <Link
              key={acc.id}
              href="/wallet"
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-muted"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-foreground">
                <Icon className="h-[1.1rem] w-[1.1rem]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {pick(acc.name, locale)}
                </p>
                <p className="truncate text-xs text-muted-foreground tnum" dir="ltr">
                  {acc.number}
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground">
                <Money value={acc.balance} locale={locale} decimals={0} />
              </p>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
