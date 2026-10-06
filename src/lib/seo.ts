import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE_URL, SITE_NAME } from "@/config/site";
import { routing, localeTags, type Locale } from "@/i18n/routing";
import { fill, priceVars } from "./format";

export function localizedUrl(locale: Locale, path: string): string {
  const p = path === "/" ? "" : path;
  return locale === routing.defaultLocale ? `${SITE_URL}${p || "/"}` : `${SITE_URL}/${locale}${p}`;
}

export function alternates(locale: Locale, path: string): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[localeTags[l]] = localizedUrl(l, path);
  languages["x-default"] = localizedUrl(routing.defaultLocale, path);
  return { canonical: localizedUrl(locale, path), languages };
}

/** Metadata for a page key in messages.meta, with hreflang alternates and Open Graph. */
export async function pageMetadata(locale: Locale, key: string, path: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta" });
  const vars = priceVars(locale);
  const title = fill(t.raw(`${key}.title`) as string, vars);
  const description = fill(t.raw(`${key}.description`) as string, vars);
  return {
    title,
    description,
    alternates: alternates(locale, path),
    openGraph: {
      type: "website", siteName: SITE_NAME, title, description, url: localizedUrl(locale, path),
      locale: localeTags[locale].replace("-", "_"),
      images: [{ url: `/og?l=${locale}`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`/og?l=${locale}`] },
  };
}
