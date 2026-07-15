"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function AccessEditor({
  userId,
  initial,
}: {
  userId: string;
  initial: { canSpend: boolean; canTopup: boolean; spendLimit: number | null };
}) {
  const t = useTranslations("company");
  const router = useRouter();
  const [canSpend, setCanSpend] = useState(initial.canSpend);
  const [canTopup, setCanTopup] = useState(initial.canTopup);
  const [spendLimit, setSpendLimit] = useState(initial.spendLimit != null ? String(initial.spendLimit) : "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty =
    canSpend !== initial.canSpend ||
    canTopup !== initial.canTopup ||
    (spendLimit ? Number(spendLimit) : null) !== initial.spendLimit;

  async function save() {
    if (loading) return;
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/company/employees/${userId}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canSpend,
          canTopup,
          spendLimit: spendLimit ? Number(spendLimit) : null,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch {
      /* keep form state; owner can retry */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Toggle label={t("canSpend")} hint={t("canSpendHint")} checked={canSpend} onChange={setCanSpend} />
      <Toggle label={t("canTopup")} hint={t("canTopupHint")} checked={canTopup} onChange={setCanTopup} />
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">{t("spendLimit")}</span>
        <input
          value={spendLimit}
          dir="ltr"
          inputMode="numeric"
          placeholder={t("noLimit")}
          onChange={(e) => setSpendLimit(e.target.value.replace(/[^\d.]/g, ""))}
          className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
        <span className="mt-1 block text-xs text-subtle-foreground">{t("spendLimitHint")}</span>
      </label>
      <Button onClick={save} disabled={loading || !dirty} className="w-full">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4" />{t("saved")}</span>
        ) : (
          t("saveAccess")
        )}
      </Button>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-start"
    >
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-surface-muted"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "start-[1.125rem]" : "start-0.5"}`} />
      </span>
    </button>
  );
}
