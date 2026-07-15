import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { seedUserFinance } from "@/server/finance/seed-user-finance";
import { authProviders } from "@/lib/auth/providers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: authProviders(),
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.id) return true;

      const hasFinance = await prisma.financeAccount.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!hasFinance) {
        await seedUserFinance(user.id);
      }

      if (user.email) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date() },
        });
      }

      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.sub = user.id;
        // Persist role/account context into the token so no per-request DB call
        // is needed in middleware (which runs on the edge). Sourced from the
        // provider's returned user / the Prisma adapter user.
        const u = user as {
          role?: "USER" | "ADMIN";
          accountType?: "PERSONAL" | "COMMERCIAL";
          companyRole?: "OWNER" | "EMPLOYEE" | null;
          companyId?: string | null;
        };
        if (u.role) token.role = u.role;
        if (u.accountType) token.accountType = u.accountType;
        token.companyRole = u.companyRole ?? null;
        token.companyId = u.companyId ?? null;
      }

      // A freshly-registered commercial owner gets their company on first update.
      if (trigger === "update" && token.sub) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { accountType: true, companyMembership: { select: { role: true, companyId: true } } },
        });
        if (fresh) {
          token.accountType = fresh.accountType;
          token.companyRole = fresh.companyMembership?.role ?? null;
          token.companyId = fresh.companyMembership?.companyId ?? null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = ((token.role as "USER" | "ADMIN" | undefined) ?? "USER");
        session.user.accountType = ((token.accountType as "PERSONAL" | "COMMERCIAL" | undefined) ?? "PERSONAL");
        session.user.companyRole = (token.companyRole as "OWNER" | "EMPLOYEE" | null | undefined) ?? null;
        session.user.companyId = (token.companyId as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  trustHost: true,
});
