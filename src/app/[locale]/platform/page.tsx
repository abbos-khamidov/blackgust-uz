import { setRequestLocale } from "next-intl/server";
import { PageMotion } from "@/components/PageMotion";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import type { Cell, Layer, ModelOption } from "@/lib/types";
import { SubHero, Band, SecHead, Arrow } from "@/components/Hero";


type P = { params: Promise<{ locale: Locale }> };
export async function generateMetadata({ params }: P) { const { locale } = await params; return pageMetadata(locale, "platform", "/platform"); }

export default async function Page({ params }: P) {
  const { locale } = await params;
  setRequestLocale(locale);
  const d = await content(locale, "platform");
  const ui = await content(locale, "ui");
  return (
    <>
      <SubHero crumbHome={ui.breadcrumbHome} crumb={d.crumb} title={d.title} lede={d.lede} seed={3} />

      <section className="sec">
        <div className="wrap">
          <SecHead label={d.arch.label} title={d.arch.title} text={d.arch.text} />
          <div className="stack">
            {d.layers.map((l: Layer) => (
              <div key={l.tag} className={`layer${l.hl ? " hl" : ""}`} style={l.dashed ? { borderStyle: "dashed" } : undefined}>
                <span className="tag">{l.tag}</span>
                <div><h4>{l.h}</h4><p>{l.p}</p></div>
                <div className="chips">{l.chips.map((c: string) => <span className="chip" key={c}>{c}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec paper" id="modules">
        <div className="wrap">
          <SecHead label={d.modules.label} title={d.modules.title} text={d.modules.text} />
          <div className="cells c3">{d.modules.cells.map((c: Cell) => <div key={c.h}><span className="k">{c.k}</span><h3 className="h4">{c.h}</h3><p>{c.p}</p></div>)}</div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <SecHead label={d.agents.label} title={d.agents.title} text={d.agents.text} />
          <div className="split">
            <div className="console">
              <div className="ch"><span><i />{d.agents.consoleTitle}</span><span>{d.agents.consoleNote}</span></div>
              <div className="cb" style={{ fontFamily: "var(--f-mono)", fontSize: ".8rem", lineHeight: 1.7, color: "#C9C7C0" }}>
                {d.agents.config.map(([k, v]: string[]) => <div key={k}><span className="brass">{k}:</span> {v}</div>)}
              </div>
            </div>
            <ul className="ticks" style={{ alignSelf: "center" }}>{d.agents.items.map((i: string) => <li key={i}>{i}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="sec paper" id="models">
        <div className="wrap">
          <SecHead label={d.models.label} title={d.models.title} text={d.models.text} />
          <div className="tiers">
            {d.models.options.map((o: ModelOption) => (
              <div key={o.k} className={`tier${o.hl ? " hl" : ""}`}>
                <span className="mono dim">{o.k}</span>
                <h3 className="h4">{o.h}</h3>
                <p className="dim">{o.p}</p>
                <ul className="ticks">{o.items.map((i: string) => <li key={i}>{i}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="deploy">
        <div className="wrap">
          <SecHead label={d.deploy.label} title={d.deploy.title} text={d.deploy.text} />
          <div className="tbl-w">
            <table className="tbl" style={{ fontSize: ".92rem", minWidth: 760 }}>
              <thead><tr>{d.deploy.headers.map((x: string) => <th key={x}>{x}</th>)}</tr></thead>
              <tbody>{d.deploy.rows.map((r: string[]) => <tr key={r[0]}><td><b>{r[0]}</b></td>{r.slice(1).map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <p className="note mt-s">{d.deploy.note}</p>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <SecHead label={d.it.label} title={d.it.title} text={d.it.text} />
          <div className="qa">{d.it.qa.map(([q, a]: string[]) => <div key={q}><span className="qq">{q}</span><span className="aa">{a}</span></div>)}</div>
        </div>
      </section>

      <Band title={d.band.title} text={d.band.text} seed={23}>
        <Link className="btn btn-p" href="/contact">{d.band.cta1} <Arrow /></Link>
        <Link className="btn btn-g" href="/security">{d.band.cta2}</Link>
      </Band>
      <PageMotion />
    </>
  );
}
