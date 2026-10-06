import { setRequestLocale } from "next-intl/server";
import { PageMotion } from "@/components/PageMotion";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { SubHero, Band, SecHead, Arrow } from "@/components/Hero";
import { Md } from "@/components/Md";

type P = { params: Promise<{ locale: Locale }> };
type DevTier = { name: string; price: string; term: string; for: string; items: string[]; cta: string; hl?: boolean };
type Consult = { k: string; h: string; p: string; price: string; unit?: string };

export async function generateMetadata({ params }: P) { const { locale } = await params; return pageMetadata(locale, "pricing", "/pricing"); }

export default async function Page({ params }: P) {
  const { locale } = await params;
  setRequestLocale(locale);
  const d = await content(locale, "pricing");
  const ui = await content(locale, "ui");
  return (
    <>
      <SubHero crumbHome={ui.breadcrumbHome} crumb={d.crumb} title={d.title} lede={d.lede} seed={41} />

      <section className="sec">
        <div className="wrap">
          <SecHead label={d.dev.label} title={d.dev.title} text={d.dev.text} />
          <div className="tiers">
            {d.tiers.map((t: DevTier) => (
              <div key={t.name} className={`tier${t.hl ? " hl" : ""}`}>
                <span className={`mono ${t.hl ? "brass" : "dim"}`}>{t.term}</span>
                <h3 className="h3">{t.name}</h3>
                <div className="price num">{t.price}</div>
                <p className="dim">{t.for}</p>
                <ul className="ticks">{t.items.map((i) => <li key={i}>{i}</li>)}</ul>
                <Link className={`btn ${t.hl ? "btn-p" : "btn-g"}`} href="/contact" style={{ marginTop: "auto", justifySelf: "start" }}>{t.cta}{t.hl ? <> <Arrow /></> : null}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec paper" id="consulting">
        <div className="wrap">
          <SecHead label={d.consult.label} title={d.consult.title} text={<Md text={d.consult.text} />} />
          <div className="consult">
            {d.consult.items.map((c: Consult) => (
              <div key={c.h} className="consult-row">
                <span className="k mono">{c.k}</span>
                <div><h3 className="h4">{c.h}</h3><p>{c.p}</p></div>
                <div className="consult-price num">{c.price}{c.unit ? <small>{c.unit}</small> : null}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap split">
          <div className="gap">
            <span className="label">{d.support.label}</span>
            <h2 className="serif" style={{ fontSize: "var(--s-2xl)", lineHeight: 1.05 }}>{d.support.title}</h2>
          </div>
          <p className="dim" style={{ alignSelf: "center", maxWidth: "60ch" }}>{d.support.text}</p>
        </div>
      </section>

      <section className="sec paper">
        <div className="wrap">
          <SecHead label={d.factors.label} title={d.factors.title} text={d.factors.text} />
          <div className="qa">{d.factors.qa.map(([q, a]: string[]) => <div key={q}><span className="qq">{q}</span><span className="aa">{a}</span></div>)}</div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <SecHead label={d.roi.label} title={d.roi.title} text={d.roi.text} />
          <div className="console" style={{ maxWidth: 860 }}>
            <div className="ch"><span><i />{d.roi.consoleTitle}</span><span>{d.roi.consoleNote}</span></div>
            <div className="cb">
              <div className="tbl-w"><table className="tbl">
                <thead><tr>{d.roi.headers.map((x: string, i: number) => <th key={x} className={i ? "r" : undefined}>{x}</th>)}</tr></thead>
                <tbody>{d.roi.rows.map((r: string[], k: number) => <tr key={r[0]}><td>{r[0]}</td><td className="r">{r[1]}</td><td className={`r${k === d.roi.rows.length - 1 ? " brass" : ""}`}>{r[2]}</td></tr>)}</tbody>
              </table></div>
              <p className="note">{d.roi.note}</p>
            </div>
          </div>
        </div>
      </section>

      <Band title={d.band.title} text={d.band.text} seed={43}>
        <Link className="btn btn-p" href="/contact">{d.band.cta1} <Arrow /></Link>
      </Band>
      <PageMotion />
    </>
  );
}
