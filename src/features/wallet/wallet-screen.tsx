"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Wallet, PiggyBank, LineChart, Plus, ArrowLeftRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { Card, CardBody, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Sparkline } from "@/components/charts/sparkline";
import { TransactionRow } from "@/components/finance/transaction-row";
import { TransactionDetailPanel } from "@/components/finance/transaction-detail-panel";
import { useFinance } from "@/components/finance/finance-provider";
import { pick } from "@/lib/localized";
import { Money } from "@/components/ui/money";
import type { Transaction } from "@/data/types";
import { TopUpDialog } from "./topup-dialog";

const icons = { current: Wallet, savings: PiggyBank, investment: LineChart };

export function WalletScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("wallet");
  const tc = useTranslations("common");
  const { accounts, totalBalance, balanceHistory, transactions } = useFinance();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const monthTx = transactions.filter(
    (tx) => tx.status === "completed" && tx.date.startsWith("2026-06"),
  );
  const moneyIn = monthTx.filter((tx) => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0);
  const moneyOut = monthTx.filter((tx) => tx.amount < 0).reduce((s, tx) => s + Math.abs(tx.amount), 0);
  const spark = balanceHistory.map((p) => p.v);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="overflow-hidden">
        <CardBody className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("totalBalance")}
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              <Money value={totalBalance} locale={locale} decimals={2} />
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("across", { count: accounts.length })}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button size="sm" onClick={() => setTopUpOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("addMoney")}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/payments">
                  <ArrowLeftRight className="h-4 w-4" />
                  {t("moveMoney")}
                </Link>
              </Button>
            </div>
          </div>
          <div className="shrink-0 sm:w-56">
            <Sparkline data={spark} width={224} height={72} />
          </div>
        </CardBody>
      </Card>

      {/* In / Out */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={t("moneyIn")}
          accent="var(--positive)"
          icon={<ArrowDownLeft className="h-4 w-4" />}
          value={<Money value={moneyIn} locale={locale} decimals={0} />}
        />
        <StatCard
          label={t("moneyOut")}
          accent="var(--negative)"
          icon={<ArrowUpRight className="h-4 w-4" />}
          value={<Money value={moneyOut} locale={locale} decimals={0} />}
        />
      </div>

      {/* Accounts */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t("accounts")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => {
            const Icon = icons[acc.kind];
            return (
              <Card key={acc.id} className="p-5">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-primary-strong">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground tnum" dir="ltr">
                    {acc.number}
                  </span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {pick(acc.name, locale)}
                </p>
                <p className="mt-0.5 text-xl font-semibold text-foreground">
                  <Money value={acc.balance} locale={locale} decimals={2} />
                </p>
                <Link
                  href="/transactions"
                  className="mt-3 inline-block text-xs font-medium text-primary-strong hover:underline"
                >
                  {t("viewStatement")}
                </Link>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent movement */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recentMovement")}</CardTitle>
          <Link href="/transactions" className="text-xs font-medium text-primary-strong hover:underline">
            {tc("seeAll")}
          </Link>
        </CardHeader>
        <CardContent className="space-y-0.5">
          {transactions.filter((tx) => tx.status === "completed").slice(0, 7).map((tx) => (
            <TransactionRow key={tx.id} tx={tx} showDate onClick={() => setSelectedTx(tx)} />
          ))}
        </CardContent>
      </Card>

      <TopUpDialog open={topUpOpen} onClose={() => setTopUpOpen(false)} accounts={accounts} />

      <TransactionDetailPanel
        tx={selectedTx}
        open={selectedTx !== null}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}
