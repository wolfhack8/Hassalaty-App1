import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export type AdminSession = { userId: string; email: string };

/**
 * Authoritative admin gate for server components / route handlers. Verifies the
 * role against the DB (not just the session token), so a stale token cannot
 * grant — or a revoked admin cannot keep — access. Redirects otherwise.
 */
export async function requireAdmin(locale = "en"): Promise<AdminSession> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true },
  });
  if (!user || user.role !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }
  return { userId: session.user.id, email: user.email };
}

/** Non-redirecting variant for API routes — returns null when not an admin. */
export async function getAdmin(): Promise<AdminSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true },
  });
  if (!user || user.role !== "ADMIN") return null;
  return { userId: session.user.id, email: user.email };
}
