"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LayoutDashboard, Users, Building2, ArrowLeft, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/company", key: "overview", icon: LayoutDashboard },
  { href: "/company/employees", key: "employees", icon: Users },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useTranslations("company");
  return (
    <nav className="space-y-0.5">
      {NAV.map((item) => {
        const active =
          item.href === "/company"
            ? pathname === "/company"
            : pathname === item.href || pathname.startsWith(item.href + "/");
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

export function CompanyShell({
  companyName,
  ownerEmail,
  children,
}: {
  companyName: string;
  ownerEmail: string;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const t = useTranslations("company");

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-border bg-surface/40 p-4 lg:flex">
        <Brand companyName={companyName} />
        <div className="mt-6 flex-1">
          <NavList />
        </div>
        <BackToApp label={t("backToApp")} />
      </aside>

      {/* Sidebar — mobile drawer */}
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
                <Brand companyName={companyName} />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-accent"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-6 flex-1">
                <NavList onNavigate={() => setDrawerOpen(false)} />
              </div>
              <BackToApp label={t("backToApp")} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
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
            <p className="truncate text-sm font-semibold text-foreground">{t("console")}</p>
          </div>
          <span className="hidden truncate text-xs text-muted-foreground sm:block">{ownerEmail}</span>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          <div className="mx-auto w-full max-w-[1100px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

function Brand({ companyName }: { companyName: string }) {
  const t = useTranslations("company");
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Building2 className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{companyName}</p>
        <p className="text-[0.7rem] text-subtle-foreground">{t("brandSub")}</p>
      </div>
    </div>
  );
}

function BackToApp({ label }: { label: string }) {
  return (
    <Link
      href="/dashboard"
      className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface/60 hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4 rtl-flip" />
      {label}
    </Link>
  );
}
