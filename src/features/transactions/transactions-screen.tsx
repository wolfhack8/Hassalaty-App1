"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { TransactionRow } from "@/components/finance/transaction-row";
import { TransactionDetailPanel } from "@/components/finance/transaction-detail-panel";
import { useFinance } from "@/components/finance/finance-provider";
import type { Transaction } from "@/data/types";
import { formatDate } from "@/lib/format";

type Filter = "all" | "income" | "expenses" | "transfers";

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};
const listItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};

function matchesFilter(tx: Transaction, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "income") return tx.type === "income";
  if (filter === "expenses") return tx.type === "expense";
  return tx.type === "transfer";
}

export function TransactionsScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("transactions");
  const tc = useTranslations("common");
  const { transactions } = useFinance();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const reduceMotion = useReducedMotion();

  const { upcoming, groups, count } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = transactions.filter((tx) => {
      if (!matchesFilter(tx, filter)) return false;
      if (!q) return true;
      return (
        tx.merchant.en.toLowerCase().includes(q) ||
        tx.merchant.ar.includes(query.trim()) ||
        (tx.note?.en.toLowerCase().includes(q) ?? false)
      );
    });

    const upcoming = filtered.filter((tx) => tx.status === "scheduled");
    const completed = filtered
      .filter((tx) => tx.status !== "scheduled")
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));

    const map = new Map<string, Transaction[]>();
    for (const tx of completed) {
      const key = tx.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return {
      upcoming,
      groups: Array.from(map.entries()),
      count: filtered.length,
    };
  }, [filter, query, transactions]);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: t("all") },
            { value: "income", label: t("income") },
            { value: "expenses", label: t("expenses") },
            { value: "transfers", label: t("transfers") },
          ]}
        />
        <label className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-11 w-full rounded-xl border border-border bg-surface ps-9 pe-9 text-sm text-foreground placeholder:text-subtle-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute inset-y-0 end-3 my-auto text-muted-foreground hover:text-foreground"
              aria-label={tc("clear")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>
      </div>

      <p className="text-sm text-muted-foreground tnum">{t("results", { count })}</p>

      {/* Results — re-animates (staggered) each time the filter changes */}
      <motion.div
        key={filter}
        className="space-y-5"
        variants={listContainer}
        initial={reduceMotion ? false : "hidden"}
        animate="show"
      >
        {count === 0 && (
          <motion.div variants={listItem}>
            <Card>
              <div className="flex flex-col items-center gap-2 p-6 py-16 text-center">
                <p className="text-sm font-medium text-foreground">{t("noResults")}</p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <motion.section variants={listItem}>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">
              {t("upcoming")}
            </h2>
            <Card>
              <div className="space-y-0.5 p-2">
                {upcoming.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} showDate onClick={() => setSelectedTx(tx)} />
                ))}
              </div>
            </Card>
          </motion.section>
        )}

        {/* Grouped by day */}
        {groups.map(([day, items]) => (
          <motion.section key={day} variants={listItem}>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">
              {formatDate(day, locale, { weekday: "long", day: "numeric", month: "long" })}
            </h2>
            <Card>
              <div className="space-y-0.5 p-2">
                {items.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} onClick={() => setSelectedTx(tx)} />
                ))}
              </div>
            </Card>
          </motion.section>
        ))}
      </motion.div>

      <TransactionDetailPanel
        tx={selectedTx}
        open={selectedTx !== null}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}
