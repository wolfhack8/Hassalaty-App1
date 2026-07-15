"use client";

import { useState } from "react";
import { Check, X, Plus, Loader2, Gift } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { pick, type Localized } from "@/lib/localized";

export type PendingRedemptionRow = {
  id: string;
  pointsCost: number;
  requestedAt: string;
  childName: string;
  rewardTitle: string;
};

const COPY = {
  en: {
    pendingTitle: "Pending reward requests",
    pendingEmpty: "Nothing waiting for approval.",
    approve: "Approve",
    reject: "Refund & reject",
    catalogTitle: "Add a custom reward",
    titleLabel: "Title (English)",
    titleArLabel: "Title (Arabic)",
    costLabel: "Points cost",
    kindLabel: "Type",
    digital: "App theme",
    real: "Real-world reward",
    add: "Add reward",
    added: "Reward added to the family catalog.",
    resolved: "Request resolved.",
    error: "Something went wrong — please try again.",
  },
  ar: {
    pendingTitle: "طلبات المكافآت المعلّقة",
    pendingEmpty: "لا توجد طلبات بانتظار الموافقة.",
    approve: "موافقة",
    reject: "رفض واسترجاع النقاط",
    catalogTitle: "إضافة مكافأة مخصصة",
    titleLabel: "العنوان (إنجليزي)",
    titleArLabel: "العنوان (عربي)",
    costLabel: "تكلفة النقاط",
    kindLabel: "النوع",
    digital: "ثيم للتطبيق",
    real: "مكافأة واقعية",
    add: "إضافة المكافأة",
    added: "تمت إضافة المكافأة لكتالوج العائلة.",
    resolved: "تم البت في الطلب.",
    error: "صار خطأ — حاول مرة أخرى.",
  },
} as const;

export function ParentRewardsManager({
  locale,
  initialPending,
}: {
  locale: "en" | "ar";
  initialPending: PendingRedemptionRow[];
}) {
  const t = COPY[locale];
  const [pending, setPending] = useState(initialPending);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [cost, setCost] = useState("30");
  const [kind, setKind] = useState<"DIGITAL_THEME" | "REAL_WORLD">("DIGITAL_THEME");
  const [saving, setSaving] = useState(false);

  async function resolve(id: string, approve: boolean) {
    setResolvingId(id);
    try {
      const res = await fetch(`/api/family/rewards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      });
      if (!res.ok) throw new Error("failed");
      setPending((prev) => prev.filter((p) => p.id !== id));
      toast.success(t.resolved);
    } catch {
      toast.error(t.error);
    } finally {
      setResolvingId(null);
    }
  }

  async function addReward(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/family/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, titleAr, pointsCost: Number(cost), kind }),
      });
      if (!res.ok) throw new Error("failed");
      toast.success(t.added);
      setTitle("");
      setTitleAr("");
      setCost("30");
    } catch {
      toast.error(t.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-warning-soft text-warning">
              <Gift className="h-4.5 w-4.5" />
            </span>
            <CardTitle>{t.pendingTitle}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t.pendingEmpty}</p>
          ) : (
            <ul className="space-y-3">
              {pending.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border bg-surface-muted p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.rewardTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.childName} · {r.pointsCost} {locale === "ar" ? "نقطة" : "pts"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => resolve(r.id, true)} disabled={resolvingId === r.id}>
                      {resolvingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      {t.approve}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => resolve(r.id, false)} disabled={resolvingId === r.id}>
                      <X className="h-3.5 w-3.5" />
                      {t.reject}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.catalogTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addReward} className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.titleLabel}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
              required
            />
            <input
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              placeholder={t.titleArLabel}
              dir="rtl"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
            />
            <div className="flex gap-3">
              <input
                type="number"
                min={1}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder={t.costLabel}
                className="w-32 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
              />
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as typeof kind)}
                className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
              >
                <option value="DIGITAL_THEME">{t.digital}</option>
                <option value="REAL_WORLD">{t.real}</option>
              </select>
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {t.add}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function localizedRewardTitle(value: unknown, locale: "en" | "ar", fallback: Localized): string {
  const shaped =
    value && typeof value === "object" && "en" in value && "ar" in value ? (value as Localized) : fallback;
  return pick(shaped, locale);
}
