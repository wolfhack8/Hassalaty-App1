import type { Category, CategoryId } from "./types";
import { loc } from "@/lib/localized";

export const categories: Record<CategoryId, Category> = {
  income: { id: "income", name: loc("Income", "الدخل"), color: "#52d400", icon: "ArrowDownLeft" },
  investing: { id: "investing", name: loc("Investing", "الاستثمار"), color: "#2f6df0", icon: "TrendingUp" },
  groceries: { id: "groceries", name: loc("Groceries", "البقالة"), color: "#16a34a", icon: "ShoppingCart" },
  dining: { id: "dining", name: loc("Dining & Coffee", "المطاعم والقهوة"), color: "#d9820a", icon: "Coffee" },
  shopping: { id: "shopping", name: loc("Shopping", "التسوق"), color: "#a855f7", icon: "ShoppingBag" },
  transport: { id: "transport", name: loc("Transport", "النقل"), color: "#0ea5e9", icon: "Car" },
  bills: { id: "bills", name: loc("Bills & Utilities", "الفواتير والخدمات"), color: "#64748b", icon: "ReceiptText" },
  entertainment: { id: "entertainment", name: loc("Entertainment", "الترفيه"), color: "#ec4899", icon: "Clapperboard" },
  health: { id: "health", name: loc("Health", "الصحة"), color: "#ef4444", icon: "HeartPulse" },
  transfers: { id: "transfers", name: loc("Transfers", "التحويلات"), color: "#14b8a6", icon: "ArrowLeftRight" },
  travel: { id: "travel", name: loc("Travel", "السفر"), color: "#f59e0b", icon: "Plane" },
  education: { id: "education", name: loc("Education", "التعليم"), color: "#6366f1", icon: "GraduationCap" },
  sweets: { id: "sweets", name: loc("Sweets & Snacks", "الحلويات والوجبات الخفيفة"), color: "#f472b6", icon: "Candy" },
  toys: { id: "toys", name: loc("Toys & Games", "الألعاب"), color: "#22c55e", icon: "Gamepad2" },
};

export const categoryList = Object.values(categories);
