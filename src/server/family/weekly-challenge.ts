import { prisma } from "@/lib/db";
import { completeJSON } from "@/server/ai/openrouter";
import { categoryLabel, getChildSpendingSummary, type ChildSpendingSummary } from "./get-family-context";
import { ChallengeStatus } from "@prisma/client";

export type ChallengeResult = {
  id: string;
  title: string;
  description: string;
  targetPoints: number | null;
  progress: number;
  status: ChallengeStatus;
  weekStart: string;
  weekEnd: string;
  aiGenerated: boolean;
};

type RawChallenge = { title: string; description: string; targetPoints: number };

function isRawChallenge(value: unknown): value is RawChallenge {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.title === "string" &&
    typeof v.description === "string" &&
    typeof v.targetPoints === "number" &&
    Number.isFinite(v.targetPoints)
  );
}

function buildChallengePrompt(locale: "en" | "ar", data: ChildSpendingSummary) {
  const top = data.topCategory;
  const topLabel = top ? categoryLabel(top.category, "en") : null;

  const system = `You are the "Hassalaty" weekly-challenge generator. You design ONE short, achievable, motivating savings/spending challenge for a CHILD, sized to their real activity.

Reply with RAW JSON ONLY (no markdown fences, no prose outside the JSON) matching EXACTLY:
{"title": string, "description": string, "targetPoints": number}

RULES
- "title": under 6 words, playful and specific, ${locale === "ar" ? "in Arabic" : "in English"}.
- "description": ONE sentence explaining exactly what to do and the point reward for finishing it, ${locale === "ar" ? "in Arabic" : "in English"}. Must mention the same targetPoints number as the JSON field.
- "targetPoints": an integer between 10 and 30 — the bonus points earned for completing the challenge (not their current balance).
- Base the challenge on their REAL top spending category if one is given (e.g. a limit on that category, or a no-spend streak). If they have no notable spending, make it a general savings-streak challenge instead.
- Tone: fun and encouraging, never a punishment.`;

  const user = `CHILD ACTIVITY (last 7 days, currency SAR):
Current points: ${data.points}
Total spend: ${data.totalSpend.toFixed(0)}
Top category: ${topLabel ? `${topLabel} (${top!.percentage}% of spend)` : "none recorded"}`;

  return { system, user };
}

function buildFallbackChallenge(locale: "en" | "ar", data: ChildSpendingSummary): RawChallenge {
  const top = data.topCategory;
  if (!top) {
    return locale === "ar"
      ? { title: "أسبوع بلا صرف", description: "لا تصرف من رصيدك لمدة أسبوع كامل لتربح 15 نقطة إضافية.", targetPoints: 15 }
      : { title: "No-Spend Week", description: "Go a full week without spending to earn 15 bonus points.", targetPoints: 15 };
  }
  const label = categoryLabel(top.category, locale);
  const target = top.percentage >= 45 ? 25 : top.percentage >= 25 ? 20 : 15;
  return locale === "ar"
    ? {
        title: `تحدي حد ${label}`,
        description: `لا تتجاوز إنفاقك على "${label}" هذا الأسبوع لتربح ${target} نقطة إضافية.`,
        targetPoints: target,
      }
    : {
        title: `${label} Limit Challenge`,
        description: `Keep your ${label} spending under control this week to earn ${target} bonus points.`,
        targetPoints: target,
      };
}

function currentWeekBounds(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * Generate (AI, with a rule-based fallback) this week's challenge for a
 * child, expiring any previous ACTIVE one first — a child has exactly one
 * live challenge at a time. Mirrors `generateParentInsight`'s
 * completeJSON→validate→fallback→persist shape.
 */
export async function generateWeeklyChallenge(params: {
  childUserId: string;
  locale: "en" | "ar";
}): Promise<ChallengeResult | { error: string }> {
  const data = await getChildSpendingSummary(params.childUserId, 7);
  if (!data) return { error: "child_not_found" };

  const { system, user } = buildChallengePrompt(params.locale, data);
  const raw = await completeJSON(system, user);

  let parsed: RawChallenge | null = null;
  let aiGenerated = false;
  if (raw) {
    try {
      const candidate = JSON.parse(raw);
      if (isRawChallenge(candidate)) {
        parsed = candidate;
        aiGenerated = true;
      }
    } catch {
      parsed = null;
    }
  }
  if (!parsed) parsed = buildFallbackChallenge(params.locale, data);

  const { start, end } = currentWeekBounds();

  await prisma.challenge.updateMany({
    where: { userId: params.childUserId, status: ChallengeStatus.ACTIVE },
    data: { status: ChallengeStatus.EXPIRED },
  });

  const created = await prisma.challenge.create({
    data: {
      userId: params.childUserId,
      title: parsed.title,
      description: parsed.description,
      targetPoints: Math.max(1, Math.round(parsed.targetPoints)),
      progress: 0,
      status: ChallengeStatus.ACTIVE,
      weekStart: start,
      weekEnd: end,
      aiGenerated,
    },
  });

  return toResult(created);
}

function toResult(c: {
  id: string;
  title: string;
  description: string;
  targetPoints: number | null;
  progress: number;
  status: ChallengeStatus;
  weekStart: Date;
  weekEnd: Date;
  aiGenerated: boolean;
}): ChallengeResult {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    targetPoints: c.targetPoints,
    progress: c.progress,
    status: c.status,
    weekStart: c.weekStart.toISOString(),
    weekEnd: c.weekEnd.toISOString(),
    aiGenerated: c.aiGenerated,
  };
}

/**
 * The child's live active challenge, with progress computed from real
 * points earned (via the mini-game) since the challenge was created — not a
 * manually-nudged counter that can drift. Auto-completes (persists the
 * status flip once, then returns COMPLETED) the moment the target is met.
 */
export async function getActiveChallenge(userId: string): Promise<ChallengeResult | null> {
  const challenge = await prisma.challenge.findFirst({
    where: { userId, status: ChallengeStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) return null;

  if (challenge.targetPoints) {
    const earnedSince = await prisma.gameSession.aggregate({
      where: { userId, playedAt: { gte: challenge.createdAt } },
      _sum: { pointsEarned: true },
    });
    const liveProgress = Math.min(challenge.targetPoints, earnedSince._sum.pointsEarned ?? 0);

    if (liveProgress >= challenge.targetPoints) {
      const completed = await prisma.challenge.update({
        where: { id: challenge.id },
        data: { progress: liveProgress, status: ChallengeStatus.COMPLETED },
      });
      return toResult(completed);
    }
    if (liveProgress !== challenge.progress) {
      const updated = await prisma.challenge.update({
        where: { id: challenge.id },
        data: { progress: liveProgress },
      });
      return toResult(updated);
    }
  }

  return toResult(challenge);
}
