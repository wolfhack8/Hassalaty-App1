"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Plus, Wallet, PiggyBank, LineChart } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import type { Account } from "@/data/types";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { CountUpMoney } from "@/components/ui/count-up-money";
import { AnimatedCheck } from "@/components/ui/animated-check";
import { Confetti } from "@/components/ui/confetti";
import { RiyalGlyph } from "@/components/brand/riyal";
import { pick } from "@/lib/localized";
import { cn } from "@/lib/utils";

const PRESETS = [100, 500, 1000, 5000];
const icons = { current: Wallet, savings: PiggyBank, investment: LineChart };

type Phase = "form" | "processing" | "done";
type Result = { prev: number; next: number };

const EASE = [0.22, 1, 0.36, 1] as const;

export function TopUpDialog({
  open,
  onClose,
  accounts,
}: {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("wallet");
  const router = useRouter();

  const defaultAccount =
    accounts.find((a) => a.kind === "current")?.id ?? accounts[0]?.id ?? "";

  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(defaultAccount);
  const [phase, setPhase] = useState<Phase>("form");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount("");
      setAccountId(defaultAccount);
      setPhase("form");
      setResult(null);
      setError(null);
    }
  }, [open, defaultAccount]);

  const numeric = Number(amount);
  const valid = Number.isFinite(numeric) && numeric > 0;
  const credited = accounts.find((a) => a.id === accountId);
  const accountName = credited ? pick(credited.name, locale) : "";

  async function submit() {
    if (!valid || phase !== "form") return;
    const prevBalance = credited?.balance ?? 0;
    setError(null);
    setPhase("processing");
    try {
      // Brief simulated settlement delay before the result resolves.
      await new Promise((r) => setTimeout(r, 1500));
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numeric, accountId }),
      });
      if (!res.ok) throw new Error("failed");
      const data: { account?: { balance?: number } } = await res.json();
      setResult({
        prev: prevBalance,
        next: data.account?.balance ?? prevBalance + numeric,
      });
      setPhase("done");
      // Pull the fresh, DB-backed finance context so balances update.
      router.refresh();
      // Hold long enough for the count-up and confetti to settle.
      setTimeout(onClose, 3200);
    } catch {
      setError(t("topupError"));
      setPhase("form");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={t("addMoney")}>
      <div className="relative">
        {/* Base layer: the top-up form */}
        <div className="space-y-5">
          <div className="pe-8">
            <h2 className="text-base font-semibold text-foreground">{t("topupTitle")}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("topupSubtitle")}</p>
          </div>

          {/* Amount */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t("topupAmount")}
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
              <RiyalGlyph className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                inputMode="decimal"
                placeholder="0.00"
                dir="ltr"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d.]/g, "");
                  const parts = v.split(".");
                  setAmount(parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : v);
                }}
                className="w-full bg-transparent text-2xl font-semibold text-foreground tnum outline-none placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(String(p))}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
                    Number(amount) === p
                      ? "border-primary bg-brand-soft text-primary-strong"
                      : "border-border text-foreground hover:bg-accent",
                  )}
                >
                  <Money value={p} locale={locale} decimals={0} />
                </button>
              ))}
            </div>
          </div>

          {/* Destination account */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t("topupTo")}
            </label>
            <div className="grid gap-2">
              {accounts.map((acc) => {
                const Icon = icons[acc.kind];
                const active = acc.id === accountId;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccountId(acc.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-start transition-colors",
                      active ? "border-primary bg-brand-soft" : "border-border hover:bg-accent",
                    )}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary-strong">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {pick(acc.name, locale)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        <Money value={acc.balance} locale={locale} decimals={2} />
                      </span>
                    </span>
                    {active && <Check className="h-4 w-4 shrink-0 text-primary-strong" />}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-center text-sm font-medium text-negative">{error}</p>}

          <Button className="w-full" size="lg" disabled={!valid} onClick={submit}>
            <Plus className="h-4 w-4" />
            {t("topupConfirm")}
          </Button>
        </div>

        {/* Result overlay — animates in over the form during processing/success */}
        <AnimatePresence>
          {phase !== "form" && (
            <motion.div
              key="overlay"
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 rounded-2xl bg-card text-center"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
            >
              {phase === "done" && <Confetti />}

              {/* Ring → check medallion */}
              <div className="relative grid h-20 w-20 place-items-center">
                <AnimatePresence mode="wait">
                  {phase === "processing" ? (
                    <motion.span
                      key="spin"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="block h-11 w-11 animate-spin rounded-full border-[3px] border-primary/15 border-t-primary" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="check"
                      className="grid h-20 w-20 place-items-center rounded-full bg-positive-soft text-positive"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 360, damping: 18 }}
                    >
                      <span className="h-9 w-9">
                        <AnimatedCheck />
                      </span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Headline */}
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">
                  {phase === "processing" ? t("topupProcessing") : t("topupDone")}
                </p>
                {phase === "done" && (
                  <p className="text-sm text-muted-foreground">
                    {t("topupDoneBody", { account: accountName })}
                  </p>
                )}
              </div>

              {/* Amount */}
              {phase === "done" ? (
                <p className="text-4xl font-semibold tracking-tight text-positive">
                  <CountUpMoney from={0} to={numeric} locale={locale} decimals={2} signed duration={0.9} />
                </p>
              ) : (
                <p className="text-3xl font-semibold tracking-tight text-foreground/70">
                  <Money value={numeric} locale={locale} decimals={2} signed />
                </p>
              )}

              {/* New balance */}
              {phase === "done" && result && (
                <motion.div
                  className="w-full max-w-[15rem] rounded-2xl border border-border bg-surface-muted px-4 py-3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE, delay: 0.15 }}
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("topupNewBalance")}
                  </p>
                  <p className="mt-0.5 text-xl font-semibold text-foreground">
                    <CountUpMoney
                      from={result.prev}
                      to={result.next}
                      locale={locale}
                      decimals={2}
                      duration={1.2}
                    />
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Dialog>
  );
}
