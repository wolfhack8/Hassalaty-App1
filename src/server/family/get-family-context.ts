import { prisma } from "@/lib/db";
import { loc, type Localized } from "@/lib/localized";
import { categories } from "@/data/categories";
import type { CategoryId } from "@/data/types";
import type { FamilyRole } from "@prisma/client";

function asLocalized(value: unknown, fallback: Localized): Localized {
  if (value && typeof value === "object" && "en" in value && "ar" in value) {
    return value as Localized;
  }
  return fallback;
}

export type FamilyChildSummary = {
  userId: string;
  email: string;
  name: Localized;
  points: number;
  weekSpend: number;
  monthSpend: number;
  pendingRedemptions: number;
  activeChallenge: { title: string; progress: number; targetPoints: number | null } | null;
  lastActivity: string | null;
};

export type FamilyOverview = {
  family: { id: string; name: Localized };
  parent: { userId: string; email: string; name: Localized };
  children: FamilyChildSummary[];
};

/**
 * Everything the parent console overview needs in one call: every child in
 * the family plus their points, recent spend, pending reward requests and
 * active challenge. Mirrors `getCompanyContext`'s per-employee aggregation.
 */
export async function getFamilyOverview(familyId: string): Promise<FamilyOverview | null> {
  const family = await prisma.family.findUnique({
    where: { id: familyId },
    include: {
      creator: { select: { id: true, email: true, name: true } },
      members: {
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!family) return null;

  const childMemberships = family.members.filter((m) => m.role === "CHILD");
  const childIds = childMemberships.map((m) => m.userId);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [weekAgg, monthAgg, lastTx, pendingByChild, activeChallenges] = await Promise.all([
    childIds.length
      ? prisma.transaction.groupBy({
          by: ["userId"],
          where: { userId: { in: childIds }, type: "expense", date: { gte: weekAgo } },
          _sum: { amount: true },
        })
      : Promise.resolve([]),
    childIds.length
      ? prisma.transaction.groupBy({
          by: ["userId"],
          where: { userId: { in: childIds }, type: "expense", date: { gte: monthAgo } },
          _sum: { amount: true },
        })
      : Promise.resolve([]),
    childIds.length
      ? prisma.transaction.groupBy({
          by: ["userId"],
          where: { userId: { in: childIds } },
          _max: { date: true },
        })
      : Promise.resolve([]),
    childIds.length
      ? prisma.redeemedReward.groupBy({
          by: ["userId"],
          where: { userId: { in: childIds }, status: "PENDING" },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    childIds.length
      ? prisma.challenge.findMany({
          where: { userId: { in: childIds }, status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const weekMap = new Map(weekAgg.map((r) => [r.userId, Math.abs(r._sum.amount ?? 0)]));
  const monthMap = new Map(monthAgg.map((r) => [r.userId, Math.abs(r._sum.amount ?? 0)]));
  const lastMap = new Map(lastTx.map((r) => [r.userId, r._max.date ?? null]));
  const pendingMap = new Map(pendingByChild.map((r) => [r.userId, r._count._all]));
  const challengeMap = new Map(activeChallenges.map((c) => [c.userId, c]));

  const children: FamilyChildSummary[] = childMemberships.map((m) => {
    const challenge = challengeMap.get(m.userId);
    return {
      userId: m.userId,
      email: m.user.email,
      name: asLocalized(m.user.name, loc("Child", "الابن")),
      points: m.points,
      weekSpend: weekMap.get(m.userId) ?? 0,
      monthSpend: monthMap.get(m.userId) ?? 0,
      pendingRedemptions: pendingMap.get(m.userId) ?? 0,
      activeChallenge: challenge
        ? { title: challenge.title, progress: challenge.progress, targetPoints: challenge.targetPoints }
        : null,
      lastActivity: lastMap.get(m.userId)?.toISOString() ?? null,
    };
  });

  return {
    family: { id: family.id, name: asLocalized(family.name, loc("Our Family", "عائلتنا")) },
    parent: {
      userId: family.creator.id,
      email: family.creator.email,
      name: asLocalized(family.creator.name, loc("Parent", "ولي الأمر")),
    },
    children,
  };
}

export type CategoryBreakdownRow = { category: CategoryId; amount: number; percentage: number };

export type ChildSpendingSummary = {
  childUserId: string;
  name: Localized;
  points: number;
  periodStart: string;
  periodEnd: string;
  totalSpend: number;
  totalIncome: number;
  transactionCount: number;
  byCategory: CategoryBreakdownRow[];
  topCategory: CategoryBreakdownRow | null;
  recentTransactions: Array<{
    merchant: string;
    category: CategoryId;
    amount: number;
    date: string;
  }>;
};

/**
 * Real spending data for one child over the last `days` days — the exact
 * numbers both the AI Parent Insights generator and the on-screen panel are
 * grounded in, so the AI can never report a figure that doesn't match what
 * the parent sees rendered next to it.
 */
export async function getChildSpendingSummary(
  childUserId: string,
  days = 7,
): Promise<ChildSpendingSummary | null> {
  const user = await prisma.user.findUnique({
    where: { id: childUserId },
    select: {
      name: true,
      familyMembership: { select: { points: true } },
      transactions: { orderBy: { date: "desc" } },
    },
  });
  if (!user || !user.familyMembership) return null;

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - days * 24 * 60 * 60 * 1000);
  const inPeriod = user.transactions.filter(
    (t: { date: Date }) => t.date >= periodStart && t.date <= periodEnd,
  );

  const expenses = inPeriod.filter((t: { type: string }) => t.type === "expense");
  const totalSpend = expenses.reduce((s: number, t: { amount: number }) => s + Math.abs(t.amount), 0);
  const totalIncome = inPeriod
    .filter((t: { type: string }) => t.type === "income")
    .reduce((s: number, t: { amount: number }) => s + t.amount, 0);

  const tally = new Map<string, number>();
  for (const t of expenses as Array<{ category: string; amount: number }>) {
    tally.set(t.category, (tally.get(t.category) ?? 0) + Math.abs(t.amount));
  }
  const byCategory: CategoryBreakdownRow[] = Array.from(tally.entries())
    .map(([category, amount]) => ({
      category: category as CategoryId,
      amount,
      percentage: totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    childUserId,
    name: asLocalized(user.name, loc("Child", "الابن")),
    points: user.familyMembership.points,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    totalSpend,
    totalIncome,
    transactionCount: inPeriod.length,
    byCategory,
    topCategory: byCategory[0] ?? null,
    recentTransactions: (
      inPeriod as Array<{ merchant: unknown; category: string; amount: number; date: Date }>
    )
      .slice(0, 8)
      .map((t) => ({
        merchant: asLocalized(t.merchant, loc("Merchant", "تاجر")).en,
        category: t.category as CategoryId,
        amount: t.amount,
        date: t.date.toISOString(),
      })),
  };
}

export type FamilyMembershipInfo = {
  role: FamilyRole;
  points: number;
  familyId: string;
  familyName: Localized;
};

/**
 * Family context attached to a user's dashboard data, mirroring
 * `getDashboardOrg`. A PARENT gets nothing extra here (they use the full
 * `/parent` console instead); a CHILD gets their own role/points, suitable
 * for a small "Family" card on their personal dashboard.
 */
export async function getDashboardFamily(userId: string): Promise<{ familyMembership?: FamilyMembershipInfo }> {
  const membership = await prisma.familyMembership.findUnique({
    where: { userId },
    include: { family: { select: { name: true } } },
  });
  if (!membership) return {};

  return {
    familyMembership: {
      role: membership.role,
      points: membership.points,
      familyId: membership.familyId,
      familyName: asLocalized(membership.family.name, loc("Our Family", "عائلتنا")),
    },
  };
}

/** Human-friendly category label helper shared by the insights UI + prompts. */
export function categoryLabel(id: CategoryId, locale: "en" | "ar"): string {
  const cat = categories[id];
  return cat ? cat.name[locale] : id;
}
