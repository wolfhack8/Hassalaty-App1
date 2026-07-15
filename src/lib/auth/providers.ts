import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { maxOtpAttempts, verifyOtp } from "@/lib/auth/otp";
import { getActiveOtpChallenge } from "@/lib/auth/rate-limit";
import { isEmail, normalizeEmail } from "@/lib/auth/resolve-user";
import { seedUserFinance } from "@/server/finance/seed-user-finance";
import { OtpPurpose } from "@prisma/client";

const passwordProvider = Credentials({
  id: "password",
  name: "Password",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    const email = normalizeEmail(String(credentials?.email ?? ""));
    const password = String(credentials?.password ?? "");

    if (!isEmail(email) || !password) return null;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { companyMembership: true },
    });
    if (!user?.passwordHash || !user.emailVerifiedAt) return null;

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return null;

    return sessionUser(user);
  },
});

const otpProvider = Credentials({
  id: "otp",
  name: "OTP",
  credentials: {
    challengeId: { label: "Challenge", type: "text" },
    code: { label: "Code", type: "text" },
  },
  async authorize(credentials) {
    const challengeId = String(credentials?.challengeId ?? "");
    const code = String(credentials?.code ?? "").trim();

    if (!challengeId || code.length !== 6) return null;

    const challenge = await getActiveOtpChallenge(challengeId);
    if (!challenge || challenge.attempts >= maxOtpAttempts()) return null;

    if (!verifyOtp(code, challenge.codeHash)) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      return null;
    }

    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    let userId = challenge.userId;

    if (challenge.purpose === OtpPurpose.REGISTER) {
      if (!userId) return null;
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerifiedAt: new Date() },
      });
      const meta = challenge.metadata as { company?: { name?: string; crNumber?: string | null } } | null;
      if (meta?.company?.name) {
        // Commercial registration: seed treasury + create the Company & OWNER
        // membership. Dynamic import keeps the seeder (and bcrypt) out of any
        // edge bundle that statically imports this auth config.
        const { seedCompany } = await import("@/server/company/seed-company");
        await seedCompany(userId, {
          name: meta.company.name,
          crNumber: meta.company.crNumber ?? undefined,
        });
      } else {
        await seedUserFinance(userId);
      }
    } else if (challenge.purpose === OtpPurpose.LOGIN) {
      if (!userId) {
        const user = await prisma.user.findUnique({ where: { email: challenge.resolvedEmail } });
        userId = user?.id ?? null;
      }
    }

    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { companyMembership: true },
    });
    if (!user) return null;

    return sessionUser(user);
  },
});

type UserWithMembership = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  accountType: "PERSONAL" | "COMMERCIAL";
  name: unknown;
  image: string | null;
  companyMembership: { role: "OWNER" | "EMPLOYEE"; companyId: string } | null;
};

/** Shape a Prisma user (with membership) into the Auth.js `User` returned by authorize. */
function sessionUser(user: UserWithMembership) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    accountType: user.accountType,
    companyRole: user.companyMembership?.role ?? null,
    companyId: user.companyMembership?.companyId ?? null,
    name:
      typeof user.name === "object" && user.name && "en" in user.name
        ? String((user.name as { en: string }).en)
        : user.email,
    image: user.image,
  };
}

/** All Auth.js providers — Google, Apple, password, and OTP in one place. */
export function authProviders(): NextAuthConfig["providers"] {
  const providers: NextAuthConfig["providers"] = [passwordProvider, otpProvider];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.unshift(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    );
  }

  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
    providers.unshift(
      Apple({
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: process.env.APPLE_CLIENT_SECRET,
      }),
    );
  }

  return providers;
}
