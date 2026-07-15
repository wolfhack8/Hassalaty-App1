import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOtpCode, hashOtp, otpExpiryDate } from "@/lib/auth/otp";
import { canSendOtp, createOtpChallenge, getActiveOtpChallenge } from "@/lib/auth/rate-limit";
import { sendOtpEmail } from "@/lib/email/resend";

export async function POST(req: Request) {
  let body: { challengeId?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const locale = body.locale === "ar" ? "ar" : "en";
  const challenge = await getActiveOtpChallenge(body.challengeId ?? "");
  if (!challenge) {
    return NextResponse.json({ error: "Invalid challenge" }, { status: 400 });
  }

  if (!(await canSendOtp(challenge.identifier))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const code = generateOtpCode();
  await createOtpChallenge({
    identifier: challenge.identifier,
    resolvedEmail: challenge.resolvedEmail,
    codeHash: hashOtp(code),
    purpose: challenge.purpose,
    userId: challenge.userId ?? undefined,
    metadata: challenge.metadata ?? undefined,
    expiresAt: otpExpiryDate(),
  });

  try {
    await sendOtpEmail({
      to: challenge.resolvedEmail,
      code,
      locale,
      purpose: challenge.purpose === "REGISTER" ? "register" : "login",
    });
  } catch {
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
