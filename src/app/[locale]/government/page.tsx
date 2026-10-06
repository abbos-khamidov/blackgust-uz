import { setRequestLocale } from "next-intl/server";
import { PageMotion } from "@/components/PageMotion";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import type { Cell } from "@/lib/types";
import { SubHero, Band, SecHead, Arrow } from "@/components/Hero";
import { Counter } from "@/components/Counter";

type P = { params: Promise<{ locale: Locale }> };
export async function generateMetadata({ params }: P) { const { locale } = await params; return pageMetadata(locale, "government", "/government"); }

export default async function Page({ params }: P) {
  const { locale } = await params;
  setRequestLocale(locale);
  const d = await content(locale, "government");
  const ui = await content(locale, "ui");
  return (
    <>
      <SubHero crumbHome={ui.breadcrumbHome} crumb={d.crumb} title={d.title} lede={d.lede} seed={13} />
      <section className="sec">
        <div className="wrap">
          <SecHead label={d.principles.label} title={d.principles.title} />
          <div className="cells c4">{d.principles.cells.map((c: Cell) => <div key={c.h}><span className="k">{c.k}</span><h3 className="h4">{c.h}</h3><p>{c.p}</p></div>)}</div>
        </div>
      </section>
      <section className="sec paper">
        <div className="wrap">
          <SecHead label={d.cases.label} title={d.cases.title} text={d.cases.text} />
          <div className="rows">{d.cases.rows.map((r: string[]) => <div key={r[0]}><span className="t">{r[0]}</span><p>{r[1]}</p><span className="x">{r[2]}</span></div>)}</div>
        </div>
      </section>
      <section className="sec">
        <div className="wrap">
          <SecHead label={d.languages.label} title={d.languages.title} text={d.languages.text} />
          <div className="facts">{d.languages.facts.map(([n, t]: string[]) => <div key={t}><Counter value={n} /><span>{t}</span></div>)}</div>
        </div>
      </section>
      <section className="sec">
        <div className="wrap">
          <SecHead label={d.procurement.label} title={d.procurement.title} text={d.procurement.text} />
          <div className="cells c3">{d.procurement.cells.map((c: Cell) => <div key={c.h}><span className="k">{c.k}</span><h3 className="h4">{c.h}</h3><p>{c.p}</p></div>)}</div>
          <div className="split mt-l">
            <div className="gap"><h3 className="h3">{d.procurement.docsTitle}</h3></div>
            <ul className="ticks">{d.procurement.docs.map((i: string) => <li key={i}>{i}</li>)}</ul>
          </div>
        </div>
      </section>
      <Band title={d.band.title} text={d.band.text} seed={37}>
        <Link className="btn btn-p" href="/contact">{d.band.cta1} <Arrow /></Link>
        <Link className="btn btn-g" href="/security">{d.band.cta2}</Link>
      </Band>
      <PageMotion />
    </>
  );
}
