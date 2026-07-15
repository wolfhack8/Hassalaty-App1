import type { DefaultSession } from "next-auth";
import type { Role, AccountType, CompanyRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      accountType: AccountType;
      companyRole?: CompanyRole | null;
      companyId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    accountType?: AccountType;
    companyRole?: CompanyRole | null;
    companyId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    accountType?: AccountType;
    companyRole?: CompanyRole | null;
    companyId?: string | null;
  }
}
