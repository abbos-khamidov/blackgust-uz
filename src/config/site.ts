/**
 * Single source of truth for contacts, prices and partner links.
 * Edit here — every page and every language picks it up.
 */
import type { Locale } from "@/i18n/routing";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://blackgust.uz";
export const SITE_NAME = "BlackGust";

export const contacts = {
  email: "hello@blackgust.uz",
  whatsapp: "+998939492000", // digits only, used for wa.me
  whatsappDisplay: "+998 93 949 20 00",
  phones: ["+998 93 949 20 00", "+998 77 061 22 00", "+998 98 877 02 03"],
  address: {
    street: "184 Bogibo‘ston St.",
    city: "Tashkent",
    country: "Uzbekistan",
    countryCode: "UZ",
  },
  geo: { lat: 41.2995, lng: 69.2401 },
  mapUrl: "https://yandex.uz/maps/?text=Tashkent%2C%20Bogibustan%20184",
  hours: { days: "Mo-Sa", open: "09:00", close: "19:00", tz: "GMT+5" },
};

/** Parent company — the backlink target for SEO */
export const parentCompany = {
  name: "AISolution",
  url: "https://aisolution.uz",
  blog: "https://blog.aisolution.uz",
  wikidata: "https://www.wikidata.org/wiki/Q140288424",
  telegram: "https://t.me/aisolutionuz",
};

/** Leadership of both AISolution and BlackGust (same roles in both companies) — used in JSON-LD Person entities */
export const leadership = {
  ceo: { name: "Abbos Khamidov", alt: ["Abbos Xamidov", "Аббос Хамидов"] },
  md: { name: "Ziyodulla Tashmukhammadov", alt: ["Ziyodulla Toshmuhammadov", "Зиёдулла Ташмухаммадов"] },
};

/** What the organization is known for (schema.org knowsAbout) */
export const seoTopics = [
  "Enterprise artificial intelligence", "AI agents", "Sovereign AI", "AI for government", "AI for state corporations",
  "AI for banks", "AI for fintech", "AI for manufacturing", "AI for warehouses and logistics", "AI for construction",
  "AI in education", "AI integration", "Data integration", "Speech recognition for Uzbek",
];

export type Currency = "USD";

/** All prices on blackgust.uz are in USD; clients pay in UZS at the Central Bank rate on the invoice date. */
export const currencyByLocale: Record<Locale, Currency> = { uz: "USD", ru: "USD", en: "USD", zh: "USD", ko: "USD" };

/**
 * Minimum ("from") list prices. Edit here — every page and every language picks them up.
 * Development = turnkey contracts. Consulting = separate engagements.
 */
export const prices = {
  USD: {
    // turnkey development tiers
    foundation: 90_000,
    enterprise: 250_000,
    sovereign: 490_000,
    // consulting
    diagnostic: 29_000, // AI diagnostic, credited toward development
    strategy: 59_000, // AI strategy & transformation roadmap
    architecture: 79_000, // sovereign AI architecture & security design
    academy: 19_000, // executive AI program for leadership
    advisory: 20_000, // Chief AI Officer as a service, per month
  },
} as const;

/** Illustrative demo figures used in the Executive console and the live model. */
export const demo = {
  total: 2_840_000,
  branches: [1_126_400, 809_700, 512_000, 391_900],
  approvalThreshold: 500_000,
};
