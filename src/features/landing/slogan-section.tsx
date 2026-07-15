import { Fragment } from "react";
import { getTranslations } from "next-intl/server";
import { Landmark, Wallet, CandlestickChart, Plus } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";

/**
 * The brand slogan, told as a convergence: three worlds — open banking, a
 * digital wallet, and the stock market — merging into one place (naqd).
 */
export async function SloganSection() {
  const t = await getTranslations("landing");

  const pillars = [
    {
      icon: Landmark,
      title: t("pillarBankingTitle"),
      body: t("pillarBankingBody"),
      color: "#2f6df0",
    },
    {
      icon: Wallet,
      title: t("pillarWalletTitle"),
      body: t("pillarWalletBody"),
      color: "#52d400",
    },
    {
      icon: CandlestickChart,
      title: t("pillarMarketTitle"),
      body: t("pillarMarketBody"),
      color: "#a855f7",
    },
  ];

  return (
    <section id="slogan" className="py-16 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-strong">
          {t("sloganEyebrow")}
        </span>
        <h2 className="mt-3 text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
          {t("sloganTitle")}
        </h2>
      </div>

      <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-brand-soft/40 to-card p-6 sm:p-10">
        {/* Three converging pillars */}
        <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-stretch lg:justify-center lg:gap-3">
          {pillars.map((p, i) => (
            <Fragment key={p.title}>
              <div className="flex flex-1 flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-xs">
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${p.color} 14%, transparent)`,
                    color: p.color,
                  }}
                >
                  <p.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
              {i < pillars.length - 1 && (
                <div className="flex items-center justify-center lg:px-1">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-primary shadow-xs">
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                </div>
              )}
            </Fragment>
          ))}
        </div>

        {/* Converge into naqd */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="h-8 w-px bg-gradient-to-b from-border to-primary/60" />
          <div
            dir="ltr"
            className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-card px-5 py-3 shadow-sm"
          >
            <LogoMark className="h-6 w-6 text-brand" />
            <span className="text-lg font-semibold tracking-tight text-foreground">
              naqd
            </span>
          </div>
          <span className="text-sm font-semibold text-primary-strong">
            {t("sloganOnePlace")}
          </span>
        </div>
      </div>
    </section>
  );
}
