import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing, localeTags, type Locale } from "@/i18n/routing";
import { SITE_URL, SITE_NAME, contacts, parentCompany, leadership, seoTopics } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionRoot } from "@/components/MotionRoot";
import { JsonLd } from "@/components/JsonLd";
import { Cursor } from "@/components/Cursor";
import { PageTransition } from "@/components/PageTransition";
// Self-hosted fonts (no request to Google; Latin/Cyrillic subsets load by unicode-range; CJK and Hangul fall back to system fonts)
import "@fontsource/spectral/300.css";
import "@fontsource/spectral/300-italic.css";
import "@fontsource/spectral/400.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "../globals.css";


export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
};

export const viewport: Viewport = { themeColor: "#07080A", colorScheme: "dark", viewportFit: "cover" };

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const all = await getMessages();
  const clientMessages = { nav: all.nav, ui: all.ui };

  const meta = all.meta as { default: { description: string } };
  const ceo = { "@id": `${SITE_URL}/#ceo` };
  const md = { "@id": `${SITE_URL}/#md` };
  const parentRef = { "@id": `${parentCompany.url}/#org` };
  const org = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization", "@id": `${SITE_URL}/#org`, name: SITE_NAME, alternateName: "BlackGust by AISolution", url: SITE_URL, logo: `${SITE_URL}/icon.svg`,
        description: meta.default.description,
        email: contacts.email,
        address: { "@type": "PostalAddress", streetAddress: contacts.address.street, addressLocality: contacts.address.city, addressCountry: contacts.address.countryCode },
        contactPoint: [{ "@type": "ContactPoint", contactType: "sales", email: contacts.email, telephone: contacts.phones[0], availableLanguage: [...routing.locales] }],
        areaServed: [{ "@type": "Country", name: "Uzbekistan" }, { "@type": "Place", name: "Central Asia" }, { "@type": "Place", name: "Asia" }],
        knowsAbout: seoTopics,
        founder: ceo,
        employee: [ceo, md],
        parentOrganization: { "@type": "Organization", ...parentRef, name: parentCompany.name, url: parentCompany.url, sameAs: [parentCompany.wikidata, parentCompany.blog, parentCompany.telegram] },
      },
      {
        "@type": "Person", ...ceo, name: leadership.ceo.name, alternateName: leadership.ceo.alt, jobTitle: "Founder & CEO",
        worksFor: [{ "@id": `${SITE_URL}/#org` }, parentRef],
      },
      {
        "@type": "Person", ...md, name: leadership.md.name, alternateName: leadership.md.alt, jobTitle: "Co-founder & Managing Director",
        worksFor: [{ "@id": `${SITE_URL}/#org` }, parentRef],
      },
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, publisher: { "@id": `${SITE_URL}/#org` }, inLanguage: routing.locales.map((l) => localeTags[l]) },
    ],
  };

  return (
    <html lang={localeTags[locale as Locale]} suppressHydrationWarning>
      <body>
        {/* intro plays once per session */}
        <Script id="bg-intro" strategy="beforeInteractive">{"try{if(sessionStorage.getItem('bg-intro'))document.documentElement.classList.add('no-intro');sessionStorage.setItem('bg-intro','1')}catch(e){}"}</Script>
        <div className="intro" aria-hidden="true">
          <div className="intro-in">
            <span className="intro-k">AISolution · Tashkent</span>
            <span className="intro-w">{"BLACKGUST".split("").map((c, i) => <b key={i} style={{ ["--i" as string]: i }}>{c}</b>)}</span>
            <span className="intro-bar"><i /></span>
            <span className="intro-n" />
          </div>
        </div>
        <NextIntlClientProvider locale={locale} messages={clientMessages}>
          <Header />
          <main id="main">{children}</main>
          <Footer locale={locale} />
          <MotionRoot />
          <PageTransition />
          <Cursor />
        </NextIntlClientProvider>
        <JsonLd data={org} />
      </body>
    </html>
  );
}
