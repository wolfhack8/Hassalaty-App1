import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export type CompanyOwnerSession = {
  userId: string;
  email: string;
  companyId: string;
};

/**
 * Authoritative company-owner gate for server components / route handlers.
 * Verifies OWNER membership against the DB (not the session token), so a stale
 * token cannot grant — nor a demoted owner keep — access. Redirects otherwise.
 */
export async function requireCompanyOwner(locale = "en"): Promise<CompanyOwnerSession> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }
  const membership = await prisma.companyMembership.findUnique({
    where: { userId: session.user.id },
    select: { role: true, companyId: true, user: { select: { email: true } } },
  });
  if (!membership || membership.role !== "OWNER") {
    redirect(`/${locale}/dashboard`);
  }
  return {
    userId: session.user.id,
    email: membership.user.email,
    companyId: membership.companyId,
  };
}

/** Non-redirecting variant for API routes — returns null when not a company owner. */
export async function getCompanyOwner(): Promise<CompanyOwnerSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const membership = await prisma.companyMembership.findUnique({
    where: { userId: session.user.id },
    select: { role: true, companyId: true, user: { select: { email: true } } },
  });
  if (!membership || membership.role !== "OWNER") return null;
  return {
    userId: session.user.id,
    email: membership.user.email,
    companyId: membership.companyId,
  };
}
