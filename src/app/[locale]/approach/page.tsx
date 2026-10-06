import { setRequestLocale } from "next-intl/server";
import { PageMotion } from "@/components/PageMotion";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import type { Cell, Phase } from "@/lib/types";
import { SubHero, Band, SecHead, Arrow } from "@/components/Hero";
import { Split } from "@/components/Split";

type P = { params: Promise<{ locale: Locale }> };
export async function generateMetadata({ params }: P) { const { locale } = await params; return pageMetadata(locale, "approach", "/approach"); }

export default async function Page({ params }: P) {
  const { locale } = await params;
  setRequestLocale(locale);
  const d = await content(locale, "approach");
  const ui = await content(locale, "ui");
  return (
    <>
      <SubHero crumbHome={ui.breadcrumbHome} crumb={d.crumb} title={d.title} lede={d.lede} seed={5} />
      <section className="sec">
        <div className="wrap">
          <SecHead label={d.fde.label} title={d.fde.title} text={d.fde.text} />
          <div className="cells c3">{d.fde.cells.map((c: Cell) => <div key={c.h}><span className="k">{c.k}</span><h3 className="h4">{c.h}</h3><p>{c.p}</p></div>)}</div>
        </div>
      </section>
      <section className="sec">
        <div className="wrap">
          <SecHead label={d.phases.label} title={d.phases.title} text={d.phases.text} />
          <div className="phases">
            {d.phases.items.map((p: Phase) => (
              <div className="phase" key={p.title}>
                <span className="dur">{p.dur}</span><h3>{p.title}</h3>
                <ul>{(p.list ?? []).map((i: string) => <li key={i}>{i}</li>)}</ul>
                <div className="out"><b>{d.phases.youGet}</b>{p.out}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="sec paper">
        <div className="wrap">
          <SecHead label={d.roles.label} title={d.roles.title} text={d.roles.text} />
          <div className="tbl-w"><table className="tbl" style={{ fontSize: ".92rem", minWidth: 720 }}>
            <thead><tr>{d.roles.headers.map((x: string) => <th key={x}>{x}</th>)}</tr></thead>
            <tbody>{d.roles.rows.map((r: string[]) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
          </table></div>
        </div>
      </section>
      <section className="sec">
        <div className="wrap split">
          <div className="gap">
            <span className="label">{d.needs.label}</span>
            <h2 className="serif" style={{ fontSize: "var(--s-2xl)", lineHeight: 1.05 }}><Split text={d.needs.title} /></h2>
            <p className="dim" style={{ maxWidth: "52ch" }}>{d.needs.text}</p>
          </div>
          <ul className="ticks" style={{ alignSelf: "center" }}>{d.needs.items.map((i: string) => <li key={i}>{i}</li>)}</ul>
        </div>
      </section>
      <section className="sec">
        <div className="wrap split">
          <div className="gap">
            <span className="label">{d.no.label}</span>
            <h2 className="serif" style={{ fontSize: "var(--s-2xl)", lineHeight: 1.05 }}><Split text={d.no.title} /></h2>
          </div>
          <ul className="ticks crosses" style={{ alignSelf: "center" }}>{d.no.items.map((i: string) => <li key={i}>{i}</li>)}</ul>
        </div>
      </section>
      <Band title={d.band.title} text={d.band.text} seed={29}>
        <Link className="btn btn-p" href="/contact">{d.band.cta1} <Arrow /></Link>
        <Link className="btn btn-g" href="/pricing">{d.band.cta2}</Link>
      </Band>
      <PageMotion />
    </>
  );
}
