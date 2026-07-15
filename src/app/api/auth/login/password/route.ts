import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { generateOtpCode, hashOtp, otpExpiryDate } from "@/lib/auth/otp";
import { canSendOtp, createOtpChallenge } from "@/lib/auth/rate-limit";
import { sendOtpEmail } from "@/lib/email/resend";
import { isEmail, normalizeEmail } from "@/lib/auth/resolve-user";
import { OtpPurpose } from "@prisma/client";

export async function POST(req: Request) {
  let body: { email?: string; password?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const locale = body.locale === "ar" ? "ar" : "en";
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";

  if (!isEmail(email) || !password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!user.emailVerifiedAt) {
    if (!(await canSendOtp(email))) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const code = generateOtpCode();
    const challenge = await createOtpChallenge({
      identifier: email,
      resolvedEmail: email,
      codeHash: hashOtp(code),
      purpose: OtpPurpose.REGISTER,
      userId: user.id,
      expiresAt: otpExpiryDate(),
    });

    try {
      await sendOtpEmail({ to: email, code, locale, purpose: "register" });
    } catch {
      return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
    }

    return NextResponse.json({
      needsVerification: true,
      challengeId: challenge.id,
      maskedEmail: maskEmail(email),
    });
  }

  return NextResponse.json({ needsVerification: false });
}

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}
