import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  CreditCard,
  Send,
  PieChart,
  ChartLine,
  CandlestickChart,
  Lightbulb,
  Sparkles,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  /** URL slug under /[locale]/(app)/. */
  href: string;
  /** Key inside the `nav` translation namespace. */
  key: string;
  icon: LucideIcon;
  /** Optional badge translation key (e.g. unread count handled separately). */
  badge?: "ai" | "soon";
};

export type NavGroup = {
  /** Key inside the `navGroups` translation namespace. */
  key: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    key: "money",
    items: [
      { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
      { href: "/wallet", key: "wallet", icon: Wallet },
      { href: "/transactions", key: "transactions", icon: ArrowLeftRight },
      { href: "/payments", key: "payments", icon: Send },
      { href: "/card", key: "card", icon: CreditCard },
    ],
  },
  {
    key: "grow",
    items: [
      { href: "/portfolio", key: "portfolio", icon: PieChart },
      { href: "/markets", key: "markets", icon: CandlestickChart },
      { href: "/analytics", key: "analytics", icon: ChartLine },
      { href: "/insights", key: "insights", icon: Lightbulb },
    ],
  },
  {
    key: "intelligence",
    items: [
      { href: "/assistant", key: "assistant", icon: Sparkles, badge: "ai" },
    ],
  },
  {
    key: "account",
    items: [
      { href: "/notifications", key: "notifications", icon: Bell },
      { href: "/settings", key: "settings", icon: Settings },
    ],
  },
];

/** Flat list of every navigable item, in order. */
export const navItems: NavItem[] = navGroups.flatMap((g) => g.items);
