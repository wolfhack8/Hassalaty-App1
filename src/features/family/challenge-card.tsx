"use client";

import { Target, PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ChallengeResult } from "@/server/family/weekly-challenge";

const COPY = {
  en: { title: "This week's challenge", none: "No active challenge yet — ask your parent to set one!", completed: "Challenge complete! 🎉", points: "pts" },
  ar: { title: "تحدي هذا الأسبوع", none: "لا يوجد تحدٍ نشط بعد — اطلب من والدك يضيف لك واحد!", completed: "أكملت التحدي! 🎉", points: "نقطة" },
} as const;

/** Reads no props beyond the challenge itself — used identically on the
 *  child's own home page and (read-only) inside the parent's child-detail view. */
export function ChallengeCard({ challenge, locale }: { challenge: ChallengeResult | null; locale: "en" | "ar" }) {
  const t = COPY[locale];

  if (!challenge) {
    return (
      <Card className="p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Target className="h-4 w-4 text-primary-strong" />
          {t.title}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{t.none}</p>
      </Card>
    );
  }

  const target = challenge.targetPoints ?? 0;
  const pct = target > 0 ? Math.min(100, Math.round((challenge.progress / target) * 100)) : 0;
  const isComplete = challenge.status === "COMPLETED";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {isComplete ? (
            <PartyPopper className="h-4 w-4 text-positive" />
          ) : (
            <Target className="h-4 w-4 text-primary-strong" />
          )}
          {challenge.title}
        </p>
        {isComplete && <Badge tone="positive">{t.completed}</Badge>}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{challenge.description}</p>

      {target > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground">
            <span>
              {challenge.progress} / {target} {t.points}
            </span>
            <span className="tnum font-medium text-foreground">{pct}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-accent">
            <div
              className={`h-full rounded-full transition-all ${isComplete ? "bg-positive" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
