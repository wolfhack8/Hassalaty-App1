import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/** Current Auth.js session (single source of truth for all sign-in methods). */
export async function getSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
