"use client";

import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type WalletCard = { id: string; face: ReactNode };

/**
 * Apple Wallet-style stack. Cards overlap so only the header of each upper card
 * peeks out; the front card is fully visible. Tapping a peeking card brings it
 * to the front; tapping the front card spreads the whole stack. Overlap is
 * expressed as a percentage of width so it scales cleanly across breakpoints.
 */
export function WalletStack({ cards }: { cards: WalletCard[] }) {
  const [order, setOrder] = useState(cards.map((c) => c.id));
  const [expanded, setExpanded] = useState(false);

  const ordered = order
    .map((id) => cards.find((c) => c.id === id))
    .filter(Boolean) as WalletCard[];

  function onCardClick(id: string, isFront: boolean) {
    if (isFront) {
      setExpanded((e) => !e);
    } else {
      setOrder((prev) => [...prev.filter((x) => x !== id), id]);
      setExpanded(false);
    }
  }

  return (
    <div className="select-none">
      <div className="flex flex-col">
        {ordered.map((card, i) => {
          const isFront = i === ordered.length - 1;
          return (
            <motion.button
              type="button"
              layout
              key={card.id}
              onClick={() => onCardClick(card.id, isFront)}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              style={{
                zIndex: i,
                marginTop: i === 0 ? 0 : expanded ? "4%" : "-48%",
              }}
              whileHover={!isFront ? { y: -6 } : undefined}
              className={cn(
                "relative block w-full rounded-[1.4rem] text-start outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
              aria-label={card.id}
            >
              {card.face}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
