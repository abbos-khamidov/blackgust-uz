import { currencyByLocale, prices, type Currency } from "@/config/site";
import { localeTags, type Locale } from "@/i18n/routing";

/**
 * Uzbek and Kazakh ICU data is missing in some browsers (Android WebView, headless builds), which would make
 * server and client output differ and break hydration. Both use Russian-style grouping ("1 126,4"), so they
 * format through "ru" — present in every ICU build — and Uzbek gets Latin unit words.
 */
export const numberTag = (locale: Locale) => (locale === "uz" || locale === "kk" ? "ru" : localeTags[locale]);
const UZ_UNITS: [RegExp, string][] = [[/млрд/g, "mlrd"], [/млн/g, "mln"], [/тыс\./g, "ming"]];

export function money(locale: Locale, amount: number, opts: Intl.NumberFormatOptions = {}): string {
  const currency: Currency = currencyByLocale[locale] ?? "USD";
  const out = new Intl.NumberFormat(numberTag(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    ...opts,
  }).format(amount);
  return locale === "uz" ? UZ_UNITS.reduce((s, [re, w]) => s.replace(re, w), out) : out;
}

export function moneyCompact(locale: Locale, amount: number): string {
  return money(locale, amount, { notation: "compact", minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/** Variables available inside every message string as {name}. */
export function priceVars(locale: Locale): Record<string, string> {
  const p = prices[currencyByLocale[locale] ?? "USD"];
  return Object.fromEntries(Object.entries(p).map(([k, v]) => [k, money(locale, v)]));
}

export function fill(str: string, vars: Record<string, string | number>): string {
  return str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}
