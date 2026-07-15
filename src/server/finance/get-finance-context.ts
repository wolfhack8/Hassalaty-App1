import { prisma } from "@/lib/db";
import type {
  Account,
  Beneficiary,
  Bill,
  Card,
  DualSeriesPoint,
  Goal,
  Holding,
  Insight,
  Notification,
  SeriesPoint,
  SpendingSlice,
  Transaction,
} from "@/data/types";
import type { Localized } from "@/lib/localized";
import { loc } from "@/lib/localized";
import type { CompanyDashboard, MembershipInfo } from "@/server/company/get-company-context";

export type FinanceUser = {
  name: Localized;
  firstName: Localized;
  email: string;
  handle: string;
  tier: Localized;
  joined: string;
  image?: string | null;
};

export type FinanceContext = {
  user: FinanceUser;
  accounts: Account[];
  totalBalance: number;
  netWorth: number;
  card: Card;
  balanceHistory: SeriesPoint[];
  spendingPulse: SeriesPoint[];
  cashflow: DualSeriesPoint[];
  spendingByCategory: SpendingSlice[];
  monthlySpend: number;
  monthlyIncome: number;
  goals: Goal[];
  budgets: Array<{ category: SpendingSlice["category"]; budget: number; spent: number }>;
  transactions: Transaction[];
  holdings: Holding[];
  portfolioValue: number;
  portfolioCost: number;
  portfolioGain: number;
  portfolioGainPercent: number;
  portfolioHistory: SeriesPoint[];
  allocationTargets: Array<{ label: Localized; value: number; color: string }>;
  notifications: Notification[];
  insights: Insight[];
  beneficiaries: Beneficiary[];
  bills: Bill[];
  marketPortfolio: {
    cash: number;
    positions: Record<string, { units: number; avgCost: number }>;
    watchlist: string[];
    orders: unknown[];
  };
  /** Present for commercial owners: treasury + per-employee snapshot. */
  company?: CompanyDashboard;
  /** Present for any company member (owner or employee): their access flags. */
  membership?: MembershipInfo;
};

function asLocalized(value: unknown, fallback: Localized): Localized {
  if (value && typeof value === "object" && "en" in value && "ar" in value) {
    return value as Localized;
  }
  return fallback;
}

export async function getFinanceContext(userId: string): Promise<FinanceContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      financeAccounts: true,
      virtualCard: true,
      transactions: { orderBy: { date: "desc" } },
      holdings: true,
      goals: true,
      bills: true,
      beneficiaries: true,
      notifications: { orderBy: { date: "desc" } },
      insights: true,
      balanceSnapshots: { orderBy: { period: "asc" } },
      cashflowPoints: { orderBy: { period: "asc" } },
      spendingSlices: true,
      marketPortfolio: true,
    },
  });

  if (!user) return null;

  const accounts: Account[] = user.financeAccounts.map((a) => ({
    id: a.extId,
    name: asLocalized(a.name, loc("Account", "حساب")),
    kind: a.kind as Account["kind"],
    number: a.number,
    balance: a.balance,
    currency: a.currency,
  }));

  const cardRow = user.virtualCard;
  const card: Card = cardRow
    ? {
        id: cardRow.extId,
        name: asLocalized(cardRow.name, loc("naqd Virtual", "نقد الرقمية")),
        holder: cardRow.holder,
        last4: cardRow.last4,
        expiry: cardRow.expiry,
        network: cardRow.network as Card["network"],
        kind: asLocalized(cardRow.kind, loc("Virtual", "رقمية")),
        frozen: cardRow.frozen,
        monthlyLimit: cardRow.monthlyLimit,
        spentThisMonth: cardRow.spentThisMonth,
      }
    : {
        id: "card_virtual",
        name: loc("naqd Virtual", "نقد الرقمية"),
        holder: "NAQD USER",
        last4: "0000",
        expiry: "01/30",
        network: "mada",
        kind: loc("Virtual", "رقمية"),
        frozen: false,
        monthlyLimit: 0,
        spentThisMonth: 0,
      };

  const transactions: Transaction[] = user.transactions.map((t) => ({
    id: t.extId,
    merchant: asLocalized(t.merchant, loc("Merchant", "تاجر")),
    note: t.note ? asLocalized(t.note, loc("", "")) : undefined,
    category: t.category as Transaction["category"],
    type: t.type as Transaction["type"],
    status: t.status as Transaction["status"],
    method: t.method as Transaction["method"],
    amount: t.amount,
    date: t.date.toISOString(),
  }));

  const holdings: Holding[] = user.holdings.map((h) => ({
    id: h.extId,
    name: asLocalized(h.name, loc("Holding", "مركز")),
    symbol: h.symbol,
    kind: asLocalized(h.kind, loc("Asset", "أصل")),
    market: asLocalized(h.market, loc("Market", "سوق")),
    value: h.value,
    cost: h.cost,
    units: h.units,
    dayChange: h.dayChange,
    color: h.color,
  }));

  const portfolioValue = holdings.reduce((s, h) => s + h.value, 0);
  const portfolioCost = holdings.reduce((s, h) => s + h.cost, 0);
  const portfolioGain = portfolioValue - portfolioCost;
  const portfolioGainPercent = portfolioCost > 0 ? (portfolioGain / portfolioCost) * 100 : 0;

  const spendingByCategory: SpendingSlice[] = user.spendingSlices.map((s) => ({
    category: s.category as SpendingSlice["category"],
    amount: s.amount,
    change: s.change,
  }));

  const monthlySpend = spendingByCategory.reduce((s, c) => s + c.amount, 0);
  const monthlyIncome =
    user.cashflowPoints.length > 0
      ? user.cashflowPoints[user.cashflowPoints.length - 1]!.income
      : 23001;

  const budgets = [
    { category: "groceries" as const, budget: 2000, spent: spendingByCategory.find((s) => s.category === "groceries")?.amount ?? 0 },
    { category: "dining" as const, budget: 600, spent: spendingByCategory.find((s) => s.category === "dining")?.amount ?? 0 },
    { category: "shopping" as const, budget: 1800, spent: spendingByCategory.find((s) => s.category === "shopping")?.amount ?? 0 },
    { category: "transport" as const, budget: 400, spent: spendingByCategory.find((s) => s.category === "transport")?.amount ?? 0 },
    { category: "entertainment" as const, budget: 300, spent: spendingByCategory.find((s) => s.category === "entertainment")?.amount ?? 0 },
    { category: "bills" as const, budget: 1000, spent: spendingByCategory.find((s) => s.category === "bills")?.amount ?? 0 },
  ];

  const mp = user.marketPortfolio;

  return {
    user: {
      name: asLocalized(user.name, loc("naqd User", "مستخدم نقد")),
      firstName: asLocalized(user.firstName, loc("User", "مستخدم")),
      email: user.email,
      handle: user.handle ?? "@user",
      tier: asLocalized(user.tier, loc("naqd", "نقد")),
      joined: user.createdAt.toISOString().slice(0, 10),
      image: user.image,
    },
    accounts,
    totalBalance: accounts.filter((a) => a.kind !== "investment").reduce((s, a) => s + a.balance, 0),
    netWorth: accounts.reduce((s, a) => s + a.balance, 0),
    card,
    balanceHistory: user.balanceSnapshots.map((b) => ({ t: b.period, v: b.value })),
    spendingPulse: Array.from({ length: 30 }, (_, i) => ({
      t: `d${i + 1}`,
      v: [120, 60, 0, 340, 210, 95, 18, 480, 75, 30, 260, 145, 0, 56, 95, 720, 41, 500, 198, 21, 0, 512, 27, 345, 999, 158, 72, 312, 286, 53][i] ?? 0,
    })),
    cashflow: user.cashflowPoints.map((c) => ({
      t: c.period,
      income: c.income,
      expense: c.expense,
    })),
    spendingByCategory,
    monthlySpend,
    monthlyIncome,
    goals: user.goals.map((g) => ({
      id: g.extId,
      name: asLocalized(g.name, loc("Goal", "هدف")),
      target: g.target,
      saved: g.saved,
      color: g.color,
      icon: g.icon,
    })),
    budgets,
    transactions,
    holdings,
    portfolioValue,
    portfolioCost,
    portfolioGain,
    portfolioGainPercent,
    portfolioHistory: user.balanceSnapshots.slice(-12).map((b) => ({ t: b.period, v: b.value * 0.58 })),
    allocationTargets: [
      { label: loc("Saudi stocks", "أسهم سعودية"), value: 45, color: "#16a34a" },
      { label: loc("US stocks", "أسهم أمريكية"), value: 25, color: "#2f6df0" },
      { label: loc("Sukuk & funds", "صكوك وصناديق"), value: 20, color: "#14b8a6" },
      { label: loc("Gold", "ذهب"), value: 10, color: "#f59e0b" },
    ],
    notifications: user.notifications.map((n) => ({
      id: n.extId,
      type: n.type as Notification["type"],
      title: asLocalized(n.title, loc("Notification", "إشعار")),
      body: asLocalized(n.body, loc("", "")),
      date: n.date.toISOString(),
      read: n.read,
    })),
    insights: user.insights.map((i) => ({
      id: i.extId,
      kind: i.kind as Insight["kind"],
      title: asLocalized(i.title, loc("Insight", "رؤية")),
      body: asLocalized(i.body, loc("", "")),
      metric: i.metric ?? undefined,
      metricKind: (i.metricKind as Insight["metricKind"]) ?? undefined,
      tone: i.tone as Insight["tone"],
    })),
    beneficiaries: user.beneficiaries.map((b) => ({
      id: b.extId,
      name: asLocalized(b.name, loc("Beneficiary", "مستفيد")),
      bank: asLocalized(b.bank, loc("Bank", "بنك")),
      iban: b.iban,
      favorite: b.favorite,
    })),
    bills: user.bills.map((b) => ({
      id: b.extId,
      biller: asLocalized(b.biller, loc("Biller", "جهة")),
      category: b.category as Bill["category"],
      amount: b.amount,
      dueDate: b.dueDate.toISOString().slice(0, 10),
      status: b.status as Bill["status"],
      autopay: b.autopay,
    })),
    marketPortfolio: {
      cash: mp?.cash ?? 92650.75,
      positions: (mp?.positions as Record<string, { units: number; avgCost: number }>) ?? {},
      watchlist: (mp?.watchlist as string[]) ?? [],
      orders: (mp?.orders as unknown[]) ?? [],
    },
  };
}
