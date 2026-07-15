"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, RotateCw, Target, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useChildDetail } from "./child-detail-provider";
import type { InsightResult } from "@/server/family/parent-insights";

const RISK_STYLE: Record<InsightResult["riskLevel"], { tone: "positive" | "warning" | "negative"; barClass: string }> = {
  low: { tone: "positive", barClass: "bg-positive" },
  medium: { tone: "warning", barClass: "bg-warning" },
  high: { tone: "negative", barClass: "bg-negative" },
};

const COPY = {
  en: {
    title: "AI Parent Insights",
    subtitle: "A short, data-grounded read on their spending — generated on demand.",
    generate: "Generate this week's insight",
    generating: "Analyzing spending…",
    regenerate: "Regenerate",
    empty: "No insight generated yet. Create one from this week's real transactions.",
    topCategory: "Top category",
    challenge: "Suggested weekly challenge",
    risk: { low: "Low risk", medium: "Medium risk", high: "High risk" },
    history: "Earlier reports",
    ruleBased: "Rule-based (no AI key configured)",
    error: "Couldn't generate an insight — please try again.",
    success: "New insight ready.",
  },
  ar: {
    title: "رؤى الذكاء الاصطناعي للأب",
    subtitle: "قراءة قصيرة ومبنية على بيانات حقيقية لإنفاقه — تُولَّد عند الطلب.",
    generate: "توليد رؤية هذا الأسبوع",
    generating: "جارٍ تحليل الإنفاق…",
    regenerate: "توليد جديد",
    empty: "لا توجد رؤية بعد. أنشئ واحدة من معاملات هذا الأسبوع الحقيقية.",
    topCategory: "الفئة الأعلى إنفاقاً",
    challenge: "تحدٍ أسبوعي مقترح",
    risk: { low: "مخاطرة منخفضة", medium: "مخاطرة متوسطة", high: "مخاطرة مرتفعة" },
    history: "تقارير سابقة",
    ruleBased: "تحليل قائم على قواعد (بدون مفتاح ذكاء اصطناعي مُفعّل)",
    error: "تعذّر توليد الرؤية — حاول مرة أخرى.",
    success: "الرؤية الجديدة جاهزة.",
  },
} as const;

/**
 * The AI Parent Insights component: reads the current child from
 * `ChildDetailContext` (no props needed — see `child-detail-provider.tsx`),
 * lets the parent trigger a fresh AI-generated (or rule-based fallback)
 * summary of the child's real spending, and renders the result alongside
 * the suggested weekly challenge. POSTs to `/api/family/insights`.
 */
export function ParentInsightsPanel() {
  const { childId, locale, insights, addInsight } = useChildDetail();
  const [loading, setLoading] = useState(false);
  const t = COPY[locale];

  const latest = insights[0] ?? null;

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/family/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, locale, period: "WEEKLY" }),
      });
      if (!res.ok) throw new Error("request_failed");
      const data = (await res.json()) as { report: InsightResult };
      addInsight(data.report);
      toast.success(t.success);
    } catch {
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-primary-strong">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <div>
            <CardTitle>{t.title}</CardTitle>
            <p className="text-xs text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
        <Button size="sm" variant={latest ? "outline" : "primary"} onClick={handleGenerate} disabled={loading}>
          {loading ? (
            <>
              <RotateCw className="h-4 w-4 animate-spin" />
              {t.generating}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {latest ? t.regenerate : t.generate}
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent>
        {!latest && !loading && <p className="py-6 text-center text-sm text-muted-foreground">{t.empty}</p>}

        {loading && !latest && (
          <div className="animate-pulse space-y-3" aria-hidden>
            <div className="h-4 w-3/4 rounded-full bg-accent" />
            <div className="h-4 w-1/2 rounded-full bg-accent" />
            <div className="h-16 w-full rounded-2xl bg-accent" />
          </div>
        )}

        {latest && (
          <div className="space-y-4 animate-fade-up">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-relaxed text-foreground">{latest.summary}</p>
              <Badge tone={RISK_STYLE[latest.riskLevel].tone} className="shrink-0">
                {latest.riskLevel === "high" ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <ShieldCheck className="h-3 w-3" />
                )}
                {t.risk[latest.riskLevel]}
              </Badge>
            </div>

            {latest.topCategory && latest.topCategoryPercentage != null && (
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {t.topCategory}: {latest.topCategory}
                  </span>
                  <span className="tnum font-medium text-foreground">{latest.topCategoryPercentage}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-accent">
                  <div
                    className={`h-full rounded-full ${RISK_STYLE[latest.riskLevel].barClass}`}
                    style={{ width: `${Math.min(100, latest.topCategoryPercentage)}%` }}
                  />
                </div>
              </div>
            )}

            {latest.suggestedChallengeTitle && (
              <div className="rounded-2xl border border-border bg-surface-muted p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Target className="h-3.5 w-3.5 text-primary-strong" />
                  {t.challenge}: {latest.suggestedChallengeTitle}
                </p>
                {latest.suggestedChallengeDescription && (
                  <p className="mt-1 text-xs text-muted-foreground">{latest.suggestedChallengeDescription}</p>
                )}
              </div>
            )}

            {!latest.model && <p className="text-[0.7rem] text-subtle-foreground">{t.ruleBased}</p>}
          </div>
        )}

        {insights.length > 1 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
              {t.history} ({insights.length - 1})
            </summary>
            <ul className="mt-2 space-y-2">
              {insights.slice(1).map((r) => (
                <li key={r.id} className="rounded-xl bg-surface-muted p-3 text-xs text-muted-foreground">
                  {r.summary}
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
