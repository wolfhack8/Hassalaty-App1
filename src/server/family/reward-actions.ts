import { prisma } from "@/lib/db";
import { RedemptionStatus } from "@prisma/client";

export type RedeemResult =
  | { ok: true; redemptionId: string; remainingPoints: number }
  | { ok: false; error: "reward_not_found" | "insufficient_points" };

/**
 * A child spends points against the reward catalog. Debits the points and
 * creates the PENDING request in one DB transaction (mirrors the atomic
 * debit+record pattern in `server/company/fund-employee.ts`), so a
 * double-submit can never leave points and request rows out of sync.
 * Approval/rejection happens separately via `resolveRedemption`.
 */
export async function redeemReward(childUserId: string, rewardId: string): Promise<RedeemResult> {
  const [membership, reward] = await Promise.all([
    prisma.familyMembership.findUnique({ where: { userId: childUserId } }),
    prisma.reward.findUnique({ where: { id: rewardId } }),
  ]);
  if (!reward || !reward.isActive) return { ok: false, error: "reward_not_found" };
  if (!membership || membership.points < reward.pointsCost) {
    return { ok: false, error: "insufficient_points" };
  }

  const [, updated] = await prisma.$transaction([
    prisma.redeemedReward.create({
      data: {
        userId: childUserId,
        rewardId,
        pointsCost: reward.pointsCost,
        status: RedemptionStatus.PENDING,
      },
    }),
    prisma.familyMembership.update({
      where: { userId: childUserId },
      data: { points: { decrement: reward.pointsCost } },
    }),
  ]);

  const created = await prisma.redeemedReward.findFirst({
    where: { userId: childUserId, rewardId, status: RedemptionStatus.PENDING },
    orderBy: { requestedAt: "desc" },
    select: { id: true },
  });

  return { ok: true, redemptionId: created?.id ?? "", remainingPoints: updated.points };
}

export type ResolveResult =
  | { ok: true; status: RedemptionStatus; refundedPoints: number | null }
  | { ok: false; error: "not_found" | "already_resolved" };

/**
 * A parent approves or rejects a pending redemption. Rejecting refunds the
 * points that were held; approving just stamps the resolution (the parent
 * fulfils the real-world reward outside the app). Both paths run inside a
 * transaction so the points balance and request status can never drift apart.
 */
export async function resolveRedemption(
  parentUserId: string,
  familyId: string,
  redemptionId: string,
  approve: boolean,
): Promise<ResolveResult> {
  const redemption = await prisma.redeemedReward.findUnique({
    where: { id: redemptionId },
    include: { user: { select: { familyMembership: { select: { familyId: true } } } } },
  });
  if (!redemption || redemption.user.familyMembership?.familyId !== familyId) {
    return { ok: false, error: "not_found" };
  }
  if (redemption.status !== RedemptionStatus.PENDING) {
    return { ok: false, error: "already_resolved" };
  }

  const nextStatus = approve ? RedemptionStatus.APPROVED : RedemptionStatus.REJECTED;

  if (approve) {
    await prisma.redeemedReward.update({
      where: { id: redemptionId },
      data: { status: nextStatus, resolvedAt: new Date(), resolvedByUserId: parentUserId },
    });
    return { ok: true, status: nextStatus, refundedPoints: null };
  }

  const [, membership] = await prisma.$transaction([
    prisma.redeemedReward.update({
      where: { id: redemptionId },
      data: { status: nextStatus, resolvedAt: new Date(), resolvedByUserId: parentUserId },
    }),
    prisma.familyMembership.update({
      where: { userId: redemption.userId },
      data: { points: { increment: redemption.pointsCost } },
    }),
  ]);

  return { ok: true, status: nextStatus, refundedPoints: membership.points };
}

/** Global + family-specific active rewards, cheapest first. */
export async function listRewards(familyId: string) {
  return prisma.reward.findMany({
    where: { isActive: true, OR: [{ familyId: null }, { familyId }] },
    orderBy: { pointsCost: "asc" },
  });
}

/** A child's own redemption history, most recent first — so the Rewards
 *  Store can show "pending / approved / rejected" state per past request. */
export async function listMyRedemptions(userId: string, take = 20) {
  return prisma.redeemedReward.findMany({
    where: { userId },
    include: { reward: { select: { title: true, kind: true } } },
    orderBy: { requestedAt: "desc" },
    take,
  });
}

/** Every pending redemption across a family's children — the parent's
 *  approval queue on `/parent/rewards`. */
export async function listPendingRedemptions(familyId: string) {
  return prisma.redeemedReward.findMany({
    where: { status: "PENDING", user: { familyMembership: { familyId } } },
    include: {
      reward: { select: { title: true, kind: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { requestedAt: "asc" },
  });
}

export type CreateRewardInput = {
  familyId: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  pointsCost: number;
  kind: "DIGITAL_THEME" | "REAL_WORLD";
};

/** A parent adds a custom, pre-approved reward to their family's catalog. */
export async function createFamilyReward(input: CreateRewardInput) {
  return prisma.reward.create({
    data: {
      familyId: input.familyId,
      title: { en: input.title, ar: input.titleAr ?? input.title },
      description: input.description
        ? { en: input.description, ar: input.descriptionAr ?? input.description }
        : undefined,
      pointsCost: Math.max(1, Math.round(input.pointsCost)),
      kind: input.kind,
    },
  });
}

/** Default global reward catalog, seeded once so every new family has
 *  something to redeem against immediately (idempotent — safe to call from
 *  the seed script or lazily from an API route). */
export async function ensureDefaultRewards() {
  const count = await prisma.reward.count({ where: { familyId: null } });
  if (count > 0) return;

  await prisma.reward.createMany({
    data: [
      {
        familyId: null,
        title: { en: "Golden avatar theme", ar: "ثيم الأفاتار الذهبي" },
        description: { en: "Unlock a shiny gold app theme.", ar: "افتح ثيم ذهبي لامع للتطبيق." },
        pointsCost: 30,
        kind: "DIGITAL_THEME",
      },
      {
        familyId: null,
        title: { en: "Space explorer theme", ar: "ثيم مستكشف الفضاء" },
        description: { en: "A dark, starry app theme.", ar: "ثيم داكن بنجوم متلألئة." },
        pointsCost: 30,
        kind: "DIGITAL_THEME",
      },
      {
        familyId: null,
        title: { en: "1 hour of video games", ar: "ساعة ألعاب فيديو" },
        description: { en: "Redeem for one extra hour of screen time.", ar: "استبدلها بساعة إضافية من وقت الألعاب." },
        pointsCost: 60,
        kind: "REAL_WORLD",
      },
      {
        familyId: null,
        title: { en: "Choose family movie night", ar: "اختيار فيلم السهرة العائلية" },
        description: { en: "Pick what the whole family watches this week.", ar: "اختر ما ستشاهده العائلة هذا الأسبوع." },
        pointsCost: 50,
        kind: "REAL_WORLD",
      },
      {
        familyId: null,
        title: { en: "Ice cream trip", ar: "رحلة آيسكريم" },
        description: { en: "A trip out for ice cream, on your points.", ar: "رحلة لتناول الآيسكريم على حساب نقاطك." },
        pointsCost: 80,
        kind: "REAL_WORLD",
      },
    ],
  });
}
