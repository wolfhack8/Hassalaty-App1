"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ChallengeResult } from "@/server/family/weekly-challenge";

export type ChildHomeContextValue = {
  locale: "en" | "ar";
  firstName: string;
  familyName: string;
  points: number;
  activeChallenge: ChallengeResult | null;
  /** Bump the shared points balance — called after a game round or a reward
   *  redemption, so every widget on the page (points badge, game screen,
   *  reward store) reflects the new balance without a full page reload. */
  setPoints: (points: number) => void;
  setActiveChallenge: (challenge: ChallengeResult | null) => void;
};

const ChildHomeContext = createContext<ChildHomeContextValue | null>(null);

/**
 * Hydrated once in `app/[locale]/child/layout.tsx` from server-fetched data,
 * then read (and updated) by every child-area screen — the mini-game, the
 * reward store, the assistant widget, the points badge in the shell header —
 * without any of them needing points/challenge threaded through as props.
 * Mirrors `FinanceProvider` / `ChildDetailProvider`.
 */
export function ChildHomeProvider({
  locale,
  firstName,
  familyName,
  initialPoints,
  initialChallenge,
  children,
}: {
  locale: "en" | "ar";
  firstName: string;
  familyName: string;
  initialPoints: number;
  initialChallenge: ChallengeResult | null;
  children: ReactNode;
}) {
  const [points, setPoints] = useState(initialPoints);
  const [activeChallenge, setActiveChallenge] = useState(initialChallenge);

  return (
    <ChildHomeContext.Provider
      value={{ locale, firstName, familyName, points, activeChallenge, setPoints, setActiveChallenge }}
    >
      {children}
    </ChildHomeContext.Provider>
  );
}

export function useChildHome() {
  const ctx = useContext(ChildHomeContext);
  if (!ctx) throw new Error("useChildHome must be used within ChildHomeProvider");
  return ctx;
}
