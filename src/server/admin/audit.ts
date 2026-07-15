import { prisma } from "@/lib/db";

/** Best-effort client IP + user agent from a request's headers. */
export function getRequestMeta(req: Request): { ip: string | null; userAgent: string | null } {
  const fwd = req.headers.get("x-forwarded-for");
  const ip =
    (fwd ? fwd.split(",")[0]?.trim() : null) ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent") || null;
  return { ip, userAgent };
}

/**
 * Append an entry to the system audit trail. Never throws — logging must not
 * break the action it records.
 */
export async function logActivity(params: {
  action: string;
  userId?: string | null;
  email?: string | null;
  detail?: string | null;
  req?: Request;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const meta = params.req
    ? getRequestMeta(params.req)
    : { ip: null, userAgent: null };
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        userId: params.userId ?? null,
        email: params.email ?? null,
        detail: params.detail ?? null,
        ip: params.ip ?? meta.ip,
        userAgent: params.userAgent ?? meta.userAgent,
      },
    });
  } catch {
    /* best-effort */
  }
}
