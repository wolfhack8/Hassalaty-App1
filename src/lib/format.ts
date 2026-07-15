import type { Locale } from "@/i18n/routing";

/**
 * Locale-aware formatting. Everything monetary, numeric, and temporal in the
 * app flows through here so that switching language instantly reformats digits,
 * currency, percentages, and dates — no hardcoded formats anywhere.
 *
 * Arabic uses native Arabic-Indic digits (numberingSystem: "arab"); English
 * uses Latin. Dates use the Gregorian calendar in both locales (with localized
 * month names) to match how Saudi banking statements are presented, while a
 * dedicated Hijri helper is available for cultural touches.
 */

export const CURRENCY = "SAR";

/** BCP-47 tags tuned for finance UI. */
const intlLocale: Record<Locale, string> = {
  en: "en-US",
  ar: "ar-SA",
};

const numberingSystem: Record<Locale, string> = {
  en: "latn",
  ar: "arab",
};

export function formatNumber(
  value: number,
  locale: Locale,
  options: Intl.NumberFormatOptions = {},
) {
  return new Intl.NumberFormat(intlLocale[locale], {
    numberingSystem: numberingSystem[locale],
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

export function formatCurrency(
  value: number,
  locale: Locale,
  options: { compact?: boolean; decimals?: number; currency?: string } = {},
) {
  const { compact = false, decimals, currency = CURRENCY } = options;
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "currency",
    currency,
    numberingSystem: numberingSystem[locale],
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: decimals ?? (compact ? 0 : 2),
    maximumFractionDigits: decimals ?? (compact ? 1 : 2),
  }).format(value);
}

/** Compact money for tight spaces: SAR 12.5K / ١٢٫٥ ألف ر.س. */
export function formatCurrencyCompact(value: number, locale: Locale) {
  return formatCurrency(value, locale, { compact: true });
}

export function formatPercent(
  value: number,
  locale: Locale,
  options: { signed?: boolean; decimals?: number } = {},
) {
  const { signed = false, decimals = 2 } = options;
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "percent",
    numberingSystem: numberingSystem[locale],
    signDisplay: signed ? "exceptZero" : "auto",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/** A signed delta with explicit + / − for gains and losses. */
export function formatSignedCurrency(value: number, locale: Locale) {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "currency",
    currency: CURRENCY,
    numberingSystem: numberingSystem[locale],
    signDisplay: "exceptZero",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(
  date: Date | string | number,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
) {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    calendar: "gregory",
    numberingSystem: numberingSystem[locale],
    ...options,
  }).format(new Date(date));
}

/** Hijri (Umm al-Qura) date — used for cultural detail in insights. */
export function formatHijri(date: Date | string | number, locale: Locale) {
  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA-u-ca-islamic-umalqura" : "en-US-u-ca-islamic-umalqura",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      numberingSystem: numberingSystem[locale],
    },
  ).format(new Date(date));
}

export function formatTime(date: Date | string | number, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale[locale], {
    hour: "numeric",
    minute: "2-digit",
    numberingSystem: numberingSystem[locale],
  }).format(new Date(date));
}

/** Relative time ("3 days ago" / "قبل ٣ أيام") anchored to a fixed demo "now". */
export function formatRelativeTime(date: Date | string | number, locale: Locale, now = DEMO_NOW) {
  const rtf = new Intl.RelativeTimeFormat(intlLocale[locale], {
    numeric: "auto",
    numberingSystem: numberingSystem[locale],
  } as Intl.RelativeTimeFormatOptions);
  const diffMs = new Date(date).getTime() - new Date(now).getTime();
  const sec = Math.round(diffMs / 1000);
  const abs = Math.abs(sec);
  if (abs < 60) return rtf.format(sec, "second");
  if (abs < 3600) return rtf.format(Math.round(sec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(sec / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(sec / 86400), "day");
  if (abs < 31536000) return rtf.format(Math.round(sec / 2592000), "month");
  return rtf.format(Math.round(sec / 31536000), "year");
}

/** Stable "today" for the demo so relative dates never drift in screenshots. */
export const DEMO_NOW = new Date("2026-06-30T12:00:00+03:00");
