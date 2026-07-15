"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function FundWallet({ userId }: { userId: string }) {
  const t = useTranslations("company");
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [funded, setFunded] = useState(false);

  const value = Number(amount);
  const valid = Number.isFinite(value) && value > 0;

  async function fund() {
    if (loading || !valid) return;
    setLoading(true);
    setFunded(false);
    try {
      const res = await fetch(`/api/company/employees/${userId}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value }),
      });
      if (!res.ok) throw new Error("fund failed");
      setFunded(true);
      setAmount("");
      setTimeout(() => setFunded(false), 2200);
      router.refresh();
    } catch {
      /* owner can retry */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">{t("fundAmount")}</span>
        <div className="flex gap-2">
          <input
            value={amount}
            dir="ltr"
            inputMode="numeric"
            placeholder="1000"
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && fund()}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          <Button onClick={fund} disabled={loading || !valid} className="shrink-0">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : funded ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="flex items-center gap-1"><Plus className="h-4 w-4" />{t("fund")}</span>
            )}
          </Button>
        </div>
      </label>
      {funded && <p className="text-xs font-medium text-positive">{t("funded")}</p>}
    </div>
  );
}
