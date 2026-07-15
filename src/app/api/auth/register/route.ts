import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import {
  generateOtpCode,
  hashOtp,
  otpExpiryDate,
} from "@/lib/auth/otp";
import { canSendOtp, createOtpChallenge } from "@/lib/auth/rate-limit";
import { sendOtpEmail } from "@/lib/email/resend";
import { isEmail, normalizeEmail, normalizePhone, splitName } from "@/lib/auth/resolve-user";
import { AccountType, OtpPurpose } from "@prisma/client";
import { loc } from "@/lib/localized";

export async function POST(req: Request) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    locale?: string;
    accountType?: string;
    companyName?: string;
    crNumber?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const locale = body.locale === "ar" ? "ar" : "en";
  const name = body.name?.trim() ?? "";
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  const phoneRaw = body.phone?.trim();
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  const isCommercial = body.accountType === "COMMERCIAL";
  const companyName = body.companyName?.trim() ?? "";
  const crNumber = body.crNumber?.trim() || null;

  if (!name || !isEmail(email) || password.length < 6) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (isCommercial && !companyName) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  if (phone) {
    const phoneTaken = await prisma.user.findUnique({ where: { phone } });
    if (phoneTaken) {
      return NextResponse.json({ error: "Phone already registered" }, { status: 409 });
    }
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      phone: phone ?? undefined,
      accountType: isCommercial ? AccountType.COMMERCIAL : AccountType.PERSONAL,
      name: splitName(name),
      firstName: { en: name.split(" ")[0] ?? name, ar: name.split(" ")[0] ?? name },
      tier: isCommercial ? loc("naqd Business", "نقد للأعمال") : loc("naqd", "نقد"),
      handle: `@${email.split("@")[0]}`,
      locale,
    },
  });

  const identifier = email;
  if (!(await canSendOtp(identifier))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const code = generateOtpCode();
  const challenge = await createOtpChallenge({
    identifier,
    resolvedEmail: email,
    codeHash: hashOtp(code),
    purpose: OtpPurpose.REGISTER,
    userId: user.id,
    metadata: isCommercial ? { company: { name: companyName, crNumber } } : undefined,
    expiresAt: otpExpiryDate(),
  });

  try {
    await sendOtpEmail({ to: email, code, locale, purpose: "register" });
  } catch {
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
  }

  return NextResponse.json({
    challengeId: challenge.id,
    maskedEmail: maskEmail(email),
  });
}

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}
