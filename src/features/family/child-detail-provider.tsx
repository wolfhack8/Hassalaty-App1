"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ChildSpendingSummary } from "@/server/family/get-family-context";
import type { InsightResult } from "@/server/family/parent-insights";

export type ChildDetailContextValue = {
  childId: string;
  childName: string;
  locale: "en" | "ar";
  summary: ChildSpendingSummary;
  insights: InsightResult[];
  /** Prepend a freshly-generated report — called by ParentInsightsPanel after POST. */
  addInsight: (report: InsightResult) => void;
};

const ChildDetailContext = createContext<ChildDetailContextValue | null>(null);

/**
 * Hydrates once per child-detail page load (server-fetched props in, no
 * client refetch) and is read by every sibling widget on that page —
 * `ParentInsightsPanel` today, and future widgets (transaction list,
 * challenge card, reward history) without any of them needing `childId` /
 * `childName` / `locale` threaded through as props. Mirrors the app-wide
 * `FinanceProvider` pattern in `components/finance/finance-provider.tsx`.
 */
export function ChildDetailProvider({
  childId,
  childName,
  locale,
  summary,
  initialInsights,
  children,
}: {
  childId: string;
  childName: string;
  locale: "en" | "ar";
  summary: ChildSpendingSummary;
  initialInsights: InsightResult[];
  children: ReactNode;
}) {
  const [insights, setInsights] = useState(initialInsights);

  const addInsight = (report: InsightResult) => {
    setInsights((prev) => [report, ...prev]);
  };

  return (
    <ChildDetailContext.Provider value={{ childId, childName, locale, summary, insights, addInsight }}>
      {children}
    </ChildDetailContext.Provider>
  );
}

export function useChildDetail() {
  const ctx = useContext(ChildDetailContext);
  if (!ctx) throw new Error("useChildDetail must be used within ChildDetailProvider");
  return ctx;
}
