import { setRequestLocale } from "next-intl/server";
import { PageMotion } from "@/components/PageMotion";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import type { Cell, Phase, Tab } from "@/lib/types";
import { moneyCompact } from "@/lib/format";
import { demo, parentCompany } from "@/config/site";
import { GustCanvas } from "@/components/GustCanvas";
import { GlobeCanvas } from "@/components/GlobeCanvas";
import { Split } from "@/components/Split";
import { Md } from "@/components/Md";
import { Band, SecHead, Arrow } from "@/components/Hero";
import { Tabs } from "@/components/Tabs";
import { Typed } from "@/components/Typed";
import { FlowViz } from "@/components/FlowViz";

type P = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: P) {
  const { locale } = await params;
  return pageMetadata(locale, "home", "/");
}

export default async function Home({ params }: P) {
  const { locale } = await params;
  setRequestLocale(locale);
  const h = await content(locale, "home");
  const ui = await content(locale, "ui");
  const split = await content(locale, "split");
  const viz = await content(locale, "viz");
  const cn = await content(locale, "console");
  const nav = await content(locale, "nav");
  const sevClass: Record<string, string> = { c: "sev c", w: "sev w", o: "sev o" };

  return (
    <>
      <section className="hero hero-home">
        <GustCanvas options={{ density: 1500, lapis: 0.08, seed: 11 }} />
        <GlobeCanvas options={{ variant: "hero" }} />
        <div className="veil" />
        <div className="hero-scan" aria-hidden="true" />
        <div className="wrap">
          <div className="hero-x">
            <span className="badge"><i />{h.hero.badge}</span>
            <h1 className="mt-m"><Split text={h.hero.title} /></h1>
            <p className="lede mt-m">{h.hero.lede}</p>
            <div className="row mt-m">
              <Link className="btn btn-p" href="/contact">{ui.cta} <Arrow /></Link>
              <Link className="btn btn-g" href="/platform">{h.hero.cta2}</Link>
            </div>
          </div>
          <ul className="meta meta-x">
            {h.hero.meta.map(([k, v]: string[]) => <li key={k}><span>{k}</span><b>{v}</b></li>)}
          </ul>
        </div>
        <div className="scroll-cue" aria-hidden="true"><i /></div>
      </section>

      <div className="marq" aria-hidden="true"><div className="tr">
        {[...h.marquee, ...h.marquee].map((m: string, i: number) => <span key={i}>{m}</span>)}
      </div></div>

      <section className="sec">
        <div className="wrap">
          <SecHead label={h.problem.label} title={h.problem.title} text={h.problem.text} />
          <div className="cells c4" data-scene="deck">
            {h.problem.cells.map((c: Cell) => <div key={c.k}><span className="k">{c.k}</span><h3 className="h4">{c.h}</h3><p>{c.p}</p></div>)}
          </div>
        </div>
      </section>

      <section className="sec" data-scrub="">
        <div className="gridlines" />
        <div className="wrap" style={{ position: "relative" }}>
          <SecHead label={h.what.label} title={h.what.title} text={h.what.text} />
          <div className="split">
            {(["platform", "engineers"] as const).map((k) => (
              <div className="gap" key={k}>
                <span className="mono lapis">{k === "platform" ? split.platformTag : split.engineersTag}</span>
                <h3 className="h3">{h.what[k].title}</h3>
                <ul className="ticks mt-s">{h.what[k].items.map((i: string) => <li key={i}>{i}</li>)}</ul>
                <Link className="btn btn-g mt-s" href={k === "platform" ? "/platform" : "/approach"} style={{ justifySelf: "start" }}>{h.what[k].cta} <Arrow /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" id="how">
        <div className="wrap">
          <SecHead label={h.how.label} title={h.how.title} text={h.how.text} />
          <FlowViz locale={locale} steps={h.how.steps} v={viz} />
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="split" style={{ alignItems: "center" }}>
            <div className="gap">
              <span className="label">{h.console.label}</span>
              <h2 className="serif" style={{ fontSize: "var(--s-2xl)", lineHeight: 1.05 }}><Split text={h.console.title} /></h2>
              <p className="dim" style={{ maxWidth: "52ch" }}>{h.console.text}</p>
              <ul className="ticks">{h.console.items.map((i: string) => <li key={i}>{i}</li>)}</ul>
            </div>
            <div className="console" role="figure" aria-label={cn.title}>
              <div className="ch"><span><i />{cn.title}</span><span>{ui.example}</span></div>
              <div className="cb">
                <div className="q"><span className="who">{cn.queryLabel}</span><Typed className="txt" text={cn.query} /></div>
                <div className="ans">
                  <p><Md text={cn.answer.replace("{total}", moneyCompact(locale, demo.total))} /></p>
                  <div className="tbl-w"><table className="tbl">
                    <thead><tr>{cn.headers.map((x: string, i: number) => <th key={x} className={i === 1 || i === 2 ? "r" : undefined}>{x}</th>)}</tr></thead>
                    <tbody>
                      {cn.rows.map((r: string[], i: number) => (
                        <tr key={i}><td>{viz.branches[i]}</td><td className="r">{moneyCompact(locale, demo.branches[i])}</td><td className="r">{r[1]}</td><td>{r[2]}</td><td><span className={sevClass[r[4]]}>{r[3]}</span></td></tr>
                      ))}
                    </tbody>
                  </table></div>
                  <div className="src">{cn.sources.map((s: string) => <span key={s}>{s}</span>)}</div>
                </div>
                <div className="q"><span className="who">{cn.agentLabel}</span><span className="txt dim">{cn.agent}</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec paper">
        <div className="wrap">
          <SecHead label={h.roles.label} title={h.roles.title} text={<Md text={h.roles.text} />} />
          <Tabs tabs={h.roles.tabs.map((tab: Tab) => ({
            label: tab.tab,
            panel: (<>
              <p className="big-quote">“{tab.quote}”</p>
              <div className="qa">{tab.qa.map(([q, a]: string[]) => <div key={q}><span className="qq">{q}</span><span className="aa"><Md text={a} /></span></div>)}</div>
            </>),
          }))} />
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <SecHead label={h.sectors.label} title={h.sectors.title} text={h.sectors.text} />
          <div className="cells c3">
            {h.sectors.cells.map((c: Cell) => (
              <Link className="cell" href={c.href ?? "/solutions"} key={c.k}><span className="k">{c.k}</span><h3 className="h4">{c.h}</h3><p>{c.p}</p><span className="more">{h.sectors.more} →</span></Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <SecHead label={h.process.label} title={h.process.title} text={h.process.text} />
          <div className="phases" data-hx="">
            {h.process.phases.map((p: Phase) => (
              <div className="phase" key={p.title}><span className="dur">{p.dur}</span><h3>{p.title}</h3><p>{p.text}</p><div className="out"><b>{h.process.outcome}</b>{p.out}</div></div>
            ))}
          </div>
          <div className="mt-m"><Link className="btn btn-g" href="/approach">{h.process.cta} <Arrow /></Link></div>
        </div>
      </section>

      <section className="sec" data-scrub="">
        <div className="gridlines" />
        <div className="wrap parent-band" style={{ position: "relative" }}>
          <div className="gap">
            <span className="label">{h.parent.label}</span>
            <h2 className="serif" style={{ fontSize: "var(--s-2xl)", lineHeight: 1.05 }}><Split text={h.parent.title} /></h2>
            <p className="dim" style={{ maxWidth: "58ch" }}>{h.parent.text}</p>
            <div className="row mt-s">
              <Link className="btn btn-g" href="/aisolution">{h.parent.cta}</Link>
              <a className="btn btn-p" href={parentCompany.url} target="_blank" rel="noopener">{h.parent.ext} <span className="ar" aria-hidden="true">↗</span></a>
            </div>
          </div>
          <ul className="ticks">{h.parent.items.map((i: string) => <li key={i}>{i}</li>)}</ul>
        </div>
      </section>

      <section className="sec paper">
        <div className="wrap split">
          <div className="gap">
            <span className="label">{h.security.label}</span>
            <h2 className="serif" style={{ fontSize: "var(--s-2xl)", lineHeight: 1.05 }}><Split text={h.security.title} /></h2>
            <p className="dim" style={{ maxWidth: "52ch" }}>{h.security.text}</p>
            <Link className="btn btn-g" href="/security" style={{ justifySelf: "start" }}>{h.security.cta} <Arrow /></Link>
          </div>
          <ul className="ticks" data-scene="checklist" style={{ alignSelf: "center" }}>{h.security.items.map((i: string) => <li key={i}>{i}</li>)}</ul>
        </div>
      </section>

      <Band title={h.band.title} text={h.band.text} seed={19}>
        <Link className="btn btn-p" href="/contact">{h.band.cta1} <Arrow /></Link>
        <Link className="btn btn-g" href="/faq">{nav.faq}</Link>
      </Band>
      <PageMotion />
    </>
  );
}
