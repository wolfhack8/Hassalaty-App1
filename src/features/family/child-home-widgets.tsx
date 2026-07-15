"use client";

import { PointsBadge } from "./points-badge";
import { ChallengeCard } from "./challenge-card";
import { useChildHome } from "./child-home-provider";

const COPY = {
  en: { hi: "Hi", subtitle: "Here's what's happening with your money." },
  ar: { hi: "هلا", subtitle: "هذا ملخص أموالك." },
} as const;

/** Greeting + live points badge — reads `firstName`/`points` from
 *  `ChildHomeContext` (hydrated once in `child/layout.tsx`) so the page
 *  itself can stay a plain server component. */
export function ChildHomeGreeting() {
  const { locale, firstName } = useChildHome();
  const t = COPY[locale];
  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {t.hi} {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>
      <PointsBadge size="lg" />
    </div>
  );
}

/** The child's own active challenge, read live from context. */
export function ChildActiveChallenge() {
  const { locale, activeChallenge } = useChildHome();
  return <ChallengeCard challenge={activeChallenge} locale={locale} />;
}
