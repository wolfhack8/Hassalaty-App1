"use client";

import { useState } from "react";
import { Gift, Sparkles, Smartphone, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pick, type Localized } from "@/lib/localized";
import { useChildHome } from "./child-home-provider";

export type RewardRow = {
  id: string;
  title: Localized;
  description: Localized | null;
  pointsCost: number;
  kind: "DIGITAL_THEME" | "REAL_WORLD";
};

export type RedemptionRow = {
  id: string;
  rewardId: string;
  pointsCost: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FULFILLED";
  requestedAt: string;
  reward: { title: Localized };
};

const COPY = {
  en: {
    title: "Rewards Store",
    subtitle: "Trade your points for something fun.",
    redeem: "Redeem",
    redeeming: "Redeeming…",
    notEnough: "Not enough points",
    myRequests: "My requests",
    empty: "No requests yet — redeem a reward above!",
    status: { PENDING: "Waiting for approval", APPROVED: "Approved", REJECTED: "Refunded", FULFILLED: "Fulfilled" },
    success: "Request sent to your parent!",
    error: "Couldn't redeem — please try again.",
  },
  ar: {
    title: "متجر المكافآت",
    subtitle: "استبدل نقاطك بشيء ممتع.",
    redeem: "استبدال",
    redeeming: "جارٍ الاستبدال…",
    notEnough: "النقاط غير كافية",
    myRequests: "طلباتي",
    empty: "لا توجد طلبات بعد — استبدل مكافأة من الأعلى!",
    status: { PENDING: "بانتظار موافقة والدك", APPROVED: "تمت الموافقة", REJECTED: "تم استرجاع النقاط", FULFILLED: "تم التنفيذ" },
    success: "تم إرسال الطلب لوالدك!",
    error: "تعذّر الاستبدال — حاول مرة أخرى.",
  },
} as const;

const STATUS_TONE: Record<RedemptionRow["status"], "warning" | "positive" | "negative"> = {
  PENDING: "warning",
  APPROVED: "positive",
  FULFILLED: "positive",
  REJECTED: "negative",
};

const STATUS_ICON = { PENDING: Clock, APPROVED: CheckCircle2, FULFILLED: CheckCircle2, REJECTED: XCircle } as const;

export function RewardStore({
  initialRewards,
  initialRedemptions,
}: {
  initialRewards: RewardRow[];
  initialRedemptions: RedemptionRow[];
}) {
  const { locale, points, setPoints } = useChildHome();
  const t = COPY[locale];
  const [redemptions, setRedemptions] = useState(initialRedemptions);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleRedeem(reward: RewardRow) {
    if (points < reward.pointsCost || pendingId) return;
    setPendingId(reward.id);
    try {
      const res = await fetch("/api/family/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");

      setPoints(data.remainingPoints);
      setRedemptions((prev) => [
        {
          id: data.redemptionId,
          rewardId: reward.id,
          pointsCost: reward.pointsCost,
          status: "PENDING",
          requestedAt: new Date().toISOString(),
          reward: { title: reward.title },
        },
        ...prev,
      ]);
      toast.success(t.success);
    } catch {
      toast.error(t.error);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-warning-soft text-warning">
            <Gift className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">{t.title}</h2>
            <p className="text-xs text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {initialRewards.map((reward) => {
            const affordable = points >= reward.pointsCost;
            const busy = pendingId === reward.id;
            return (
              <div key={reward.id} className="flex flex-col rounded-2xl border border-border bg-surface-muted p-4">
                <div className="flex items-start gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary-strong">
                    {reward.kind === "DIGITAL_THEME" ? (
                      <Sparkles className="h-4 w-4" />
                    ) : (
                      <Smartphone className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{pick(reward.title, locale)}</p>
                    {reward.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{pick(reward.description, locale)}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold tnum text-warning">{reward.pointsCost} ⭐</span>
                  <Button size="sm" variant={affordable ? "primary" : "outline"} disabled={!affordable || busy} onClick={() => handleRedeem(reward)}>
                    {busy ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.redeeming}
                      </>
                    ) : affordable ? (
                      t.redeem
                    ) : (
                      t.notEnough
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-foreground">{t.myRequests}</h3>
        {redemptions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t.empty}</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60">
            {redemptions.map((r) => {
              const Icon = STATUS_ICON[r.status];
              return (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-medium text-foreground">{pick(r.reward.title, locale)}</span>
                  <Badge tone={STATUS_TONE[r.status]}>
                    <Icon className="h-3 w-3" />
                    {t.status[r.status]}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
