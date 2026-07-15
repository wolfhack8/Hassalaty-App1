import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export type ParentSession = {
  userId: string;
  email: string;
  familyId: string;
};

export type ChildSession = {
  userId: string;
  email: string;
  familyId: string;
};

/**
 * Authoritative parent gate for server components / route handlers. Verifies
 * PARENT membership against the DB (not the session token, which is only
 * used for the coarse, edge-safe pre-check in `middleware.ts`), so a stale
 * token cannot grant access. Redirects otherwise. Mirrors
 * `requireCompanyOwner` in `server/company/require-company.ts`.
 */
export async function requireParent(locale = "en"): Promise<ParentSession> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }
  const membership = await prisma.familyMembership.findUnique({
    where: { userId: session.user.id },
    select: { role: true, familyId: true, user: { select: { email: true } } },
  });
  if (!membership || membership.role !== "PARENT") {
    redirect(`/${locale}/dashboard`);
  }
  return {
    userId: session.user.id,
    email: membership.user.email,
    familyId: membership.familyId,
  };
}

/** Non-redirecting variant for API routes — returns null when not a parent. */
export async function getParent(): Promise<ParentSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const membership = await prisma.familyMembership.findUnique({
    where: { userId: session.user.id },
    select: { role: true, familyId: true, user: { select: { email: true } } },
  });
  if (!membership || membership.role !== "PARENT") return null;
  return {
    userId: session.user.id,
    email: membership.user.email,
    familyId: membership.familyId,
  };
}

/** Authoritative child gate for server components / route handlers. */
export async function requireChild(locale = "en"): Promise<ChildSession> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }
  const membership = await prisma.familyMembership.findUnique({
    where: { userId: session.user.id },
    select: { role: true, familyId: true, user: { select: { email: true } } },
  });
  if (!membership || membership.role !== "CHILD") {
    redirect(`/${locale}/dashboard`);
  }
  return {
    userId: session.user.id,
    email: membership.user.email,
    familyId: membership.familyId,
  };
}

/** Non-redirecting variant for API routes — returns null when not a child. */
export async function getChild(): Promise<ChildSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const membership = await prisma.familyMembership.findUnique({
    where: { userId: session.user.id },
    select: { role: true, familyId: true, user: { select: { email: true } } },
  });
  if (!membership || membership.role !== "CHILD") return null;
  return {
    userId: session.user.id,
    email: membership.user.email,
    familyId: membership.familyId,
  };
}

/**
 * Verify that `childUserId` is really a CHILD member of `familyId` before a
 * parent action (insight generation, reward approval, …) touches that
 * child's data. This is the confidentiality boundary equivalent to
 * `getCompanyEmployee`'s `companyId` check — a parent from Family A must
 * never be able to read or mutate a child in Family B by guessing an id.
 */
export async function assertChildInFamily(familyId: string, childUserId: string): Promise<boolean> {
  const membership = await prisma.familyMembership.findFirst({
    where: { familyId, userId: childUserId, role: "CHILD" },
    select: { id: true },
  });
  return !!membership;
}
