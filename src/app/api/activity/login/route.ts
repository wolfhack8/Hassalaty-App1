import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { logActivity } from "@/server/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Records a successful login (with the client IP) to the audit trail. Called by
 * the client right after Auth.js establishes the session, which is where the
 * originating request's IP is available under the JWT session strategy.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await logActivity({
    action: "auth.login",
    userId: session.user.id,
    email: session.user.email ?? null,
    detail: "Signed in",
    req,
  });

  return NextResponse.json({ ok: true });
}
