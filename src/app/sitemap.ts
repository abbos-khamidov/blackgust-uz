import type { MetadataRoute } from "next";
import { routing, localeTags } from "@/i18n/routing";
import { localizedUrl } from "@/lib/seo";

const PAGES = ["/", "/platform", "/approach", "/solutions", "/government", "/security", "/pricing", "/company", "/faq", "/contact", "/aisolution"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PAGES.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: localizedUrl(locale, path),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : path === "/pricing" || path === "/platform" ? 0.9 : 0.7,
      alternates: { languages: Object.fromEntries(routing.locales.map((l) => [localeTags[l], localizedUrl(l, path)])) },
    })),
  );
}
