import { setRequestLocale } from "next-intl/server";
import { PageMotion } from "@/components/PageMotion";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import type { Cell } from "@/lib/types";
import { SubHero, SecHead, Arrow } from "@/components/Hero";
import { Split } from "@/components/Split";

type P = { params: Promise<{ locale: Locale }> };
export async function generateMetadata({ params }: P) { const { locale } = await params; return pageMetadata(locale, "security", "/security"); }

export default async function Page({ params }: P) {
  const { locale } = await params;
  setRequestLocale(locale);
  const d = await content(locale, "security");
  const ui = await content(locale, "ui");
  return (
    <>
      <SubHero crumbHome={ui.breadcrumbHome} crumb={d.crumb} title={d.title} lede={d.lede} seed={17} />
      <section className="sec">
        <div className="wrap">
          <SecHead label={d.data.label} title={d.data.title} />
          <div className="qa">{d.data.qa.map(([q, a]: string[]) => <div key={q}><span className="qq">{q}</span><span className="aa">{a}</span></div>)}</div>
        </div>
      </section>
      <section className="sec paper">
        <div className="wrap">
          <SecHead label={d.agents.label} title={d.agents.title} text={d.agents.text} />
          <div className="split">
            <div className="gap"><h3 className="h4">{d.agents.canTitle}</h3><ul className="ticks">{d.agents.can.map((i: string) => <li key={i}>{i}</li>)}</ul></div>
            <div className="gap"><h3 className="h4">{d.agents.cannotTitle}</h3><ul className="ticks crosses">{d.agents.cannot.map((i: string) => <li key={i}>{i}</li>)}</ul></div>
          </div>
        </div>
      </section>
      <section className="sec">
        <div className="wrap">
          <SecHead label={d.controls.label} title={d.controls.title} />
          <div className="cells c3">{d.controls.cells.map((c: Cell) => <div key={c.h}><span className="k">{c.k}</span><h3 className="h4">{c.h}</h3><p>{c.p}</p></div>)}</div>
        </div>
      </section>
      <section className="sec">
        <div className="wrap split">
          <div className="gap">
            <span className="label">{d.verify.label}</span>
            <h2 className="serif" style={{ fontSize: "var(--s-2xl)", lineHeight: 1.05 }}><Split text={d.verify.title} /></h2>
            <p className="dim" style={{ maxWidth: "52ch" }}>{d.verify.text}</p>
          </div>
          <div className="gap" style={{ alignSelf: "center" }}><Link className="btn btn-p" href="/contact" style={{ justifySelf: "start" }}>{d.verify.cta} <Arrow /></Link></div>
        </div>
      </section>
      <PageMotion />
    </>
  );
}
