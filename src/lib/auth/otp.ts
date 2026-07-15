import { createHash, randomInt, timingSafeEqual } from "crypto";

function pepper(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

export function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(`${code}:${pepper()}`).digest("hex");
}

export function verifyOtp(code: string, codeHash: string): boolean {
  const candidate = hashOtp(code);
  try {
    return timingSafeEqual(Buffer.from(candidate), Buffer.from(codeHash));
  } catch {
    return false;
  }
}

export function otpExpiryDate(): Date {
  const minutes = Number(process.env.OTP_EXPIRY_MINUTES ?? 10);
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function maxOtpAttempts(): number {
  return Number(process.env.OTP_MAX_ATTEMPTS ?? 5);
}
