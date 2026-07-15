import type {
  Account,
  Card,
  DualSeriesPoint,
  Goal,
  SeriesPoint,
  SpendingSlice,
} from "./types";
import { loc } from "@/lib/localized";
import { portfolioValue } from "./portfolio";

export const user = {
  name: loc("Fahad Al-Otaibi", "فهد العتيبي"),
  firstName: loc("Fahad", "فهد"),
  email: "fahad@naqd.sa",
  handle: "@fahad",
  tier: loc("naqd Black", "نقد بلاك"),
  joined: "2024-03-01",
};

export const accounts: Account[] = [
  {
    id: "acc_current",
    name: loc("Current account", "الحساب الجاري"),
    kind: "current",
    number: "SA•• 4471",
    balance: 28450.75,
    currency: "SAR",
  },
  {
    id: "acc_savings",
    name: loc("Savings vault", "وعاء الادخار"),
    kind: "savings",
    number: "SA•• 9920",
    balance: 64200,
    currency: "SAR",
  },
  {
    id: "acc_invest",
    name: loc("Investment account", "حساب الاستثمار"),
    kind: "investment",
    number: "SA•• 1188",
    balance: portfolioValue,
    currency: "SAR",
  },
];

export const totalBalance = accounts
  .filter((a) => a.kind !== "investment")
  .reduce((s, a) => s + a.balance, 0);

export const netWorth = accounts.reduce((s, a) => s + a.balance, 0);

export const card: Card = {
  id: "card_virtual",
  name: loc("naqd Virtual", "نقد الرقمية"),
  holder: "FAHAD AL-OTAIBI",
  last4: "4471",
  expiry: "08/29",
  network: "mada",
  kind: loc("Virtual · Multi-currency", "رقمية · متعددة العملات"),
  frozen: false,
  monthlyLimit: 15000,
  spentThisMonth: 6842.55,
};

/** Net-worth trajectory over the last 12 months (SAR). */
export const balanceHistory: SeriesPoint[] = [
  { t: "2025-07", v: 168400 },
  { t: "2025-08", v: 173900 },
  { t: "2025-09", v: 176200 },
  { t: "2025-10", v: 184500 },
  { t: "2025-11", v: 191800 },
  { t: "2025-12", v: 198300 },
  { t: "2026-01", v: 196900 },
  { t: "2026-02", v: 204600 },
  { t: "2026-03", v: 208900 },
  { t: "2026-04", v: 213400 },
  { t: "2026-05", v: 216700 },
  { t: "2026-06", v: 219300 },
];

/** Daily spending pulse for the current month (last 30 days, SAR/day). */
export const spendingPulse: SeriesPoint[] = Array.from({ length: 30 }, (_, i) => {
  const base = [
    120, 60, 0, 340, 210, 95, 18, 480, 75, 30, 260, 145, 0, 56, 95, 720, 41,
    500, 198, 21, 0, 512, 27, 345, 999, 158, 72, 312, 286, 53,
  ];
  return { t: `d${i + 1}`, v: base[i] ?? 0 };
});

/** Monthly income vs expense (SAR), Jan → Jun 2026. */
export const cashflow: DualSeriesPoint[] = [
  { t: "2026-01", income: 22500, expense: 14200 },
  { t: "2026-02", income: 23100, expense: 12800 },
  { t: "2026-03", income: 22500, expense: 16400 },
  { t: "2026-04", income: 24800, expense: 13100 },
  { t: "2026-05", income: 22500, expense: 15600 },
  { t: "2026-06", income: 23001, expense: 11427 },
];

/** Spend by category for the current month, with change vs last month. */
export const spendingByCategory: SpendingSlice[] = [
  { category: "shopping", amount: 2248.4, change: 12.4 },
  { category: "groceries", amount: 1485.15, change: -6.2 },
  { category: "bills", amount: 875, change: 2.1 },
  { category: "travel", amount: 680, change: 0 },
  { category: "dining", amount: 451.25, change: -18.0 },
  { category: "transport", amount: 269.5, change: 9.4 },
  { category: "health", amount: 260, change: 0 },
  { category: "education", amount: 210, change: 0 },
  { category: "entertainment", amount: 151, change: -22.0 },
];

export const monthlySpend = spendingByCategory.reduce((s, c) => s + c.amount, 0);
export const monthlyIncome = 23001;

export const goals: Goal[] = [
  {
    id: "goal_emergency",
    name: loc("Emergency fund", "صندوق الطوارئ"),
    target: 60000,
    saved: 48500,
    color: "#52d400",
    icon: "ShieldCheck",
  },
  {
    id: "goal_car",
    name: loc("New car", "سيارة جديدة"),
    target: 120000,
    saved: 42000,
    color: "#2f6df0",
    icon: "Car",
  },
  {
    id: "goal_hajj",
    name: loc("Umrah & travel", "العمرة والسفر"),
    target: 15000,
    saved: 11200,
    color: "#14b8a6",
    icon: "Plane",
  },
  {
    id: "goal_home",
    name: loc("Home down payment", "دفعة المنزل"),
    target: 300000,
    saved: 96000,
    color: "#a855f7",
    icon: "Home",
  },
];

/** Monthly budgets vs actual spend, current month. */
export const budgets = [
  { category: "groceries" as const, budget: 2000, spent: 1485.15 },
  { category: "dining" as const, budget: 600, spent: 451.25 },
  { category: "shopping" as const, budget: 1800, spent: 2248.4 },
  { category: "transport" as const, budget: 400, spent: 269.5 },
  { category: "entertainment" as const, budget: 300, spent: 151 },
  { category: "bills" as const, budget: 1000, spent: 875 },
];
