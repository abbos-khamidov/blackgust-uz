import { defineRouting } from "next-intl/routing";

export const locales = ["uz", "ru", "en", "zh", "ko"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "uz",
  // Uzbek lives at the root (blackgust.uz/platform), others are prefixed (/ru/platform)
  localePrefix: "as-needed",
  localeDetection: false,
});

/** Native names for the language switcher */
export const localeNames: Record<Locale, string> = {
  uz: "O‘zbekcha",
  ru: "Русский",
  en: "English",
  zh: "中文",
  ko: "한국어",
};

/** BCP-47 tags used for hreflang and Intl formatting */
export const localeTags: Record<Locale, string> = {
  uz: "uz",
  ru: "ru",
  en: "en",
  zh: "zh-Hans",
  ko: "ko",
};
