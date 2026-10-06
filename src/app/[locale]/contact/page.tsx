import { setRequestLocale } from "next-intl/server";
import { PageMotion } from "@/components/PageMotion";
import type { Locale } from "@/i18n/routing";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { contacts } from "@/config/site";
import { SubHero } from "@/components/Hero";
import { LeadForm } from "@/components/LeadForm";
import { IconMail, IconWhatsApp, IconPhone, IconPin } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/config/site";

type P = { params: Promise<{ locale: Locale }> };
export async function generateMetadata({ params }: P) { const { locale } = await params; return pageMetadata(locale, "contact", "/contact"); }

export default async function Page({ params }: P) {
  const { locale } = await params;
  setRequestLocale(locale);
  const d = await content(locale, "contact");
  const ui = await content(locale, "ui");
  const wa = `https://wa.me/${contacts.whatsapp.replace(/\D/g, "")}`;
  const ch = d.channels;
  const local = {
    "@context": "https://schema.org", "@type": "ProfessionalService", name: "BlackGust", url: SITE_URL, email: contacts.email, telephone: contacts.phones[0],
    address: { "@type": "PostalAddress", streetAddress: contacts.address.street, addressLocality: contacts.address.city, addressCountry: contacts.address.countryCode },
    geo: { "@type": "GeoCoordinates", latitude: contacts.geo.lat, longitude: contacts.geo.lng },
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: contacts.hours.open, closes: contacts.hours.close }],
  };
  return (
    <>
      <SubHero crumbHome={ui.breadcrumbHome} crumb={d.crumb} title={d.title} lede={d.lede} seed={61} />
      <section className="sec">
        <div className="wrap split">
          <LeadForm f={d.form} locale={locale} />
          <div className="gap">
            <div className="channels">
              <a className="channel" href={`mailto:${contacts.email}`}><span className="ic"><IconMail /></span><span><b>{ch.email.title}</b><span>{contacts.email}</span><br /><small>{ch.email.note}</small></span><span className="go">→</span></a>
              <a className="channel" href={wa} target="_blank" rel="noopener"><span className="ic"><IconWhatsApp /></span><span><b>{ch.whatsapp.title}</b><span className="num">{contacts.whatsappDisplay}</span><br /><small>{ch.whatsapp.note}</small></span><span className="go">↗</span></a>
              <a className="channel" href={`tel:${contacts.phones[0].replace(/\s/g, "")}`}><span className="ic"><IconPhone /></span><span><b>{ch.phone.title}</b><span className="num">{contacts.phones.join(" · ")}</span><br /><small>{ch.phone.note}</small></span><span className="go">→</span></a>
              <a className="channel" href={contacts.mapUrl} target="_blank" rel="noopener"><span className="ic"><IconPin /></span><span><b>{ch.office.title}</b><span>{contacts.address.street}, {contacts.address.city}, {contacts.address.country}</span><br /><small>{ch.office.note} · {ch.office.map}</small></span><span className="go">↗</span></a>
            </div>
            <div className="cells c2 mt-m" style={{ gridTemplateColumns: "1fr" }}>
              <div><span className="k">{d.hoursTitle}</span><p>{d.hours}</p></div>
              <div><span className="k">{d.nextTitle}</span><ul className="ticks">{d.next.map((i: string) => <li key={i}>{i}</li>)}</ul></div>
            </div>
          </div>
        </div>
      </section>
      <JsonLd data={local} />
      <PageMotion />
    </>
  );
}
