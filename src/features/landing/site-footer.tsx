import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import Grainient from "@/components/react-bits/grainient";

/** Internal routes use the locale-aware Link; placeholder anchors use <a>. */
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const cls = "text-sm text-white/60 transition-colors hover:text-white";
  return href.startsWith("/") ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <a href={href} className={cls}>
      {children}
    </a>
  );
}

/** Giant brand wordmark, stretched to the full width and cropped at the base. */
function GiantWordmark() {
  return (
    <svg
      viewBox="0 0 1200 190"
      preserveAspectRatio="xMidYMin meet"
      className="w-full"
      aria-hidden="true"
    >
      <text
        x="600"
        y="235"
        textAnchor="middle"
        textLength="1180"
        lengthAdjust="spacingAndGlyphs"
        style={{
          fill: "#ffffff",
          fontFamily: "var(--font-app-sans), ui-sans-serif, sans-serif",
          fontWeight: 700,
          fontSize: 300,
          letterSpacing: "-0.03em",
        }}
        opacity={0.1}
      >
        naqd
      </text>
    </svg>
  );
}

export async function SiteFooter() {
  const t = await getTranslations("landing");
  const tn = await getTranslations("nav");

  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: t("colProduct"),
      links: [
        { label: tn("dashboard"), href: "/dashboard" },
        { label: tn("markets"), href: "/markets" },
        { label: tn("portfolio"), href: "/portfolio" },
        { label: tn("assistant"), href: "/assistant" },
        { label: tn("card"), href: "/card" },
      ],
    },
    {
      title: t("colCompany"),
      links: [
        { label: t("linkAbout"), href: "#" },
        { label: t("linkRoadmap"), href: "#" },
        { label: t("linkCareers"), href: "#" },
        { label: t("linkBlog"), href: "#" },
        { label: t("linkContact"), href: "#" },
      ],
    },
    {
      title: t("colLegal"),
      links: [
        { label: t("linkPrivacy"), href: "#" },
        { label: t("linkTerms"), href: "#" },
        { label: t("linkSecurity"), href: "#" },
      ],
    },
    {
      title: t("colStart"),
      links: [
        { label: t("signIn"), href: "/login" },
        { label: t("createAccount"), href: "/register" },
        { label: t("download"), href: "#" },
      ],
    },
  ];

  return (
    <footer className="relative isolate mt-20 overflow-hidden bg-[#06140a] text-white">
      {/* Animated grainient background (our greens) — fills the whole footer */}
      <div className="absolute inset-0">
        <Grainient
          className="h-full w-full"
          color1="#52d400"
          color2="#12833a"
          color3="#04160b"
          timeSpeed={0.16}
          warpSpeed={1.4}
          warpAmplitude={60}
          blendSoftness={0.18}
          contrast={1.15}
          saturation={1.05}
          grainAmount={0.12}
          zoom={1.05}
        />
      </div>
      {/* Scrims for legibility */}
      <div className="absolute inset-0 bg-[#06140a]/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#06140a]/85 via-[#06140a]/40 to-[#06140a]/70" />

      <div className="relative mx-auto w-full max-w-[1180px] px-5 pt-16 sm:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand block */}
          <div className="lg:col-span-2">
            <Logo className="[&_span]:text-white" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              {t("footerDescription")}
            </p>
            <Button asChild className="mt-5">
              <Link href="/register">
                {t("createAccount")}
                <ArrowRight className="h-4 w-4 rtl-flip" />
              </Link>
            </Button>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-semibold text-white">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <FooterLink href={l.href}>{l.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

      </div>

      {/* Giant brand wordmark — full width, cropped at the base */}
      <div dir="ltr" className="relative mt-14 select-none px-2 sm:px-4" aria-hidden="true">
        <GiantWordmark />
      </div>
    </footer>
  );
}
