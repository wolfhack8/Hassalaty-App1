import { prisma } from "@/lib/db";
import { loc } from "@/lib/localized";
import {
  accounts,
  balanceHistory,
  budgets,
  card,
  cashflow,
  goals,
  monthlyIncome,
  spendingByCategory,
  spendingPulse,
  user as demoUser,
} from "@/data/finance";
import { holdings, portfolioHistory, allocationTargets } from "@/data/portfolio";
import { transactions } from "@/data/transactions";
import { beneficiaries, bills, insights, notifications } from "@/data/content";

const MARKET_SEED = {
  cash: 92650.75,
  positions: {
    "2222": { units: 1200, avgCost: 24.5 },
    "1120": { units: 280, avgCost: 73.2 },
    AAPL: { units: 25, avgCost: 190.4 },
    NVDA: { units: 40, avgCost: 96.1 },
  },
  watchlist: ["2010", "TSLA", "1211"],
  orders: [],
};

export async function seedUserFinance(userId: string) {
  const existing = await prisma.financeAccount.findFirst({ where: { userId } });
  if (existing) return;

  await prisma.$transaction([
    prisma.userPreferences.create({
      data: { userId },
    }),
    prisma.financeAccount.createMany({
      data: accounts.map((a) => ({
        userId,
        extId: a.id,
        name: a.name,
        kind: a.kind,
        number: a.number,
        balance: a.balance,
        currency: a.currency,
      })),
    }),
    prisma.virtualCard.create({
      data: {
        userId,
        extId: card.id,
        name: card.name,
        holder: card.holder,
        last4: card.last4,
        expiry: card.expiry,
        network: card.network,
        kind: card.kind,
        frozen: card.frozen,
        monthlyLimit: card.monthlyLimit,
        spentThisMonth: card.spentThisMonth,
      },
    }),
    prisma.transaction.createMany({
      data: transactions.map((t) => ({
        userId,
        extId: t.id,
        merchant: t.merchant,
        note: t.note ?? undefined,
        category: t.category,
        type: t.type,
        status: t.status,
        method: t.method,
        amount: t.amount,
        date: new Date(t.date),
      })),
    }),
    prisma.holding.createMany({
      data: holdings.map((h) => ({
        userId,
        extId: h.id,
        name: h.name,
        symbol: h.symbol,
        kind: h.kind,
        market: h.market,
        value: h.value,
        cost: h.cost,
        units: h.units,
        dayChange: h.dayChange,
        color: h.color,
      })),
    }),
    prisma.goal.createMany({
      data: goals.map((g) => ({
        userId,
        extId: g.id,
        name: g.name,
        target: g.target,
        saved: g.saved,
        color: g.color,
        icon: g.icon,
      })),
    }),
    prisma.bill.createMany({
      data: bills.map((b) => ({
        userId,
        extId: b.id,
        biller: b.biller,
        category: b.category,
        amount: b.amount,
        dueDate: new Date(b.dueDate),
        status: b.status,
        autopay: b.autopay,
      })),
    }),
    prisma.beneficiary.createMany({
      data: beneficiaries.map((b) => ({
        userId,
        extId: b.id,
        name: b.name,
        bank: b.bank,
        iban: b.iban,
        favorite: b.favorite,
      })),
    }),
    prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId,
        extId: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        date: new Date(n.date),
        read: n.read,
      })),
    }),
    prisma.insight.createMany({
      data: insights.map((i) => ({
        userId,
        extId: i.id,
        kind: i.kind,
        title: i.title,
        body: i.body,
        metric: i.metric,
        metricKind: i.metricKind,
        tone: i.tone,
      })),
    }),
    prisma.balanceSnapshot.createMany({
      data: balanceHistory.map((p) => ({
        userId,
        period: p.t,
        value: p.v,
      })),
    }),
    prisma.cashflowPoint.createMany({
      data: cashflow.map((p) => ({
        userId,
        period: p.t,
        income: p.income,
        expense: p.expense,
      })),
    }),
    prisma.spendingSlice.createMany({
      data: spendingByCategory.map((s) => ({
        userId,
        category: s.category,
        amount: s.amount,
        change: s.change,
      })),
    }),
    prisma.marketPortfolio.create({
      data: {
        userId,
        cash: MARKET_SEED.cash,
        positions: MARKET_SEED.positions,
        watchlist: MARKET_SEED.watchlist,
        orders: MARKET_SEED.orders,
      },
    }),
  ]);

  // Ensure user profile fields are populated if missing
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: demoUser.name,
      firstName: demoUser.firstName,
      tier: demoUser.tier,
      handle: demoUser.handle,
    },
  });

  void budgets;
  void spendingPulse;
  void monthlyIncome;
  void portfolioHistory;
  void allocationTargets;
}

export async function createDemoUser() {
  const email = "fahad@naqd.sa";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await seedUserFinance(existing.id);
    return existing;
  }

  const { hashPassword } = await import("@/lib/auth/password");
  const passwordHash = await hashPassword("demo1234");

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      emailVerifiedAt: new Date(),
      name: demoUser.name,
      firstName: demoUser.firstName,
      phone: "+966501234567",
      handle: demoUser.handle,
      tier: demoUser.tier,
      locale: "en",
    },
  });

  await seedUserFinance(user.id);
  return user;
}
