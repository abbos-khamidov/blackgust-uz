import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing, localeTags, type Locale } from "@/i18n/routing";
import { SITE_URL, SITE_NAME, contacts, parentCompany } from "@/config/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionRoot } from "@/components/MotionRoot";
import { JsonLd } from "@/components/JsonLd";
import { Cursor } from "@/components/Cursor";
// Self-hosted fonts (no request to Google; all subsets incl. Cyrillic/Kazakh load by unicode-range)
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

  const org = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization", "@id": `${SITE_URL}/#org`, name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/icon.svg`,
        email: contacts.email,
        address: { "@type": "PostalAddress", streetAddress: contacts.address.street, addressLocality: contacts.address.city, addressCountry: contacts.address.countryCode },
        contactPoint: [{ "@type": "ContactPoint", contactType: "sales", email: contacts.email, telephone: contacts.phones[0], availableLanguage: ["uz", "ru", "en", "kk", "zh"] }],
        parentOrganization: { "@type": "Organization", "@id": `${parentCompany.url}/#org`, name: parentCompany.name, url: parentCompany.url, sameAs: [parentCompany.wikidata, parentCompany.blog] },
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
          <Cursor />
        </NextIntlClientProvider>
        <JsonLd data={org} />
      </body>
    </html>
  );
}
