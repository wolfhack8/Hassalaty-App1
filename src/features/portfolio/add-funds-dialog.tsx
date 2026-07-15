"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { CountUpMoney } from "@/components/ui/count-up-money";
import { AnimatedCheck } from "@/components/ui/animated-check";
import { Confetti } from "@/components/ui/confetti";
import { RiyalGlyph } from "@/components/brand/riyal";
import { cn } from "@/lib/utils";

const PRESETS = [1000, 5000, 10000, 50000];
type Phase = "form" | "processing" | "done";

/** Adds cash to the portfolio, mirroring the wallet top-up animation. */
export function AddFundsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("portfolio");
  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState<Phase>("form");

  useEffect(() => {
    if (open) {
      setAmount("");
      setPhase("form");
    }
  }, [open]);

  const numeric = Number(amount);
  const valid = Number.isFinite(numeric) && numeric > 0;

  async function submit() {
    if (!valid || phase !== "form") return;
    setPhase("processing");
    await new Promise((r) => setTimeout(r, 1500));
    setPhase("done");
    setTimeout(onClose, 3000);
  }

  return (
    <Dialog open={open} onClose={onClose} title={t("addFunds")}>
      {phase === "done" ? (
        <div className="relative flex flex-col items-center gap-3 py-6 text-center">
          <Confetti />
          <motion.span
            className="grid h-16 w-16 place-items-center rounded-full bg-positive-soft text-positive"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 360, damping: 18 }}
          >
            <span className="h-8 w-8">
              <AnimatedCheck />
            </span>
          </motion.span>
          <p className="text-lg font-semibold text-foreground">{t("fundsAdded")}</p>
          <p className="max-w-xs text-sm text-muted-foreground">{t("fundsAddedBody")}</p>
          <p className="text-3xl font-semibold tracking-tight text-positive">
            <CountUpMoney from={0} to={numeric} locale={locale} decimals={2} signed duration={0.9} />
          </p>
        </div>
      ) : phase === "processing" ? (
        <div className="flex flex-col items-center gap-5 py-8 text-center">
          <div className="grid h-20 w-20 place-items-center">
            <span className="block h-11 w-11 animate-spin rounded-full border-[3px] border-primary/15 border-t-primary" />
          </div>
          <p className="text-lg font-semibold text-foreground">{t("adding")}</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground/70">
            <Money value={numeric} locale={locale} decimals={2} />
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="pe-8">
            <h2 className="text-base font-semibold text-foreground">{t("addFunds")}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("addFundsSubtitle")}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t("amount")}
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
                className="w-full min-w-0 bg-transparent text-2xl font-semibold text-foreground tnum outline-none placeholder:text-muted-foreground/50"
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
                  <Money value={p} locale={locale} decimals={0} compact />
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full" size="lg" disabled={!valid} onClick={submit}>
            <Plus className="h-4 w-4" />
            {t("addFunds")}
          </Button>
        </div>
      )}
    </Dialog>
  );
}
