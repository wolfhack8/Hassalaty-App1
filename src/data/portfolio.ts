import type { Holding, SeriesPoint } from "./types";
import { loc } from "@/lib/localized";

export const holdings: Holding[] = [
  {
    id: "h_aramco",
    name: loc("Saudi Aramco", "أرامكو السعودية"),
    symbol: "2222",
    kind: loc("Stock", "سهم"),
    market: loc("Tadawul", "تداول"),
    value: 38400,
    cost: 35000,
    units: 1200,
    dayChange: 0.82,
    color: "#16a34a",
  },
  {
    id: "h_rajhi",
    name: loc("Al Rajhi Bank", "مصرف الراجحي"),
    symbol: "1120",
    kind: loc("Stock", "سهم"),
    market: loc("Tadawul", "تداول"),
    value: 24200,
    cost: 20500,
    units: 280,
    dayChange: 1.42,
    color: "#2f6df0",
  },
  {
    id: "h_sukuk",
    name: loc("Sukuk Income Fund", "صندوق دخل الصكوك"),
    symbol: "SUKUK",
    kind: loc("Fund", "صندوق"),
    market: loc("Shariah-compliant", "متوافق مع الشريعة"),
    value: 15000,
    cost: 14600,
    units: 1500,
    dayChange: 0.18,
    color: "#14b8a6",
  },
  {
    id: "h_stc",
    name: loc("stc", "إس تي سي"),
    symbol: "7010",
    kind: loc("Stock", "سهم"),
    market: loc("Tadawul", "تداول"),
    value: 12800,
    cost: 13500,
    units: 320,
    dayChange: -0.64,
    color: "#a855f7",
  },
  {
    id: "h_apple",
    name: loc("Apple", "آبل"),
    symbol: "AAPL",
    kind: loc("Stock", "سهم"),
    market: loc("NASDAQ", "ناسداك"),
    value: 11250,
    cost: 9800,
    units: 25,
    dayChange: 1.08,
    color: "#64748b",
  },
  {
    id: "h_sabic",
    name: loc("SABIC", "سابك"),
    symbol: "2010",
    kind: loc("Stock", "سهم"),
    market: loc("Tadawul", "تداول"),
    value: 9600,
    cost: 9000,
    units: 120,
    dayChange: 0.36,
    color: "#f59e0b",
  },
  {
    id: "h_gold",
    name: loc("Gold", "الذهب"),
    symbol: "GOLD",
    kind: loc("Commodity", "سلعة"),
    market: loc("Spot", "فوري"),
    value: 8200,
    cost: 7500,
    units: 32,
    dayChange: 0.91,
    color: "#eab308",
  },
  {
    id: "h_acwa",
    name: loc("ACWA Power", "أكوا باور"),
    symbol: "2082",
    kind: loc("Stock", "سهم"),
    market: loc("Tadawul", "تداول"),
    value: 7400,
    cost: 5800,
    units: 180,
    dayChange: 2.14,
    color: "#ec4899",
  },
];

export const portfolioValue = holdings.reduce((s, h) => s + h.value, 0);
export const portfolioCost = holdings.reduce((s, h) => s + h.cost, 0);
export const portfolioGain = portfolioValue - portfolioCost;
export const portfolioGainPercent = (portfolioGain / portfolioCost) * 100;

/** 12-month portfolio value trajectory (SAR), Jul 2025 → Jun 2026. */
export const portfolioHistory: SeriesPoint[] = [
  { t: "2025-07", v: 96200 },
  { t: "2025-08", v: 99100 },
  { t: "2025-09", v: 97800 },
  { t: "2025-10", v: 103400 },
  { t: "2025-11", v: 108900 },
  { t: "2025-12", v: 112600 },
  { t: "2026-01", v: 110200 },
  { t: "2026-02", v: 115800 },
  { t: "2026-03", v: 118300 },
  { t: "2026-04", v: 121900 },
  { t: "2026-05", v: 123700 },
  { t: "2026-06", v: 126850 },
];

/** Target asset allocation for the "balanced growth" strategy. */
export const allocationTargets = [
  { key: "stocks", value: 55, color: "#52d400" },
  { key: "funds", value: 20, color: "#2f6df0" },
  { key: "sukuk", value: 15, color: "#14b8a6" },
  { key: "commodities", value: 10, color: "#eab308" },
];
