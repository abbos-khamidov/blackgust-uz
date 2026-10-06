import { setRequestLocale } from "next-intl/server";
import { PageMotion } from "@/components/PageMotion";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { parentCompany, SITE_URL } from "@/config/site";
import { SubHero, Band, SecHead } from "@/components/Hero";
import { Counter } from "@/components/Counter";
import type { Cell } from "@/lib/types";
import { JsonLd } from "@/components/JsonLd";

type P = { params: Promise<{ locale: Locale }> };
export async function generateMetadata({ params }: P) { const { locale } = await params; return pageMetadata(locale, "aisolution", "/aisolution"); }

/** Parent-company page: a crawlable, contextual, dofollow link to aisolution.uz for entity SEO. */
export default async function Page({ params }: P) {
  const { locale } = await params;
  setRequestLocale(locale);
  const d = await content(locale, "aisolution");
  const ui = await content(locale, "ui");
  const lead = (await content(locale, "company")).leadership;
  const schema = {
    "@context": "https://schema.org", "@type": "Organization", "@id": `${parentCompany.url}/#org`, name: parentCompany.name, url: parentCompany.url,
    sameAs: [parentCompany.wikidata, parentCompany.blog, parentCompany.telegram],
    subOrganization: { "@id": `${SITE_URL}/#org` },
    founder: { "@id": `${SITE_URL}/#ceo` },
    employee: [{ "@id": `${SITE_URL}/#ceo` }, { "@id": `${SITE_URL}/#md` }],
  };
  return (
    <>
      <SubHero crumbHome={ui.breadcrumbHome} crumb={d.crumb} title={d.title} lede={d.lede} seed={67} />
      <section className="sec">
        <div className="wrap split">
          <div className="gap"><span className="label">{d.about.label}</span><h2 className="serif" style={{ fontSize: "var(--s-2xl)", lineHeight: 1.05 }}>{d.about.title}</h2></div>
          <div className="gap" style={{ alignSelf: "center" }}>
            <div className="prose dim">{d.about.paras.map((p: string) => <p key={p}>{p}</p>)}</div>
            <div className="row mt-s">
              <a className="btn btn-p" href={parentCompany.url} target="_blank" rel="noopener">{d.about.cta} <span className="ar" aria-hidden="true">↗</span></a>
              <a className="btn btn-g" href={parentCompany.blog} target="_blank" rel="noopener">{d.about.blog}</a>
            </div>
          </div>
        </div>
      </section>
      <section className="sec"><div className="wrap"><div className="facts">{d.facts.map(([n, t]: string[]) => <div key={t}><Counter value={n} /><span>{t}</span></div>)}</div></div></section>
      <section className="sec">
        <div className="wrap">
          <SecHead label={lead.label} title={lead.title} text={lead.text} />
          <div className="cells c2">{lead.people.map((c: Cell) => <div key={c.h}><span className="k">{c.k}</span><h3 className="h4">{c.h}</h3><p>{c.p}</p></div>)}</div>
        </div>
      </section>
      <section className="sec paper">
        <div className="wrap">
          <SecHead label={d.which.label} title={d.which.title} />
          <div className="rows">
            {d.which.rows.map((r: string[]) => (
              <div key={r[0]}><span className="t">{r[0]}</span><p>{r[1]}</p>
                {r[2] === "aisolution.uz" ? <a className="x u" href={parentCompany.url} target="_blank" rel="noopener">{r[2]} ↗</a> : <Link className="x u" href="/">{r[2]}</Link>}
              </div>
            ))}
          </div>
        </div>
      </section>
      <Band title={d.band.title} text={d.band.text} seed={71}>
        <a className="btn btn-p" href={parentCompany.url} target="_blank" rel="noopener">{d.band.cta1} <span className="ar" aria-hidden="true">↗</span></a>
        <Link className="btn btn-g" href="/contact">{d.band.cta2}</Link>
      </Band>
      <JsonLd data={schema} />
      <PageMotion />
    </>
  );
}
