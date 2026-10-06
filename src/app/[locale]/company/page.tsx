import { setRequestLocale } from "next-intl/server";
import { PageMotion } from "@/components/PageMotion";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import type { Cell } from "@/lib/types";
import { parentCompany } from "@/config/site";
import { SubHero, SecHead, Arrow } from "@/components/Hero";
import { Split } from "@/components/Split";
import { Counter } from "@/components/Counter";

type P = { params: Promise<{ locale: Locale }> };
export async function generateMetadata({ params }: P) { const { locale } = await params; return pageMetadata(locale, "company", "/company"); }

export default async function Page({ params }: P) {
  const { locale } = await params;
  setRequestLocale(locale);
  const d = await content(locale, "company");
  const ui = await content(locale, "ui");
  return (
    <>
      <SubHero crumbHome={ui.breadcrumbHome} crumb={d.crumb} title={d.title} lede={d.lede} seed={47} />
      <section className="sec">
        <div className="wrap split">
          <div className="gap"><span className="label">{d.why.label}</span><h2 className="serif" style={{ fontSize: "var(--s-2xl)", lineHeight: 1.05 }}><Split text={d.why.title} /></h2></div>
          <div className="prose dim" style={{ alignSelf: "center" }}>{d.why.paras.map((p: string) => <p key={p}>{p}</p>)}</div>
        </div>
      </section>
      <section className="sec"><div className="wrap"><div className="facts">{d.facts.map(([n, t]: string[]) => <div key={t}><Counter value={n} /><span>{t}</span></div>)}</div></div></section>
      <section className="sec paper">
        <div className="wrap">
          <SecHead label={d.principles.label} title={d.principles.title} />
          <div className="cells c2">{d.principles.cells.map((c: Cell) => <div key={c.h}><span className="k">{c.k}</span><h3 className="h4">{c.h}</h3><p>{c.p}</p></div>)}</div>
        </div>
      </section>
      <section className="sec" id="leadership">
        <div className="wrap">
          <SecHead label={d.leadership.label} title={d.leadership.title} text={d.leadership.text} />
          <div className="cells c2">{d.leadership.people.map((c: Cell) => <div key={c.h}><span className="k">{c.k}</span><h3 className="h4">{c.h}</h3><p>{c.p}</p></div>)}</div>
        </div>
      </section>
      <section className="sec">
        <div className="wrap">
          <span className="label">{d.parent.label}</span>
          <div className="parent mt-m">
            <div className="gap"><h2 className="serif" style={{ fontSize: "var(--s-xl)", lineHeight: 1.1 }}>{d.parent.title}</h2><p className="dim" style={{ maxWidth: "62ch" }}>{d.parent.text}</p></div>
            <div className="row">
              <Link className="btn btn-g" href="/aisolution">{d.parent.cta}</Link>
              <a className="btn btn-p" href={parentCompany.url} target="_blank" rel="noopener">{d.parent.ext} <span className="ar" aria-hidden="true">↗</span></a>
            </div>
          </div>
        </div>
      </section>
      <section className="sec">
        <div className="wrap split">
          <div className="gap"><span className="label">{d.partners.label}</span><h2 className="serif" style={{ fontSize: "var(--s-2xl)", lineHeight: 1.05 }}><Split text={d.partners.title} /></h2><p className="dim" style={{ maxWidth: "52ch" }}>{d.partners.text}</p></div>
          <div className="cells c2" style={{ alignSelf: "center" }}>{d.partners.cells.map((c: Cell) => <div key={c.h}><span className="k">{c.k}</span><h3 className="h4">{c.h}</h3><p>{c.p}</p></div>)}</div>
        </div>
      </section>
      <section className="sec paper" id="careers">
        <div className="wrap">
          <SecHead label={d.careers.label} title={d.careers.title} text={d.careers.text} />
          <div className="split">
            <div className="gap"><h3 className="h4">{d.careers.lookTitle}</h3><ul className="ticks">{d.careers.look.map((i: string) => <li key={i}>{i}</li>)}</ul></div>
            <div className="gap"><h3 className="h4">{d.careers.teachTitle}</h3><ul className="ticks">{d.careers.teach.map((i: string) => <li key={i}>{i}</li>)}</ul>
              <Link className="btn btn-p mt-s" href="/contact" style={{ justifySelf: "start" }}>{d.careers.cta} <Arrow /></Link></div>
          </div>
        </div>
      </section>
      <PageMotion />
    </>
  );
}
