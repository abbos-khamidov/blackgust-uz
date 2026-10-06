import { setRequestLocale } from "next-intl/server";
import { PageMotion } from "@/components/PageMotion";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import type { Cell } from "@/lib/types";
import { SubHero, Band, SecHead, Arrow } from "@/components/Hero";

type P = { params: Promise<{ locale: Locale }> };
export async function generateMetadata({ params }: P) { const { locale } = await params; return pageMetadata(locale, "solutions", "/solutions"); }

export default async function Page({ params }: P) {
  const { locale } = await params;
  setRequestLocale(locale);
  const d = await content(locale, "solutions");
  const ui = await content(locale, "ui");
  return (
    <>
      <SubHero crumbHome={ui.breadcrumbHome} crumb={d.crumb} title={d.title} lede={d.lede} seed={11} />
      <section className="sec">
        <div className="wrap">
          <SecHead label={d.functions.label} title={d.functions.title} text={d.functions.text} />
          <div className="rows">{d.functions.rows.map((r: string[]) => <div key={r[0]}><span className="t">{r[0]}</span><p>{r[1]}</p><span className="x">{r[2]}</span></div>)}</div>
        </div>
      </section>
      <section className="sec paper" id="industries">
        <div className="wrap">
          <SecHead label={d.industries.label} title={d.industries.title} text={d.industries.text} />
          <div className="cells c3">
            {d.industries.cells.map((c: Cell) => (
              <div key={c.k}><span className="k">{c.k}</span><h3 className="h4">{c.h}</h3>
                <ul className="ticks">{(c.items ?? []).map((i: string) => <li key={i}>{i}</li>)}</ul>
                {c.href ? <Link className="more" href={c.href}>{d.industries.more} →</Link> : null}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="sec">
        <div className="wrap">
          <SecHead label={d.pilot.label} title={d.pilot.title} text={d.pilot.text} />
          <div className="cells c3">{d.pilot.cells.map((c: Cell) => <div key={c.h}><span className="k">{c.k}</span><h3 className="h4">{c.h}</h3><p>{c.p}</p></div>)}</div>
        </div>
      </section>
      <Band title={d.band.title} text={d.band.text} seed={31}>
        <Link className="btn btn-p" href="/contact">{d.band.cta1} <Arrow /></Link>
      </Band>
      <PageMotion />
    </>
  );
}
