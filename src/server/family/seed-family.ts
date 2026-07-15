import { prisma } from "@/lib/db";
import { loc, type Localized } from "@/lib/localized";
import { hashPassword } from "@/lib/auth/password";
import { seedUserFinance } from "@/server/finance/seed-user-finance";
import { AccountType, FamilyRole } from "@prisma/client";
import type { CategoryId } from "@/data/types";

/** A shown-once temporary password for a provisioned child login. Reuses the
 *  same generator shape as `generateTempPassword` in `seed-company.ts`. */
export function generateTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `hassalaty-${out}`;
}

function toLocalizedName(name: string, ar?: string): Localized {
  const trimmed = name.trim();
  return loc(trimmed, (ar ?? trimmed).trim());
}

async function applyProfile(userId: string, name: Localized, firstName: Localized, handle: string) {
  await prisma.user.update({ where: { id: userId }, data: { name, firstName, handle } });
}

/** Scale a freshly-seeded user's balances down to kid-sized figures. */
async function scaleToKidFinances(userId: string, factor: number) {
  await prisma.$transaction([
    prisma.financeAccount.updateMany({ where: { userId }, data: { balance: { multiply: factor } } }),
    prisma.virtualCard.updateMany({ where: { userId }, data: { spentThisMonth: { multiply: factor } } }),
    prisma.goal.updateMany({ where: { userId }, data: { target: { multiply: factor }, saved: { multiply: factor } } }),
  ]);
  // A child has no business holding a stock portfolio or paying adult bills —
  // strip what `seedUserFinance` stamps by default so their dashboard (and
  // the AI prompts grounded in their `Transaction` rows) only ever reflect
  // pocket-money-scale activity.
  await prisma.$transaction([
    prisma.holding.deleteMany({ where: { userId } }),
    prisma.bill.deleteMany({ where: { userId } }),
    prisma.beneficiary.deleteMany({ where: { userId } }),
    prisma.transaction.deleteMany({ where: { userId } }),
    prisma.spendingSlice.deleteMany({ where: { userId } }),
  ]);
}

export type KidTransactionInput = {
  category: CategoryId;
  merchant: string;
  merchantAr?: string;
  amount: number; // negative = expense, positive = income (allowance)
  daysAgo: number; // 0 = today
};

/** Insert a curated set of recent, kid-appropriate transactions (replacing
 *  the generic adult ledger stripped by `scaleToKidFinances`) plus matching
 *  `SpendingSlice` rows, so the child's dashboard, the parent's category
 *  filter, and the AI Insights generator are all grounded in the exact same
 *  numbers. */
async function seedKidTransactions(userId: string, rows: KidTransactionInput[]) {
  const now = Date.now();
  await prisma.transaction.createMany({
    data: rows.map((r, i) => ({
      userId,
      extId: `kid_tx_${userId.slice(-6)}_${i}`,
      merchant: toLocalizedName(r.merchant, r.merchantAr),
      category: r.category,
      type: r.amount >= 0 ? "income" : "expense",
      status: "completed",
      method: "wallet",
      amount: r.amount,
      date: new Date(now - r.daysAgo * 24 * 60 * 60 * 1000),
    })),
  });

  const tally = new Map<CategoryId, number>();
  for (const r of rows) {
    if (r.amount >= 0) continue;
    tally.set(r.category, (tally.get(r.category) ?? 0) + Math.abs(r.amount));
  }
  await prisma.spendingSlice.createMany({
    data: Array.from(tally.entries()).map(([category, amount]) => ({
      userId,
      category,
      amount,
      change: 0,
    })),
  });
}

export type ChildInput = {
  email: string;
  name: string;
  nameAr?: string;
  password?: string;
  points?: number;
  avatarTheme?: string;
  birthYear?: number;
  /** Kid-sized wallet scale relative to the base demo data (default 0.01 ≈ SAR 50-300). */
  factor?: number;
  transactions?: KidTransactionInput[];
};

export type ProvisionedChild = {
  userId: string;
  email: string;
  tempPassword: string | null;
};

/**
 * Create (or re-provision) a child user under a family: a real User with
 * their own kid-scaled wallet, plus a CHILD `FamilyMembership` carrying
 * points. Mirrors `provisionEmployee` in `server/company/seed-company.ts`.
 */
export async function provisionChild(familyId: string, input: ChildInput): Promise<ProvisionedChild> {
  const email = input.email.trim().toLowerCase();
  const name = toLocalizedName(input.name, input.nameAr);
  const firstName = toLocalizedName(input.name.split(" ")[0] ?? input.name);
  const handle = `@${email.split("@")[0]}`;
  const factor = input.factor ?? 0.01;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, familyMembership: { select: { id: true } } },
  });

  let userId: string;
  let tempPassword: string | null = null;

  if (existing) {
    userId = existing.id;
    if (existing.familyMembership) {
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
        tier: loc("Hassalaty", "حصالتي"),
        locale: "ar",
      },
      select: { id: true },
    });
    userId = created.id;
  }

  await seedUserFinance(userId);
  await scaleToKidFinances(userId, factor);
  await applyProfile(userId, name, firstName, handle);
  if (input.transactions?.length) {
    await seedKidTransactions(userId, input.transactions);
  }

  await prisma.familyMembership.upsert({
    where: { userId },
    create: {
      familyId,
      userId,
      role: FamilyRole.CHILD,
      points: input.points ?? 0,
      avatarTheme: input.avatarTheme ?? null,
      birthYear: input.birthYear ?? null,
    },
    update: {
      points: input.points ?? 0,
      avatarTheme: input.avatarTheme ?? null,
      birthYear: input.birthYear ?? null,
    },
  });

  return { userId, email, tempPassword };
}

export type SeedFamilyInput = {
  name: string;
  nameAr?: string;
  children?: ChildInput[];
};

/**
 * Turn an existing user into a PARENT: create the Family + PARENT membership,
 * and provision any children. Idempotent per parent. Mirrors `seedCompany`.
 */
export async function seedFamily(
  parentUserId: string,
  input: SeedFamilyInput,
): Promise<{ familyId: string; children: ProvisionedChild[] }> {
  const parent = await prisma.user.findUnique({
    where: { id: parentUserId },
    select: { id: true, name: true, firstName: true, handle: true },
  });
  if (!parent) throw new Error(`seedFamily: parent ${parentUserId} not found`);

  const hasFinance = await prisma.financeAccount.findFirst({ where: { userId: parentUserId } });
  if (!hasFinance) await seedUserFinance(parentUserId);

  const family = await prisma.family.upsert({
    where: { createdByUserId: parentUserId },
    create: { name: toLocalizedName(input.name, input.nameAr), createdByUserId: parentUserId },
    update: { name: toLocalizedName(input.name, input.nameAr) },
    select: { id: true },
  });

  await prisma.familyMembership.upsert({
    where: { userId: parentUserId },
    create: { familyId: family.id, userId: parentUserId, role: FamilyRole.PARENT },
    update: { familyId: family.id, role: FamilyRole.PARENT },
  });

  const children: ProvisionedChild[] = [];
  for (const child of input.children ?? []) {
    children.push(await provisionChild(family.id, child));
  }

  return { familyId: family.id, children };
}

/**
 * Demo family for end-to-end testing and for the public `/demo` picker —
 * *reuses* the platform's existing demo personal user (`fahad@naqd.sa`,
 * already pre-filled on the login screen and listed on `/demo`) as the
 * PARENT, rather than minting a disconnected second demo identity. Signing
 * in as that one seeded account now shows both his personal dashboard *and*
 * the new `/parent` console with two children —
 * - Yousef: a balanced spender across categories, healthy points/savings →
 *   the AI Insights generator should read this as low/medium risk.
 * - Lama: heavy sweets spending (~50%+ of her week) → deliberately built to
 *   demonstrate the exact "50% on sweets, suggest a Candy Limit challenge"
 *   scenario from the product brief.
 * Prints credentials, like `createDemoCompany`.
 */
export async function createDemoFamily() {
  const { createDemoUser } = await import("@/server/finance/seed-user-finance");
  const parent = await createDemoUser();

  const result = await seedFamily(parent.id, {
    name: "Al-Otaibi Family",
    nameAr: "عائلة العتيبي",
    children: [
      {
        email: "yousef@rkiza.sa",
        name: "Yousef Al-Otaibi",
        nameAr: "يوسف العتيبي",
        password: "demo1234",
        points: 145,
        avatarTheme: "astro",
        birthYear: 2015,
        factor: 0.012,
        transactions: [
          { category: "sweets", merchant: "Candy Corner", merchantAr: "ركن الحلويات", amount: -8, daysAgo: 1 },
          { category: "toys", merchant: "Toy Store", merchantAr: "متجر الألعاب", amount: -25, daysAgo: 2 },
          { category: "entertainment", merchant: "Arcade", merchantAr: "صالة الألعاب", amount: -15, daysAgo: 3 },
          { category: "dining", merchant: "Ice Cream Shop", merchantAr: "محل الآيسكريم", amount: -10, daysAgo: 4 },
          { category: "education", merchant: "Bookstore", merchantAr: "مكتبة", amount: -12, daysAgo: 5 },
          { category: "income", merchant: "Weekly allowance", merchantAr: "المصروف الأسبوعي", amount: 60, daysAgo: 6 },
        ],
      },
      {
        email: "lama@rkiza.sa",
        name: "Lama Al-Otaibi",
        nameAr: "لمى العتيبي",
        password: "demo1234",
        points: 40,
        avatarTheme: "unicorn",
        birthYear: 2017,
        factor: 0.008,
        transactions: [
          { category: "sweets", merchant: "Candy Corner", merchantAr: "ركن الحلويات", amount: -14, daysAgo: 1 },
          { category: "sweets", merchant: "Chocolate House", merchantAr: "بيت الشوكولاتة", amount: -12, daysAgo: 2 },
          { category: "sweets", merchant: "Bakery", merchantAr: "مخبز", amount: -9, daysAgo: 4 },
          { category: "toys", merchant: "Toy Store", merchantAr: "متجر الألعاب", amount: -10, daysAgo: 5 },
          { category: "income", merchant: "Weekly allowance", merchantAr: "المصروف الأسبوعي", amount: 50, daysAgo: 6 },
        ],
      },
    ],
  });

  return { parent, ...result };
}
