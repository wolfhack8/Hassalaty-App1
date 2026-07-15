import type { Locale } from "@/i18n/routing";

/** A value available in every supported locale. */
export type Localized<T = string> = Record<Locale, T>;

/** Resolve a localized value for the active locale. */
export function pick<T>(value: Localized<T>, locale: Locale): T {
  return value[locale];
}

/** Build a Localized object inline. */
export function loc<T>(en: T, ar: T): Localized<T> {
  return { en, ar };
}
