"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Snowflake,
  Eye,
  EyeOff,
  Copy,
  Check,
  Globe,
  Wifi,
  Banknote,
  ShoppingCart,
} from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CardVisual, RewardsPass } from "@/components/finance/card-visual";
import { ApplePayButton } from "@/components/finance/apple-pay-button";
import { WalletStack } from "./wallet-stack";
import { useFinance } from "@/components/finance/finance-provider";
import { pick } from "@/lib/localized";
import { formatNumber, formatPercent } from "@/lib/format";
import { Money } from "@/components/ui/money";

export function CardScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("card");
  const { card } = useFinance();
  const [frozen, setFrozen] = useState(card.frozen);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [controls, setControls] = useState({
    online: true,
    contactless: true,
    international: true,
    atm: false,
  });

  const spentPct = (card.spentThisMonth / card.monthlyLimit) * 100;
  const remaining = card.monthlyLimit - card.spentThisMonth;

  function copyNumber() {
    navigator.clipboard?.writeText(`4471 8820 1043 ${card.last4}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const controlItems = [
    { key: "online" as const, icon: ShoppingCart, label: t("onlinePayments") },
    { key: "contactless" as const, icon: Wifi, label: t("contactless") },
    { key: "international" as const, icon: Globe, label: t("internationalUse") },
    { key: "atm" as const, icon: Banknote, label: t("atmWithdrawals") },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Card + primary actions */}
      <div className="space-y-5">
        <div className="relative mx-auto w-full max-w-sm">
          <WalletStack
            cards={[
              {
                id: "savings",
                face: (
                  <CardVisual
                    holder={card.holder}
                    last4="9920"
                    expiry={card.expiry}
                    network="mada"
                    label={t("savingsCard")}
                    variant="teal"
                  />
                ),
              },
              {
                id: "rewards",
                face: (
                  <RewardsPass
                    title={t("rewards")}
                    points={formatNumber(18450, locale)}
                    pointsLabel={t("points")}
                  />
                ),
              },
              {
                id: "virtual",
                face: (
                  <div className="relative">
                    <CardVisual
                      holder={card.holder}
                      last4={card.last4}
                      expiry={card.expiry}
                      network={card.network}
                      label={pick(card.kind, locale)}
                      frozen={frozen}
                      showNumber={showDetails}
                    />
                    {frozen && (
                      <div className="absolute inset-0 grid place-items-center rounded-[1.4rem] bg-foreground/20 backdrop-blur-[2px]">
                        <span className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-lg">
                          <Snowflake className="h-4 w-4 text-info" />
                          {t("frozen")}
                        </span>
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
          <p className="mt-3 text-center text-xs text-subtle-foreground">
            {t("tapHint")}
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
          <ApplePayButton label={t("addToApplePay")} className="w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDetails((s) => !s)}
              className="w-full"
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDetails ? t("hideDetails") : t("showDetails")}
            </Button>
            <Button
              variant={frozen ? "primary" : "outline"}
              onClick={() => setFrozen((f) => !f)}
              className="w-full"
            >
              <Snowflake className="h-4 w-4" />
              {frozen ? t("unfreeze") : t("freeze")}
            </Button>
          </div>
        </div>
      </div>

      {/* Details + controls */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings")}</CardTitle>
            <Badge tone={frozen ? "info" : "positive"}>
              {frozen ? t("frozen") : t("active")}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Number row */}
            <div className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">{t("cardNumber")}</p>
                <p className="font-mono text-sm text-foreground tnum" dir="ltr">
                  {showDetails ? `4471 8820 1043 ${card.last4}` : `•••• •••• •••• ${card.last4}`}
                </p>
              </div>
              <button
                onClick={copyNumber}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-card hover:text-foreground"
                aria-label={t("copyNumber")}
              >
                {copied ? <Check className="h-4 w-4 text-positive" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* Limit */}
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{t("monthlyLimit")}</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Money value={card.spentThisMonth} locale={locale} decimals={0} /> /{" "}
                  <Money value={card.monthlyLimit} locale={locale} decimals={0} />
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${spentPct}%` }}
                />
              </div>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Money value={remaining} locale={locale} decimals={0} /> {t("remaining")} · {formatPercent(spentPct, locale, { decimals: 0 })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("controls")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {controlItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-foreground">
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">
                  {item.label}
                </span>
                <Switch
                  checked={controls[item.key]}
                  onCheckedChange={(v) =>
                    setControls((c) => ({ ...c, [item.key]: v }))
                  }
                  label={item.label}
                  disabled={frozen}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
