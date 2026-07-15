"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeftRight,
  Bell,
  BellOff,
  CheckCheck,
  Info,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Card, CardBody } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { useFinance } from "@/components/finance/finance-provider";
import type { Notification } from "@/data/types";
import { pick } from "@/lib/localized";
import { DEMO_NOW, formatRelativeTime, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Filter = "all" | "unread";
type DateGroup = "today" | "yesterday" | "week" | "older";

const typeIcon: Record<Notification["type"], LucideIcon> = {
  transaction: ArrowLeftRight,
  security: ShieldCheck,
  investment: TrendingUp,
  insight: Lightbulb,
  system: Info,
};

const typeStyle: Record<
  Notification["type"],
  { icon: string; chip: string; unread: string }
> = {
  transaction: {
    icon: "bg-info-soft text-info",
    chip: "bg-info-soft text-info",
    unread: "border-s-info",
  },
  security: {
    icon: "bg-negative-soft text-negative",
    chip: "bg-negative-soft text-negative",
    unread: "border-s-negative",
  },
  investment: {
    icon: "bg-brand-soft text-primary-strong",
    chip: "bg-brand-soft text-primary-strong",
    unread: "border-s-primary",
  },
  insight: {
    icon: "bg-warning-soft text-warning",
    chip: "bg-warning-soft text-warning",
    unread: "border-s-warning",
  },
  system: {
    icon: "bg-accent text-muted-foreground",
    chip: "bg-accent text-muted-foreground",
    unread: "border-s-border-strong",
  },
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateGroupKey(date: string, now = DEMO_NOW): DateGroup {
  const diffDays = Math.floor(
    (startOfDay(now).getTime() - startOfDay(new Date(date)).getTime()) / 86_400_000,
  );
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return "week";
  return "older";
}

const groupOrder: DateGroup[] = ["today", "yesterday", "week", "older"];

export function NotificationsScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("notifications");
  const { notifications } = useFinance();
  const [items, setItems] = useState(notifications);
  const [filter, setFilter] = useState<Filter>("all");

  const unread = items.filter((n) => !n.read).length;
  const visible = filter === "unread" ? items.filter((n) => !n.read) : items;

  const grouped = useMemo(() => {
    const map = new Map<DateGroup, Notification[]>();
    for (const group of groupOrder) map.set(group, []);

    for (const item of visible) {
      const key = dateGroupKey(item.date);
      map.get(key)!.push(item);
    }

    return groupOrder
      .map((key) => ({ key, items: map.get(key)! }))
      .filter((section) => section.items.length > 0);
  }, [visible]);

  const typeLabel = (type: Notification["type"]) =>
    t(
      `type${type.charAt(0).toUpperCase()}${type.slice(1)}` as
        | "typeTransaction"
        | "typeSecurity"
        | "typeInvestment"
        | "typeInsight"
        | "typeSystem",
    );

  const groupLabel = (key: DateGroup) => {
    if (key === "today") return t("groupToday");
    if (key === "yesterday") return t("groupYesterday");
    if (key === "week") return t("groupThisWeek");
    return t("groupEarlier");
  };

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <Card
        className={cn(
          "relative overflow-hidden border",
          unread > 0
            ? "border-primary/25 bg-gradient-to-br from-brand-soft/70 via-card to-card"
            : "border-border bg-gradient-to-br from-surface-muted/80 via-card to-card",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute -end-10 -top-10 h-36 w-36 rounded-full blur-3xl",
            unread > 0 ? "bg-brand/20" : "bg-border/40",
          )}
        />
        <CardBody className="relative flex items-center gap-4">
          <span
            className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
              unread > 0 ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground",
            )}
          >
            {unread > 0 ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold tracking-tight text-foreground">
              {unread > 0 ? t("unread", { count: unread }) : t("caughtUpTitle")}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {unread > 0 ? t("unreadHint") : t("caughtUpBody")}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: t("filterAll") },
            { value: "unread", label: t("filterUnread") },
          ]}
        />
        <button
          type="button"
          onClick={markAllRead}
          disabled={unread === 0}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckCheck className="h-4 w-4" />
          {t("markAllRead")}
        </button>
      </div>

      {/* Empty */}
      {visible.length === 0 && (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-muted-foreground">
              <BellOff className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("empty")}</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">{t("emptyHint")}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Grouped feed */}
      {grouped.map(({ key, items: sectionItems }) => (
        <section key={key} className="space-y-3">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">
            {groupLabel(key)}
          </h2>
          <div className="space-y-2">
            {sectionItems.map((n) => {
              const Icon = typeIcon[n.type];
              const style = typeStyle[n.type];

              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markRead(n.id)}
                  className={cn(
                    "group flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-start shadow-xs transition-all hover:border-border-strong hover:shadow-sm",
                    !n.read && "border-s-[3px] bg-surface",
                    !n.read && style.unread,
                  )}
                >
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                      style.icon,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                          style.chip,
                        )}
                      >
                        {typeLabel(n.type)}
                      </span>
                      <span className="text-xs text-subtle-foreground">
                        {formatTime(n.date, locale)}
                        <span className="mx-1.5 text-border-strong">·</span>
                        {formatRelativeTime(n.date, locale)}
                      </span>
                    </div>

                    <p
                      className={cn(
                        "mt-2 text-sm leading-snug text-foreground",
                        !n.read ? "font-semibold" : "font-medium",
                      )}
                    >
                      {pick(n.title, locale)}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {pick(n.body, locale)}
                    </p>
                  </div>

                  {!n.read && (
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary ring-4 ring-brand-soft" />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
