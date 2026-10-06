"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createFlow } from "@/lib/motion/flow";
import { prefersReducedMotion } from "@/lib/motion/state";
import { moneyCompact, numberTag } from "@/lib/format";
import { demo } from "@/config/site";
import type { Locale } from "@/i18n/routing";

export type VizText = {
  aria: string; hud: string; sources: string; objects: string; links: string; agentsLabel: string;
  titles: string[]; captions: string[]; branches: string[]; entities: string[]; agents: string[];
  cards: {
    erp: string; erpRows: string[]; crm: string; crmCols: string[]; excel: string; tg: string; tgMsgs: string[];
    cam: string; camNote: string; scan: string; scanTitle: string; phone: string; mail: string; mailRows: string[][];
  };
  answer: { head: string; sev: string; sub: string; src: string; act: string };
};
type Step = { tag: string; title: string; text: string };

/** "How it works" — sticky live model driven by the steps' scroll progress. */
export function FlowViz({ locale, steps, v }: { locale: Locale; steps: Step[]; v: VizText }) {
  const secRef = useRef<HTMLDivElement>(null);
  const nf = new Intl.NumberFormat(numberTag(locale));
  const branchMax = demo.branches[0];

  useEffect(() => {
    const sec = secRef.current;
    if (!sec) return;
    const flow = createFlow(sec, {
      titles: v.titles, captions: v.captions, entities: v.entities, agents: v.agents,
      num: (n: number) => nf.format(n), money: (n: number) => moneyCompact(locale, n), total: demo.total,
    });
    if (!flow) return;
    if (prefersReducedMotion()) { flow.render(1, 0, true); return () => flow.destroy(); }
    gsap.registerPlugin(ScrollTrigger);
    sec.classList.add("flow-js");
    const stepsEl = sec.querySelector(".flow-steps");
    let running = false;
    const st1 = ScrollTrigger.create({ trigger: stepsEl, start: "top 60%", end: "bottom 60%", scrub: true, onUpdate: (s) => { flow.progress = s.progress; } });
    const st2 = ScrollTrigger.create({ trigger: sec, start: "top bottom", end: "bottom top", onToggle: (s) => { running = s.isActive; } });
    const tick = (t: number) => { if (running) flow.render(flow.progress, t, false); };
    gsap.ticker.add(tick);
    flow.render(0, 0, false);
    return () => { gsap.ticker.remove(tick); st1.kill(); st2.kill(); flow.destroy(); sec.classList.remove("flow-js"); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const c = v.cards;
  return (
    <div className="flow-grid" ref={secRef} id="how-grid">
      <div className="flow-steps">
        {steps.map((s, i) => (
          <article key={i} className={`fstep${i === 0 ? " on" : ""}`}>
            <span className="mono">{s.tag}</span>
            <h3 className="h3">{s.title}</h3>
            <p>{s.text}</p>
          </article>
        ))}
      </div>
      <div className="flow-stage"><div className="flow-sticky">
        <div className="viz" role="img" aria-label={v.aria}>
          <canvas className="viz-cv" aria-hidden="true" />
          <div className="viz-cards" aria-hidden="true">
            <div className="vc" data-x="19" data-y="21" data-z=".6"><div className="vc-h"><i />{c.erp}</div><div className="vc-b vc-tbl">
              {c.erpRows.map((r, i) => [<span key={`a${i}`}>{r}</span>, <b key={`b${i}`}>{nf.format(demo.branches[i] / 1000)}</b>])}
            </div></div>
            <div className="vc" data-x="51" data-y="17" data-z=".1"><div className="vc-h"><i />{c.crm}</div><div className="vc-b vc-kan">
              <span><em>{c.crmCols[0]}</em><i /><i /><i /></span><span><em>{c.crmCols[1]}</em><i /><i /></span><span><em>{c.crmCols[2]}</em><i className="hot" /></span>
            </div></div>
            <div className="vc" data-x="82" data-y="23" data-z=".8"><div className="vc-h"><i />{c.excel}</div><div className="vc-b vc-xls">{Array.from({ length: 15 }, (_, i) => <i key={i} />)}</div></div>
            <div className="vc" data-x="13" data-y="50" data-z=".3"><div className="vc-h"><i />{c.tg}</div><div className="vc-b vc-tg">
              <span className="in">{c.tgMsgs[0]}</span><span className="out">{c.tgMsgs[1]}</span><span className="in">{c.tgMsgs[2]}</span>
            </div></div>
            <div className="vc" data-x="87" data-y="52" data-z=".2"><div className="vc-h"><i />{c.cam}</div><div className="vc-b vc-cam">
              <span className="rec">● REC</span><i className="bb" style={{ left: "14%", top: "26%", width: "24%", height: "56%" }} /><i className="bb" style={{ left: "56%", top: "20%", width: "20%", height: "62%" }} /><em>{c.camNote}</em>
            </div></div>
            <div className="vc" data-x="19" data-y="80" data-z=".7"><div className="vc-h"><i />{c.scan}</div><div className="vc-b vc-doc"><b>{c.scanTitle}</b><i /><i /><i style={{ width: "62%" }} /><i className="st" /></div></div>
            <div className="vc" data-x="51" data-y="84" data-z=".4"><div className="vc-h"><i />{c.phone}</div><div className="vc-b vc-wave">
              {Array.from({ length: 18 }, (_, i) => <i key={i} style={{ ["--d" as string]: `${(i * 0.07).toFixed(2)}s` }} />)}
            </div></div>
            <div className="vc" data-x="82" data-y="79" data-z=".9"><div className="vc-h"><i />{c.mail}</div><div className="vc-b vc-mail">
              {c.mailRows.map((r, i) => <span key={i}><b>{r[0]}</b>{r[1]}</span>)}
            </div></div>
          </div>
          <div className="viz-hud" aria-hidden="true">
            <div className="hud-tl"><i />{v.hud}</div>
            <div className="hud-tr"><span>{v.sources} <b>8</b></span><span>{v.objects} <b id="hO">0</b></span><span>{v.links} <b id="hL">0</b></span><span>{v.agentsLabel} <b id="hA">0</b></span></div>
            <div className="hud-c" id="hC">{v.captions[0]}</div>
            <div className="hud-br">41.2995° N · 69.2401° E · TAS</div>
            <i className="hud-k k1" /><i className="hud-k k2" /><i className="hud-k k3" /><i className="hud-k k4" />
          </div>
          <div className="viz-ans">
            <div className="va-h"><span>{v.answer.head}</span><span className="sev c">{v.answer.sev}</span></div>
            <div className="va-big"><b id="vaNum">{moneyCompact(locale, demo.total)}</b> <span>{v.answer.sub}</span></div>
            <div className="va-bars">
              {demo.branches.map((b, i) => (
                <div className="vb" key={i}><span>{v.branches[i]}</span><i data-v={(b / branchMax).toFixed(3)} className={i === 0 ? "top" : undefined} /><em>{moneyCompact(locale, b)}</em></div>
              ))}
            </div>
            <div className="va-f"><span>{v.answer.src}</span><span className="va-act"><i />{v.answer.act}</span></div>
          </div>
        </div>
        <div className="flow-meta mono"><span id="flowLbl">01 / 04 · {v.titles[0]}</span><span className="flow-bar"><i id="flowBar" /></span></div>
      </div></div>
    </div>
  );
}
