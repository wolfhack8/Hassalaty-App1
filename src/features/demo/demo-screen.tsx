"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { User, Building2, UserCog, Sparkles, Loader2, ArrowRight, KeyRound, type LucideIcon } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { DEMO_PASSWORD } from "@/config/demo";
import { pick, type Localized } from "@/lib/localized";
import { markWelcomeToast } from "@/lib/auth/welcome-toast";
import { cn } from "@/lib/utils";

export type DemoUser = {
  email: string;
  name: Localized;
  firstName: Localized;
  kind: "personal" | "owner" | "employee" | "child";
  companyName: Localized | null;
};

const KIND_META: Record<DemoUser["kind"], { icon: LucideIcon; accent: string; badge: string; desc: string; destination: string }> = {
  personal: { icon: User, accent: "var(--brand)", badge: "badgePersonal", desc: "descPersonal", destination: "dashboard" },
  owner: { icon: Building2, accent: "var(--primary)", badge: "badgeOwner", desc: "descOwner", destination: "dashboard" },
  employee: { icon: UserCog, accent: "var(--info)", badge: "badgeEmployee", desc: "descEmployee", destination: "dashboard" },
  child: { icon: Sparkles, accent: "var(--warning)", badge: "badgeChild", desc: "descChild", destination: "child" },
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "N";
}

export function DemoScreen({ users }: { users: DemoUser[] }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("demo");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function signInAs(email: string, destination: string) {
    if (pending) return;
    setError("");
    setPending(email);
    try {
      const res = await signIn("password", { email, password: DEMO_PASSWORD, redirect: false });
      if (res?.error) throw new Error(res.error);
      void fetch("/api/activity/login", { method: "POST", keepalive: true }).catch(() => {});
      markWelcomeToast();
      window.location.assign(`/${locale}/${destination}`);
    } catch {
      setError(t("error"));
      setPending(null);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="flex items-center justify-between p-5 pt-[calc(1.25rem_+_env(safe-area-inset-top))] sm:p-6">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <LocaleSwitcher compact />
          <ThemeSwitcher />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-16 sm:px-6">
        <div className="mt-6 text-center sm:mt-10">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t("title")}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {users.map((u) => {
            const meta = KIND_META[u.kind];
            const Icon = meta.icon;
            const busy = pending === u.email;
            const badge =
              u.kind === "personal" || !u.companyName
                ? t(meta.badge)
                : `${t(meta.badge)} · ${pick(u.companyName, locale)}`;
            return (
              <div
                key={u.email}
                className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-base font-semibold"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${meta.accent} 16%, transparent)`,
                      color: meta.accent,
                    }}
                  >
                    {initials(pick(u.name, locale))}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{pick(u.name, locale)}</p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">{u.email}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${meta.accent} 14%, transparent)`,
                      color: meta.accent,
                    }}
                  >
                    <Icon className="h-3 w-3" />
                    {badge}
                  </span>
                </div>

                <p className="mt-3 flex-1 text-sm text-muted-foreground">{t(meta.desc)}</p>

                <button
                  onClick={() => signInAs(u.email, meta.destination)}
                  disabled={!!pending}
                  className={cn(
                    "mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60",
                  )}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {t("signIn")}
                      <ArrowRight className="h-4 w-4 rtl-flip" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {error && <p className="mt-4 text-center text-sm text-negative">{error}</p>}

        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5 text-primary" />
            {t("sharedPassword")}
            <span className="font-mono font-semibold text-foreground" dir="ltr">{DEMO_PASSWORD}</span>
          </p>
          <Link href="/login" className="text-sm font-medium text-primary-strong hover:underline">
            {t("backToLogin")}
          </Link>
        </div>
      </main>
    </div>
  );
}
