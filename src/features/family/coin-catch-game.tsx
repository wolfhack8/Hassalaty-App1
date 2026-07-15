"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Coins, Gem, Play, RotateCcw, Sparkles as SparklesIcon, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import { useChildHome } from "./child-home-provider";

/**
 * "Catch the Falling Coins" — the mini-game. Pure React state + Tailwind, no
 * canvas: coins/gems are absolutely-positioned divs whose `y` is advanced
 * every animation frame and removed on catch or on reaching the floor. The
 * client only ever reports the *raw* result (coins caught + round duration)
 * to `/api/family/game/submit` — the server computes and persists the
 * points (see `server/family/game-actions.ts`), so this component never
 * invents a points number itself.
 */

const ROUND_MS = 30_000;
const GEM_CHANCE = 0.15;
const ITEM_SIZE = 52; // px, generously large tap target for young players

type Phase = "idle" | "playing" | "ended";
type Item = { id: number; x: number; y: number; kind: "coin" | "gem" };
type Sparkle = { id: number; x: number; y: number };

const COPY = {
  en: {
    title: "Catch the Falling Coins",
    subtitle: "Tap coins before they land. Gems are worth 3!",
    start: "Start round",
    playAgain: "Play again",
    time: "Time",
    score: "Caught",
    saving: "Saving your score…",
    earned: "You earned",
    points: "points",
    capped: "You hit today's game-points limit — come back tomorrow for more!",
    error: "Couldn't save your score — your points are safe, just try again.",
    retry: "Try again",
  },
  ar: {
    title: "لعبة جمع العملات المتساقطة",
    subtitle: "اضغط على العملات قبل أن تسقط. الجواهر تساوي 3 نقاط!",
    start: "ابدأ الجولة",
    playAgain: "العب مرة أخرى",
    time: "الوقت",
    score: "الملتقط",
    saving: "جارٍ حفظ نتيجتك…",
    earned: "ربحت",
    points: "نقطة",
    capped: "وصلت للحد اليومي لنقاط اللعبة — ارجع غداً لمزيد!",
    error: "تعذّر حفظ نتيجتك — نقاطك بأمان، حاول مرة أخرى.",
    retry: "حاول مرة أخرى",
  },
} as const;

export function CoinCatchGame() {
  const { locale, points, setPoints } = useChildHome();
  const t = COPY[locale];

  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeftMs, setTimeLeftMs] = useState(ROUND_MS);
  const [score, setScore] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [capped, setCapped] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const fieldRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const nextSpawnRef = useRef(0);
  const idCounterRef = useRef(0);
  const scoreRef = useRef(0);
  const startedAtRef = useRef(0);

  const nextId = () => (idCounterRef.current += 1);

  const submitScore = useCallback(
    async (finalScore: number, durationMs: number) => {
      setSubmitting(true);
      setSubmitError(false);
      try {
        const res = await fetch("/api/family/game/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameType: "COIN_CATCH", score: finalScore, durationMs }),
        });
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as {
          pointsEarned: number;
          totalPoints: number;
          cappedByDailyLimit: boolean;
        };
        setPointsEarned(data.pointsEarned);
        setPoints(data.totalPoints);
        setCapped(data.cappedByDailyLimit);
        if (data.pointsEarned > 0) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2200);
        }
      } catch {
        setSubmitError(true);
      } finally {
        setSubmitting(false);
      }
    },
    [setPoints],
  );

  const endRound = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPhase("ended");
    setItems([]);
    const durationMs = Math.min(ROUND_MS, Date.now() - startedAtRef.current);
    void submitScore(scoreRef.current, Math.max(durationMs, 8_000));
  }, [submitScore]);

  const tick = useCallback(
    (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;

      const elapsed = Date.now() - startedAtRef.current;
      const remaining = Math.max(0, ROUND_MS - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        endRound();
        return;
      }

      const progress = elapsed / ROUND_MS; // 0 → 1, drives difficulty ramp
      const fallSpeed = 90 + progress * 90; // px/sec
      const fieldHeight = fieldRef.current?.clientHeight ?? 420;
      const fieldWidth = fieldRef.current?.clientWidth ?? 320;

      setItems((prev) => {
        const advanced = prev
          .map((item) => ({ ...item, y: item.y + (fallSpeed * dt) / 1000 }))
          .filter((item) => item.y < fieldHeight - ITEM_SIZE * 0.4);

        nextSpawnRef.current -= dt;
        if (nextSpawnRef.current <= 0) {
          const spawnEvery = 900 - progress * 400; // spawns faster as the round goes on
          nextSpawnRef.current = spawnEvery + Math.random() * 250;
          const margin = ITEM_SIZE;
          advanced.push({
            id: nextId(),
            x: margin + Math.random() * Math.max(1, fieldWidth - margin * 2),
            y: -ITEM_SIZE,
            kind: Math.random() < GEM_CHANCE ? "gem" : "coin",
          });
        }
        return advanced;
      });

      rafRef.current = requestAnimationFrame(tick);
    },
    [endRound],
  );

  const startRound = () => {
    setPhase("playing");
    setScore(0);
    scoreRef.current = 0;
    setItems([]);
    setSparkles([]);
    setPointsEarned(null);
    setSubmitError(false);
    setCapped(false);
    setTimeLeftMs(ROUND_MS);
    lastTsRef.current = null;
    nextSpawnRef.current = 300;
    startedAtRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
  };

  const catchItem = (item: Item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    const gain = item.kind === "gem" ? 3 : 1;
    scoreRef.current += gain;
    setScore(scoreRef.current);
    setSparkles((prev) => [...prev, { id: nextId(), x: item.x, y: item.y }]);
  };

  // Auto-expire each sparkle ~450ms after it's added, independent of game state.
  useEffect(() => {
    if (sparkles.length === 0) return;
    const timer = setTimeout(() => setSparkles((prev) => prev.slice(1)), 450);
    return () => clearTimeout(timer);
  }, [sparkles]);

  // Always cancel any in-flight animation frame on unmount (e.g. child
  // navigates away mid-round) so it never keeps ticking against a stale ref.
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const seconds = Math.ceil(timeLeftMs / 1000);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t.title}</h2>
          <p className="text-xs text-muted-foreground">{t.subtitle}</p>
        </div>
        {phase === "playing" && (
          <div className="flex items-center gap-3 text-sm font-semibold tnum">
            <span className="flex items-center gap-1 text-info">
              <Timer className="h-4 w-4" /> {seconds}s
            </span>
            <span className="flex items-center gap-1 text-warning">
              <Coins className="h-4 w-4" /> {score}
            </span>
          </div>
        )}
      </div>

      <div
        ref={fieldRef}
        className="relative h-[420px] w-full select-none overflow-hidden bg-gradient-to-b from-info-soft via-surface to-surface-muted"
      >
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-warning-soft text-warning">
              <Coins className="h-8 w-8" />
            </span>
            <p className="max-w-[240px] text-sm text-muted-foreground">{t.subtitle}</p>
            <Button size="lg" onClick={startRound}>
              <Play className="h-4 w-4" />
              {t.start}
            </Button>
          </div>
        )}

        {phase === "playing" &&
          items.map((item) => (
            <button
              key={item.id}
              onClick={() => catchItem(item)}
              aria-label={item.kind === "gem" ? "gem" : "coin"}
              className="absolute grid place-items-center rounded-full shadow-md transition-transform active:scale-90"
              style={{
                left: item.x - ITEM_SIZE / 2,
                top: item.y,
                width: ITEM_SIZE,
                height: ITEM_SIZE,
                background:
                  item.kind === "gem"
                    ? "linear-gradient(135deg, #a855f7, #6366f1)"
                    : "linear-gradient(135deg, #f5c451, #d9820a)",
              }}
            >
              {item.kind === "gem" ? (
                <Gem className="h-6 w-6 text-white" />
              ) : (
                <Coins className="h-6 w-6 text-white" />
              )}
            </button>
          ))}

        {phase === "playing" &&
          sparkles.map((s) => (
            <span
              key={s.id}
              className="pointer-events-none absolute animate-fade-up text-xs font-bold text-primary-strong"
              style={{ left: s.x, top: s.y }}
            >
              +1 <SparklesIcon className="inline h-3 w-3" />
            </span>
          ))}

        {phase === "ended" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/90 p-6 text-center backdrop-blur-sm">
            <p className="text-sm text-muted-foreground">{t.score}</p>
            <p className="text-4xl font-bold tnum text-foreground">{score}</p>

            {submitting && <p className="text-xs text-muted-foreground">{t.saving}</p>}

            {!submitting && pointsEarned != null && (
              <div className="rounded-2xl bg-brand-soft px-4 py-2 text-sm font-semibold text-primary-strong">
                +{pointsEarned} {t.points} · {t.earned} {pointsEarned}
              </div>
            )}
            {!submitting && capped && <p className="max-w-[220px] text-xs text-warning">{t.capped}</p>}
            {!submitting && submitError && <p className="text-xs text-negative">{t.error}</p>}

            <Button
              variant={submitError ? "outline" : "primary"}
              onClick={submitError ? () => submitScore(score, ROUND_MS) : startRound}
              disabled={submitting}
            >
              <RotateCcw className="h-4 w-4" />
              {submitError ? t.retry : t.playAgain}
            </Button>
          </div>
        )}
      </div>

      {showConfetti && <Confetti count={90} />}

      <div className="border-t border-border px-5 py-3 text-center text-xs text-muted-foreground sm:px-6">
        {locale === "ar" ? "رصيدك الحالي:" : "Your current balance:"}{" "}
        <span className="font-semibold text-foreground tnum">{points.toLocaleString("en-US")}</span>{" "}
        {locale === "ar" ? "نقطة" : "points"}
      </div>
    </Card>
  );
}
