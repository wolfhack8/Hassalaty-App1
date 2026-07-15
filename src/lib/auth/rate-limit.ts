import { prisma } from "@/lib/db";
import { OtpPurpose, Prisma } from "@prisma/client";

const SEND_WINDOW_MS = 15 * 60 * 1000;
const MAX_SENDS = 3;

export async function canSendOtp(identifier: string): Promise<boolean> {
  const since = new Date(Date.now() - SEND_WINDOW_MS);
  const count = await prisma.otpChallenge.count({
    where: {
      identifier,
      createdAt: { gte: since },
      consumedAt: null,
    },
  });
  return count < MAX_SENDS;
}

export async function createOtpChallenge(input: {
  identifier: string;
  resolvedEmail: string;
  codeHash: string;
  purpose: OtpPurpose;
  userId?: string;
  metadata?: Prisma.InputJsonValue;
  expiresAt: Date;
}) {
  return prisma.otpChallenge.create({
    data: {
      identifier: input.identifier,
      resolvedEmail: input.resolvedEmail,
      codeHash: input.codeHash,
      purpose: input.purpose,
      userId: input.userId,
      metadata: input.metadata,
      expiresAt: input.expiresAt,
    },
  });
}

export async function getActiveOtpChallenge(id: string) {
  return prisma.otpChallenge.findFirst({
    where: {
      id,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
}
