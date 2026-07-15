import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateOtpCode,
  hashOtp,
  otpExpiryDate,
} from "@/lib/auth/otp";
import { canSendOtp, createOtpChallenge } from "@/lib/auth/rate-limit";
import { sendOtpEmail } from "@/lib/email/resend";
import { isEmail, normalizeEmail, normalizePhone } from "@/lib/auth/resolve-user";
import { OtpPurpose } from "@prisma/client";

export async function POST(req: Request) {
  let body: { identifier?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const locale = body.locale === "ar" ? "ar" : "en";
  const raw = body.identifier?.trim() ?? "";
  if (!raw) {
    return NextResponse.json({ message: "If an account exists, we sent a code to your email." });
  }

  let user = null as Awaited<ReturnType<typeof prisma.user.findUnique>> | null;
  let identifier = raw;

  if (isEmail(raw)) {
    identifier = normalizeEmail(raw);
    user = await prisma.user.findUnique({ where: { email: identifier } });
  } else {
    const phone = normalizePhone(raw);
    if (phone) {
      identifier = phone;
      user = await prisma.user.findUnique({ where: { phone } });
    }
  }

  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ message: "If an account exists, we sent a code to your email." });
  }

  if (!(await canSendOtp(identifier))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const code = generateOtpCode();
  const challenge = await createOtpChallenge({
    identifier,
    resolvedEmail: user.email,
    codeHash: hashOtp(code),
    purpose: OtpPurpose.LOGIN,
    userId: user.id,
    expiresAt: otpExpiryDate(),
  });

  try {
    await sendOtpEmail({ to: user.email, code, locale, purpose: "login" });
  } catch {
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
  }

  return NextResponse.json({
    message: "If an account exists, we sent a code to your email.",
    challengeId: challenge.id,
    maskedEmail: maskEmail(user.email),
  });
}

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}
