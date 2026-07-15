import { prisma } from "@/lib/db";
import { completeJSON } from "@/server/ai/openrouter";
import { categoryLabel, getChildSpendingSummary, type ChildSpendingSummary } from "./get-family-context";
import type { InsightPeriod } from "@prisma/client";

export type InsightResult = {
  id: string;
  summary: string;
  topCategory: string | null;
  topCategoryPercentage: number | null;
  riskLevel: "low" | "medium" | "high";
  suggestedChallengeTitle: string | null;
  suggestedChallengeDescription: string | null;
  model: string | null;
  createdAt: string;
};

type RawInsight = {
  summary: string;
  riskLevel: "low" | "medium" | "high";
  suggestedChallengeTitle: string;
  suggestedChallengeDescription: string;
};

/** Runtime shape guard for the model's JSON reply — no schema library needed
 *  for one small, flat object; kept in the same "TS assertion + defensive
 *  check" style already used for the streamed chat payloads in this repo. */
function isRawInsight(value: unknown): value is RawInsight {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.summary === "string" &&
    (v.riskLevel === "low" || v.riskLevel === "medium" || v.riskLevel === "high") &&
    typeof v.suggestedChallengeTitle === "string" &&
    typeof v.suggestedChallengeDescription === "string"
  );
}

function buildInsightPrompt(locale: "en" | "ar", data: ChildSpendingSummary) {
  const categoryLines = data.byCategory
    .map((c) => `- ${categoryLabel(c.category, "en")}: SAR ${c.amount.toFixed(0)} (${c.percentage}%)`)
    .join("\n");

  const system = `You are the "Hassalaty" insight engine. You write ONE short, warm, practical summary for a PARENT about their CHILD's spending on the Hassalaty app, grounded strictly in the figures given to you.

Reply with RAW JSON ONLY (no markdown fences, no prose outside the JSON) matching EXACTLY this shape:
{"summary": string, "riskLevel": "low"|"medium"|"high", "suggestedChallengeTitle": string, "suggestedChallengeDescription": string}

RULES
- "summary": 1-3 sentences, ${locale === "ar" ? "written in warm, natural Modern Standard Arabic" : "written in English"}. Reference the real top spending category and its percentage if one is given. Never invent numbers not present in the data below.
- "riskLevel": "high" if any one category is 45%+ of spend, "medium" if 25-45%, otherwise "low".
- "suggestedChallengeTitle": a short, encouraging weekly challenge name for the CHILD (e.g. a spending-limit or savings challenge tied to the top category).
- "suggestedChallengeDescription": one sentence explaining the challenge and its point reward, ${locale === "ar" ? "in Arabic" : "in English"}.
- Tone: supportive coaching for the parent, never alarmist, never shaming the child.`;

  const user = `CHILD SPENDING DATA (last 7 days, currency SAR):
Total spend: ${data.totalSpend.toFixed(0)}
Total income/allowance received: ${data.totalIncome.toFixed(0)}
Transaction count: ${data.transactionCount}
Current points balance: ${data.points}
By category:
${categoryLines || "(no spending recorded this period)"}`;

  return { system, user };
}

/**
 * Deterministic, non-AI insight — used whenever no OPENROUTER_API_KEY is
 * configured, or both models fail. Mirrors `scriptedReply` in
 * `app/api/chat/scripted.ts`: the feature must always produce a real,
 * data-grounded result, demo or not.
 */
function buildFallbackInsight(locale: "en" | "ar", data: ChildSpendingSummary): RawInsight {
  const top = data.topCategory;
  const label = top ? categoryLabel(top.category, locale) : null;

  if (!top || data.totalSpend === 0) {
    return locale === "ar"
      ? {
          summary: "لا يوجد إنفاق مسجّل لهذا الأسبوع بعد — رصيده الحالي محفوظ بالكامل في صناديقه.",
          riskLevel: "low",
          suggestedChallengeTitle: "أسبوع الادخار الأول",
          suggestedChallengeDescription: "حافظ على عدم الصرف لمدة أسبوع كامل لتربح 10 نقاط إضافية.",
        }
      : {
          summary: "No spending has been recorded this week yet — their full balance is still saved.",
          riskLevel: "low",
          suggestedChallengeTitle: "First Savings Week",
          suggestedChallengeDescription: "Go a full week without spending to earn 10 bonus points.",
        };
  }

  const riskLevel: RawInsight["riskLevel"] = top.percentage >= 45 ? "high" : top.percentage >= 25 ? "medium" : "low";

  if (locale === "ar") {
    return {
      summary: `أنفق ${top.percentage}% من مصروفه هذا الأسبوع (${top.amount.toFixed(0)} ر.س) على "${label}". ${
        riskLevel === "high"
          ? "ننصح بوضع حد أسبوعي لهذه الفئة."
          : riskLevel === "medium"
            ? "جيد بشكل عام، مع إمكانية تنويع الإنفاق أكثر."
            : "توزيع إنفاق متوازن هذا الأسبوع."
      }`,
      riskLevel,
      suggestedChallengeTitle: `تحدي حد ${label}`,
      suggestedChallengeDescription: `لا تتجاوز إنفاقك على "${label}" هذا الأسبوع لتربح 20 نقطة إضافية.`,
    };
  }
  return {
    summary: `They spent ${top.percentage}% of this week's budget (SAR ${top.amount.toFixed(0)}) on ${label}. ${
      riskLevel === "high"
        ? "Consider setting a weekly limit for this category."
        : riskLevel === "medium"
          ? "Generally healthy, with room to diversify spending."
          : "A well-balanced spending spread this week."
    }`,
    riskLevel,
    suggestedChallengeTitle: `${label} Limit Challenge`,
    suggestedChallengeDescription: `Keep ${label} spending under control this week to earn 20 bonus points.`,
  };
}

/**
 * Generate (via AI, falling back to a rule-based summary) and persist a
 * Parent Insight report for one child, then return it in the shape the
 * `ParentInsightsPanel` component renders. This is the concrete
 * implementation behind the "AI Parent Insights Generator" feature.
 */
export async function generateParentInsight(params: {
  parentUserId: string;
  childUserId: string;
  locale: "en" | "ar";
  period?: InsightPeriod;
}): Promise<InsightResult | { error: string }> {
  const period = params.period ?? "WEEKLY";
  const days = period === "MONTHLY" ? 30 : 7;

  const data = await getChildSpendingSummary(params.childUserId, days);
  if (!data) return { error: "child_not_found" };

  const { system, user } = buildInsightPrompt(params.locale, data);
  const raw = await completeJSON(system, user);

  let parsed: RawInsight | null = null;
  let modelUsed: string | null = null;
  if (raw) {
    try {
      const candidate = JSON.parse(raw);
      if (isRawInsight(candidate)) {
        parsed = candidate;
        modelUsed = process.env.OPENROUTER_MODEL || "google/gemini-3.5-flash";
      }
    } catch {
      parsed = null;
    }
  }
  if (!parsed) {
    parsed = buildFallbackInsight(params.locale, data);
    modelUsed = null; // rule-based, not AI-generated
  }

  const saved = await prisma.parentInsightReport.create({
    data: {
      childUserId: params.childUserId,
      generatedByUserId: params.parentUserId,
      period,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      locale: params.locale,
      summary: parsed.summary,
      topCategory: data.topCategory ? categoryLabel(data.topCategory.category, params.locale) : null,
      topCategoryPercentage: data.topCategory?.percentage ?? null,
      riskLevel: parsed.riskLevel,
      suggestedChallengeTitle: parsed.suggestedChallengeTitle,
      suggestedChallengeDescription: parsed.suggestedChallengeDescription,
      model: modelUsed,
    },
  });

  return {
    id: saved.id,
    summary: saved.summary,
    topCategory: saved.topCategory,
    topCategoryPercentage: saved.topCategoryPercentage,
    riskLevel: saved.riskLevel as InsightResult["riskLevel"],
    suggestedChallengeTitle: saved.suggestedChallengeTitle,
    suggestedChallengeDescription: saved.suggestedChallengeDescription,
    model: saved.model,
    createdAt: saved.createdAt.toISOString(),
  };
}

/** Insight history for a child, most recent first — used to render past reports. */
export async function listParentInsights(childUserId: string, take = 10): Promise<InsightResult[]> {
  const rows = await prisma.parentInsightReport.findMany({
    where: { childUserId },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map(
    (r: {
      id: string;
      summary: string;
      topCategory: string | null;
      topCategoryPercentage: number | null;
      riskLevel: string;
      suggestedChallengeTitle: string | null;
      suggestedChallengeDescription: string | null;
      model: string | null;
      createdAt: Date;
    }) => ({
      id: r.id,
      summary: r.summary,
      topCategory: r.topCategory,
      topCategoryPercentage: r.topCategoryPercentage,
      riskLevel: r.riskLevel as InsightResult["riskLevel"],
      suggestedChallengeTitle: r.suggestedChallengeTitle,
      suggestedChallengeDescription: r.suggestedChallengeDescription,
      model: r.model,
      createdAt: r.createdAt.toISOString(),
    }),
  );
}
