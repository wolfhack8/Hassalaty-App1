"use client";

import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ConversationSummary = { id: string; title: string; updatedAt: string };

export function ConversationSidebar({
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
  className,
  hideLabel = false,
}: {
  conversations: ConversationSummary[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  className?: string;
  hideLabel?: boolean;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("assistant");

  return (
    <div className={cn("flex flex-col bg-surface/40", className)}>
      <div className="p-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-strong"
        >
          <Plus className="h-4 w-4" />
          {t("newChat")}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {!hideLabel && (
          <p className="px-2 pb-1 pt-1.5 text-xs font-medium text-subtle-foreground">
            {t("conversations")}
          </p>
        )}
        {conversations.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            {t("noConversations")}
          </p>
        ) : (
          <div className="space-y-0.5">
            <AnimatePresence initial={false}>
              {conversations.map((c) => {
                const active = c.id === currentId;
                return (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                      "group relative flex items-center rounded-xl",
                      active ? "bg-brand-soft" : "hover:bg-surface-muted",
                    )}
                  >
                    <button
                      onClick={() => onSelect(c.id)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-start"
                    >
                      <MessageSquare
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-primary-strong" : "text-subtle-foreground",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm font-medium",
                            active ? "text-primary-strong" : "text-foreground",
                          )}
                        >
                          {c.title}
                        </span>
                        <span className="block text-[0.7rem] text-subtle-foreground">
                          {formatDate(c.updatedAt, locale, { day: "numeric", month: "short" })}
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={() => onDelete(c.id)}
                      aria-label={t("deleteChat")}
                      className="me-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-subtle-foreground opacity-0 transition-colors hover:bg-negative-soft hover:text-negative focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
