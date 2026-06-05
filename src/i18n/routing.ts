export const locales = ["en", "zh"] as const;
export const defaultLocale = "en";
export const localeCookieName = "NEXT_LOCALE";

export type AppLocale = (typeof locales)[number];

export function isAppLocale(value: string | undefined): value is AppLocale {
  return locales.includes(value as AppLocale);
}
