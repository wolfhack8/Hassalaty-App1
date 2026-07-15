"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import {
  Sun,
  Moon,
  Fingerprint,
  ShieldCheck,
  EyeOff,
  Bell,
  Mail,
  User,
  Landmark,
  FileText,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { useRouter, usePathname } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { Card, CardBody, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/segmented";
import { useFinance } from "@/components/finance/finance-provider";
import { pick } from "@/lib/localized";
import { locales, localeLabels } from "@/i18n/routing";
import { formatDate } from "@/lib/format";

function SettingRow({
  icon,
  title,
  hint,
  control,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export function SettingsScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const { user } = useFinance();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [prefs, setPrefs] = useState({
    biometric: true,
    twoFactor: true,
    hideBalances: false,
    push: true,
    email: true,
  });

  useEffect(() => setMounted(true), []);

  function switchLocale(next: Locale) {
    if (next === locale) return;
    // @ts-expect-error -- untyped pathname passthrough
    router.replace({ pathname, params }, { locale: next });
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Profile */}
      <Card className="lg:col-span-2">
        <CardBody className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar name={pick(user.name, locale)} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-foreground">
                {pick(user.name, locale)}
              </p>
              <Badge tone="brand">{pick(user.tier, locale)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-0.5 text-xs text-subtle-foreground">
              {t("memberSince", {
                date: formatDate(user.joined, locale, { month: "long", year: "numeric" }),
              })}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>{t("preferences")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <div className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{t("language")}</p>
              <p className="text-xs text-muted-foreground">{t("languageHint")}</p>
            </div>
            <Segmented
              value={locale}
              onChange={(v) => switchLocale(v as Locale)}
              options={locales.map((l) => ({ value: l, label: localeLabels[l].native }))}
            />
          </div>
          <div className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{t("appearance")}</p>
              <p className="text-xs text-muted-foreground">{t("appearanceHint")}</p>
            </div>
            {mounted && (
              <Segmented
                value={resolvedTheme === "dark" ? "dark" : "light"}
                onChange={(v) => setTheme(v)}
                options={[
                  { value: "light", label: t("themeLight") },
                  { value: "dark", label: t("themeDark") },
                ]}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>{t("security")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <SettingRow
            icon={<Fingerprint className="h-[1.15rem] w-[1.15rem]" />}
            title={t("biometric")}
            hint={t("biometricHint")}
            control={
              <Switch
                checked={prefs.biometric}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, biometric: v }))}
                label={t("biometric")}
              />
            }
          />
          <SettingRow
            icon={<ShieldCheck className="h-[1.15rem] w-[1.15rem]" />}
            title={t("twoFactor")}
            hint={t("twoFactorHint")}
            control={
              <Switch
                checked={prefs.twoFactor}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, twoFactor: v }))}
                label={t("twoFactor")}
              />
            }
          />
          <SettingRow
            icon={<EyeOff className="h-[1.15rem] w-[1.15rem]" />}
            title={t("hideBalances")}
            hint={t("hideBalancesHint")}
            control={
              <Switch
                checked={prefs.hideBalances}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, hideBalances: v }))}
                label={t("hideBalances")}
              />
            }
          />
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>{t("notifications")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <SettingRow
            icon={<Bell className="h-[1.15rem] w-[1.15rem]" />}
            title={t("pushNotifications")}
            hint={t("pushHint")}
            control={
              <Switch
                checked={prefs.push}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, push: v }))}
                label={t("pushNotifications")}
              />
            }
          />
          <SettingRow
            icon={<Mail className="h-[1.15rem] w-[1.15rem]" />}
            title={t("emailReports")}
            hint={t("emailHint")}
            control={
              <Switch
                checked={prefs.email}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, email: v }))}
                label={t("emailReports")}
              />
            }
          />
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>{t("account")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {[
            { icon: User, label: t("personalDetails") },
            { icon: Landmark, label: t("linkedBanks") },
            { icon: FileText, label: t("statements") },
          ].map((row) => (
            <button
              key={row.label}
              className="flex w-full items-center gap-3 py-3 text-start transition-colors hover:opacity-80"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-foreground">
                <row.icon className="h-[1.15rem] w-[1.15rem]" />
              </span>
              <span className="flex-1 text-sm font-medium text-foreground">
                {row.label}
              </span>
              <ChevronLeft className="h-4 w-4 rotate-180 text-subtle-foreground rtl:rotate-0" />
            </button>
          ))}
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 py-3 text-negative transition-colors hover:opacity-80 disabled:opacity-60"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-negative-soft">
              <LogOut className="h-[1.15rem] w-[1.15rem]" />
            </span>
            <span className="flex-1 text-start text-sm font-medium">{t("signOut")}</span>
          </button>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-subtle-foreground lg:col-span-2">
        {t("version", { version: "1.0.0" })} · {tc("powered")}
      </p>
    </div>
  );
}
