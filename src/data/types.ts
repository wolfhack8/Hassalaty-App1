import type { Localized } from "@/lib/localized";

export type CategoryId =
  | "income"
  | "investing"
  | "groceries"
  | "dining"
  | "shopping"
  | "transport"
  | "bills"
  | "entertainment"
  | "health"
  | "transfers"
  | "travel"
  | "education"
  | "sweets"
  | "toys";

export type Category = {
  id: CategoryId;
  name: Localized;
  /** CSS color (hex) used in charts and chips. */
  color: string;
  /** lucide-react icon name. */
  icon: string;
};

export type TransactionType = "income" | "expense" | "transfer";
export type TransactionStatus = "completed" | "pending" | "scheduled";
export type PaymentMethod = "card" | "applepay" | "transfer" | "wallet";

export type Transaction = {
  id: string;
  merchant: Localized;
  /** Short note / channel, e.g. "Apple Pay · Virtual card". */
  note?: Localized;
  category: CategoryId;
  type: TransactionType;
  status: TransactionStatus;
  method: PaymentMethod;
  /** Signed amount in SAR. Positive = money in, negative = money out. */
  amount: number;
  /** ISO timestamp. */
  date: string;
};

export type Account = {
  id: string;
  name: Localized;
  kind: "current" | "savings" | "investment";
  /** Masked identifier, e.g. IBAN tail. */
  number: string;
  balance: number;
  currency: string;
};

export type Card = {
  id: string;
  name: Localized;
  holder: string;
  /** Last 4 digits. */
  last4: string;
  expiry: string;
  network: "mada" | "visa" | "mastercard";
  kind: Localized;
  frozen: boolean;
  monthlyLimit: number;
  spentThisMonth: number;
};

export type Holding = {
  id: string;
  name: Localized;
  symbol: string;
  kind: Localized;
  market: Localized;
  /** Current market value of the position, SAR. */
  value: number;
  /** Total cost basis, SAR. */
  cost: number;
  units: number;
  /** Day change %. */
  dayChange: number;
  color: string;
};

export type SeriesPoint = { t: string; v: number };
export type DualSeriesPoint = { t: string; income: number; expense: number };

export type SpendingSlice = {
  category: CategoryId;
  amount: number;
  /** Change vs previous period, %. */
  change: number;
};

export type Notification = {
  id: string;
  type: "transaction" | "security" | "investment" | "insight" | "system";
  title: Localized;
  body: Localized;
  date: string;
  read: boolean;
};

export type Insight = {
  id: string;
  kind: "saving" | "spending" | "investment" | "goal" | "alert";
  title: Localized;
  body: Localized;
  /** Optional headline value already formatted-agnostic (raw number). */
  metric?: number;
  metricKind?: "currency" | "percent";
  tone: "positive" | "neutral" | "warning";
};

export type InvestmentProduct = {
  id: string;
  name: Localized;
  category: Localized;
  /** Expected / historical annual return %. */
  expectedReturn: number;
  risk: "low" | "medium" | "high";
  minInvestment: number;
  /** Shariah-compliant flag. */
  shariah: boolean;
  description: Localized;
  color: string;
};

export type Beneficiary = {
  id: string;
  name: Localized;
  bank: Localized;
  /** Masked IBAN tail. */
  iban: string;
  favorite: boolean;
};

export type Bill = {
  id: string;
  biller: Localized;
  category: CategoryId;
  amount: number;
  dueDate: string;
  status: "due" | "scheduled" | "paid";
  autopay: boolean;
};

export type Goal = {
  id: string;
  name: Localized;
  target: number;
  saved: number;
  color: string;
  icon: string;
};
