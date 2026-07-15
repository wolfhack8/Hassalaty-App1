"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LayoutDashboard, ArrowLeft, Menu, X, Users, Gamepad2, Sparkles, Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type NavEntry = { href: string; key: string; icon: typeof LayoutDashboard };

const PARENT_NAV: NavEntry[] = [
  { href: "/parent", key: "overview", icon: Users },
  { href: "/parent/rewards", key: "rewards", icon: Gift },
];

const CHILD_NAV: NavEntry[] = [
  { href: "/child", key: "home", icon: LayoutDashboard },
  { href: "/child/game", key: "game", icon: Gamepad2 },
  { href: "/child/rewards", key: "rewards", icon: Gift },
];

function NavList({ items, namespace, onNavigate }: { items: NavEntry[]; namespace: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useTranslations(namespace);
  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-surface text-foreground shadow-xs ring-1 ring-border"
                : "text-muted-foreground hover:bg-surface/60 hover:text-foreground",
            )}
          >
            <Icon className={cn("h-[1.15rem] w-[1.15rem] shrink-0", active && "text-primary")} />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Shared shell for both family-module areas — `variant="parent"` renders the
 * monitoring console, `variant="child"` renders the gamified kid dashboard.
 * Structurally identical to `CompanyShell`; only the brand mark, nav items,
 * and translation namespace change.
 */
export function FamilyShell({
  variant,
  title,
  subtitle,
  children,
}: {
  variant: "parent" | "child";
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const namespace = variant === "parent" ? "family" : "familyChild";
  const t = useTranslations(namespace);
  const navItems = variant === "parent" ? PARENT_NAV : CHILD_NAV;
  const accent = variant === "parent" ? "bg-primary text-primary-foreground" : "bg-brand text-primary-foreground";
  const Icon = variant === "parent" ? Users : Sparkles;

  const brand = (
    <div className="flex items-center gap-2.5 px-1">
      <span className={cn("grid h-9 w-9 place-items-center rounded-xl", accent)}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="text-[0.7rem] text-subtle-foreground">{subtitle ?? t("brandSub")}</p>
      </div>
    </div>
  );

  const backLink = (
    <Link
      href="/dashboard"
      className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface/60 hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4 rtl-flip" />
      {t("backToApp")}
    </Link>
  );

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-e border-border bg-surface/40 p-4 lg:flex">
        {brand}
        <div className="mt-6 flex-1">
          <NavList items={navItems} namespace={namespace} />
        </div>
        {backLink}
      </aside>

      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 start-0 flex w-[16rem] flex-col border-e border-border bg-card p-4 pt-[calc(1rem+env(safe-area-inset-top))] shadow-xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <div className="flex items-center justify-between">
                {brand}
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-accent"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-6 flex-1">
                <NavList items={navItems} namespace={namespace} onNavigate={() => setDrawerOpen(false)} />
              </div>
              {backLink}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex items-center gap-3 border-b border-border px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-xl text-foreground hover:bg-accent lg:hidden"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          <div className="mx-auto w-full max-w-[1100px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
