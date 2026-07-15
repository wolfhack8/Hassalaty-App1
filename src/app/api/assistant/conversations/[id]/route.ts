import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Fetch a single conversation (with its messages) owned by the user. */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convo = await prisma.conversation.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      title: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true },
      },
    },
  });

  if (!convo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(convo);
}

/** Delete a conversation (and its messages via cascade) owned by the user. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.conversation.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
