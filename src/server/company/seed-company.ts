import { prisma } from "@/lib/db";
import { loc, type Localized } from "@/lib/localized";
import { hashPassword } from "@/lib/auth/password";
import { seedUserFinance } from "@/server/finance/seed-user-finance";
import { AccountType, CompanyRole } from "@prisma/client";

/** A shown-once temporary password for a provisioned employee login. */
export function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `naqd-${out}`;
}

/** Localized display name from a raw string (Arabic falls back to the same). */
function toLocalizedName(name: string, ar?: string): Localized {
  const trimmed = name.trim();
  return loc(trimmed, (ar ?? trimmed).trim());
}

/**
 * Overlay a real display profile on top of the seeded demo finance data.
 * `seedUserFinance` unconditionally stamps the demo user's name/handle, so we
 * restore the intended identity afterwards.
 */
async function applyProfile(
  userId: string,
  name: Localized,
  firstName: Localized,
  handle: string,
) {
  await prisma.user.update({
    where: { id: userId },
    data: { name, firstName, handle },
  });
}

/**
 * Scale a freshly-seeded user's balances/spend by a factor so each employee
 * shows distinct figures (the CEO view and assistant read these real rows).
 */
async function scaleFinances(userId: string, factor: number) {
  if (factor === 1) return;
  await prisma.$transaction([
    prisma.financeAccount.updateMany({
      where: { userId },
      data: { balance: { multiply: factor } },
    }),
    prisma.spendingSlice.updateMany({
      where: { userId },
      data: { amount: { multiply: factor } },
    }),
    prisma.virtualCard.updateMany({
      where: { userId },
      data: { spentThisMonth: { multiply: factor } },
    }),
  ]);
}

export type EmployeeInput = {
  email: string;
  name: string;
  nameAr?: string;
  title?: string;
  titleAr?: string;
  password?: string;
  canTopup?: boolean;
  canSpend?: boolean;
  spendLimit?: number | null;
  /** Wallet/spend scale relative to the base demo data (default 0.4). */
  factor?: number;
};

export type ProvisionedEmployee = {
  userId: string;
  email: string;
  tempPassword: string | null;
};

/**
 * Create (or re-provision) an employee user under a company: a real User with
 * their own seeded wallet + demo spend, plus an EMPLOYEE membership carrying the
 * access flags. Reused by the demo seeder and the owner "Add employee" route.
 */
export async function provisionEmployee(
  companyId: string,
  input: EmployeeInput,
): Promise<ProvisionedEmployee> {
  const email = input.email.trim().toLowerCase();
  const name = toLocalizedName(input.name, input.nameAr);
  const firstName = toLocalizedName(input.name.split(" ")[0] ?? input.name, input.titleAr);
  const handle = `@${email.split("@")[0]}`;
  const factor = input.factor ?? 0.4;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, companyMembership: { select: { id: true } } },
  });

  let userId: string;
  let tempPassword: string | null = null;

  if (existing) {
    userId = existing.id;
    // Already a member somewhere — do not silently move them.
    if (existing.companyMembership) {
      return { userId, email, tempPassword: null };
    }
  } else {
    tempPassword = input.password ?? generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const created = await prisma.user.create({
      data: {
        email,
        passwordHash,
        emailVerifiedAt: new Date(),
        accountType: AccountType.PERSONAL,
        name,
        firstName,
        handle,
        tier: loc("naqd", "نقد"),
        locale: "en",
      },
      select: { id: true },
    });
    userId = created.id;
  }

  await seedUserFinance(userId);
  await scaleFinances(userId, factor);
  await applyProfile(userId, name, firstName, handle);

  await prisma.companyMembership.upsert({
    where: { userId },
    create: {
      companyId,
      userId,
      role: CompanyRole.EMPLOYEE,
      title: input.title ? toLocalizedName(input.title, input.titleAr) : undefined,
      canTopup: input.canTopup ?? false,
      canSpend: input.canSpend ?? true,
      spendLimit: input.spendLimit ?? null,
    },
    update: {
      title: input.title ? toLocalizedName(input.title, input.titleAr) : undefined,
      canTopup: input.canTopup ?? false,
      canSpend: input.canSpend ?? true,
      spendLimit: input.spendLimit ?? null,
    },
  });

  return { userId, email, tempPassword };
}

export type SeedCompanyInput = {
  name: string;
  nameAr?: string;
  crNumber?: string;
  currency?: string;
  employees?: EmployeeInput[];
};

/**
 * Turn an existing user into a commercial owner: seed their treasury, create the
 * Company + OWNER membership, and provision any employees. Idempotent per owner.
 */
export async function seedCompany(
  ownerUserId: string,
  input: SeedCompanyInput,
): Promise<{ companyId: string; employees: ProvisionedEmployee[] }> {
  const owner = await prisma.user.findUnique({
    where: { id: ownerUserId },
    select: { id: true, name: true, firstName: true, handle: true },
  });
  if (!owner) throw new Error(`seedCompany: owner ${ownerUserId} not found`);

  // Treasury = the owner's own full finance data.
  await seedUserFinance(ownerUserId);
  await prisma.user.update({
    where: { id: ownerUserId },
    data: { accountType: AccountType.COMMERCIAL },
  });
  // Restore the owner's registered identity (seedUserFinance stamps the demo name).
  if (owner.name && owner.firstName && owner.handle) {
    await applyProfile(
      ownerUserId,
      owner.name as Localized,
      owner.firstName as Localized,
      owner.handle,
    );
  }

  const company = await prisma.company.upsert({
    where: { ownerUserId },
    create: {
      name: toLocalizedName(input.name, input.nameAr),
      crNumber: input.crNumber ?? null,
      currency: input.currency ?? "SAR",
      ownerUserId,
    },
    update: {
      name: toLocalizedName(input.name, input.nameAr),
      crNumber: input.crNumber ?? null,
      currency: input.currency ?? "SAR",
    },
    select: { id: true },
  });

  await prisma.companyMembership.upsert({
    where: { userId: ownerUserId },
    create: {
      companyId: company.id,
      userId: ownerUserId,
      role: CompanyRole.OWNER,
      canTopup: true,
      canSpend: true,
    },
    update: { companyId: company.id, role: CompanyRole.OWNER, canTopup: true, canSpend: true },
  });

  const employees: ProvisionedEmployee[] = [];
  for (const emp of input.employees ?? []) {
    employees.push(await provisionEmployee(company.id, emp));
  }

  return { companyId: company.id, employees };
}

/**
 * Demo commercial account for end-to-end testing: an owner (CEO) plus two
 * employees with distinct wallets, spend and access. Prints credentials.
 */
export async function createDemoCompany() {
  const ownerEmail = "ceo@rkiza.sa";
  const ownerPassword = "demo1234";

  let owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) {
    const passwordHash = await hashPassword(ownerPassword);
    owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        passwordHash,
        emailVerifiedAt: new Date(),
        accountType: AccountType.COMMERCIAL,
        name: loc("Khalid Al-Rajhi", "خالد الراجحي"),
        firstName: loc("Khalid", "خالد"),
        phone: "+966555000111",
        handle: "@khalid",
        tier: loc("naqd Business", "نقد للأعمال"),
        locale: "en",
      },
    });
  }

  const result = await seedCompany(owner.id, {
    name: "Rkiza Technologies",
    nameAr: "ركيزة للتقنية",
    crNumber: "1010567890",
    employees: [
      {
        email: "sara@rkiza.sa",
        name: "Sara Al-Qahtani",
        nameAr: "سارة القحطاني",
        title: "Marketing Lead",
        titleAr: "قائدة التسويق",
        password: "demo1234",
        canTopup: false,
        canSpend: true,
        spendLimit: 5000,
        factor: 0.3,
      },
      {
        email: "omar@rkiza.sa",
        name: "Omar Al-Harbi",
        nameAr: "عمر الحربي",
        title: "Operations Manager",
        titleAr: "مدير العمليات",
        password: "demo1234",
        canTopup: true,
        canSpend: true,
        spendLimit: 12000,
        factor: 0.55,
      },
    ],
  });

  return { owner, ...result };
}
