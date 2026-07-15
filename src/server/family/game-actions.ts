import { prisma } from "@/lib/db";
import { GameType } from "@prisma/client";

/**
 * Server-side scoring rules for the mini-game. The client only ever reports
 * *raw* gameplay facts (coins caught, round duration) — never a points
 * number — so a tampered client can't hand itself points. This mirrors the
 * spirit of `fundEmployeeWallet`: every balance change is computed and
 * applied by the server, never taken from client input.
 */
const POINTS_PER_COIN = 1;
const MAX_POINTS_PER_SESSION = 40; // one round can never be worth more than this
const MIN_ROUND_MS = 8_000; // rounds are 30s in the UI; guards against instant replays
const MAX_ROUND_MS = 90_000;
const DAILY_POINT_CAP_FROM_GAME = 80; // stops grinding the same mini-game all day

export type SubmitGameResult =
  | { ok: true; pointsEarned: number; totalPoints: number; cappedByDailyLimit: boolean }
  | { ok: false; error: "invalid_input" };

export async function submitGameSession(params: {
  userId: string;
  gameType: GameType;
  score: number;
  durationMs: number;
}): Promise<SubmitGameResult> {
  const { userId, gameType, score, durationMs } = params;

  if (
    !Number.isFinite(score) ||
    score < 0 ||
    !Number.isInteger(score) ||
    !Number.isFinite(durationMs) ||
    durationMs < MIN_ROUND_MS ||
    durationMs > MAX_ROUND_MS
  ) {
    return { ok: false, error: "invalid_input" };
  }

  const rawPoints = Math.min(MAX_POINTS_PER_SESSION, Math.round(score * POINTS_PER_COIN));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const earnedToday = await prisma.gameSession.aggregate({
    where: { userId, playedAt: { gte: todayStart } },
    _sum: { pointsEarned: true },
  });
  const alreadyToday = earnedToday._sum.pointsEarned ?? 0;
  const allowance = Math.max(0, DAILY_POINT_CAP_FROM_GAME - alreadyToday);
  const pointsEarned = Math.min(rawPoints, allowance);

  const [, membership] = await prisma.$transaction([
    prisma.gameSession.create({
      data: { userId, gameType, score, pointsEarned },
    }),
    prisma.familyMembership.update({
      where: { userId },
      data: { points: { increment: pointsEarned } },
    }),
  ]);

  return {
    ok: true,
    pointsEarned,
    totalPoints: membership.points,
    cappedByDailyLimit: pointsEarned < rawPoints,
  };
}

/** Recent play history for a child — used by the parent's game-stats view. */
export async function listGameSessions(userId: string, take = 20) {
  return prisma.gameSession.findMany({
    where: { userId },
    orderBy: { playedAt: "desc" },
    take,
  });
}

export { GameType };
