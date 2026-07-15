"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TransactionRow } from "@/components/finance/transaction-row";
import { useFinance } from "@/components/finance/finance-provider";

export function RecentActivity() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { transactions } = useFinance();

  const recent = transactions
    .filter((tx) => tx.status === "completed")
    .slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("recentActivity")}</CardTitle>
        <Link
          href="/transactions"
          className="text-xs font-medium text-primary-strong hover:underline"
        >
          {tc("seeAll")}
        </Link>
      </CardHeader>
      <CardContent className="space-y-0.5">
        {recent.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </CardContent>
    </Card>
  );
}
