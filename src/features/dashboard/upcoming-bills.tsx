"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { Badge } from "@/components/ui/badge";
import { useFinance } from "@/components/finance/finance-provider";
import { categories } from "@/data/categories";
import { pick } from "@/lib/localized";
import { Money } from "@/components/ui/money";
import { formatDate } from "@/lib/format";

export function UpcomingBills() {
  const locale = useLocale() as Locale;
  const t = useTranslations("dashboard");
  const tp = useTranslations("payments");
  const tc = useTranslations("common");
  const { bills } = useFinance();

  const upcoming = bills.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("upcomingBills")}</CardTitle>
        <Link
          href="/payments"
          className="text-xs font-medium text-primary-strong hover:underline"
        >
          {tc("seeAll")}
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {upcoming.map((bill) => (
          <div
            key={bill.id}
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-muted"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-foreground">
              <DynamicIcon name={categories[bill.category].icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {pick(bill.biller, locale)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(bill.dueDate, locale, { day: "numeric", month: "short" })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-semibold text-foreground">
                <Money value={bill.amount} locale={locale} decimals={0} />
              </span>
              {bill.autopay && (
                <Badge tone="brand" className="text-[0.625rem]">
                  {tp("autopay")}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
