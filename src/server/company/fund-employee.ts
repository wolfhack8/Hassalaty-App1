import { prisma } from "@/lib/db";
import { loc } from "@/lib/localized";

/**
 * Persist a real top-up into an employee's wallet: credit their current account
 * (or first available) and record an income transaction. Mirrors the personal
 * wallet top-up route. Returns the account's new balance, or null if the user
 * has no finance account.
 */
export async function fundEmployeeWallet(
  userId: string,
  amount: number,
): Promise<{ balance: number; accountNumber: string } | null> {
  const account =
    (await prisma.financeAccount.findFirst({ where: { userId, kind: "current" } })) ??
    (await prisma.financeAccount.findFirst({ where: { userId } }));
  if (!account) return null;

  const rounded = Math.round(amount * 100) / 100;
  const now = new Date();
  const extId = `tx_fund_${now.getTime()}`;

  const [, updated] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId,
        extId,
        merchant: loc("Company funding", "تمويل من الشركة"),
        note: loc("Added by company · Simulated", "أُضيفت بواسطة الشركة · محاكاة"),
        category: "income",
        type: "income",
        status: "completed",
        method: "transfer",
        amount: rounded,
        date: now,
      },
    }),
    prisma.financeAccount.update({
      where: { id: account.id },
      data: { balance: { increment: rounded } },
    }),
  ]);

  return { balance: updated.balance, accountNumber: updated.number };
}
