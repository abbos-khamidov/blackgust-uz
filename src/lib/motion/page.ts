import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motionState } from "./state";

/**
 * Scroll choreography for one page. Everything runs inside a gsap.context so a route change
 * reverts inline styles and kills every ScrollTrigger it created.
 * Content is fully visible without JS; only elements below the fold are pre-hidden.
 */
export function initPageMotion(root: HTMLElement): () => void {
  gsap.registerPlugin(ScrollTrigger);
  const vh = () => window.innerHeight;
  const below = (el: Element) => el.getBoundingClientRect().top > vh() * 0.92;
  const desk = window.matchMedia("(min-width: 900px)").matches;
  const fine = window.matchMedia("(pointer:fine)").matches;
  const cleanups: (() => void)[] = [];
  // first full load: the CSS intro covers the page for ~1.6s, so the hero sequence waits for it
  const w = window as unknown as { __bgIntro?: boolean };
  const introDelay = !w.__bgIntro && !document.documentElement.classList.contains("no-intro") ? 1.55 : 0.25;
  w.__bgIntro = true;

  const ctx = gsap.context(() => {
    /* hero: load sequence + parallax */
    const hero = root.querySelector<HTMLElement>(".hero");
    if (hero) {
      const cv = hero.querySelector("canvas");
      const wrap = hero.querySelector(".wrap");
      const words = hero.querySelectorAll("h1 .wi");
      const tl = gsap.timeline({ defaults: { ease: "expo.out" }, delay: introDelay });
      const globe = hero.querySelector(".globe-cv");
      if (cv) tl.from(cv, { opacity: 0, scale: 1.06, duration: 1.6, ease: "power2.out" }, 0);
      if (globe) {
        tl.from(globe, { opacity: 0, scale: 0.82, rotate: -6, duration: 2.2, ease: "expo.out", transformOrigin: "70% 50%" }, 0);
        gsap.to(globe, { yPercent: 14, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      }
      const floor = hero.querySelector(".floor");
      if (floor) tl.from(floor, { opacity: 0, yPercent: 30, duration: 1.8, ease: "power3.out" }, 0.1);
      tl.from(words, { yPercent: 115, rotate: 3, duration: 1.15, stagger: 0.045 }, 0.1)
        .from(hero.querySelectorAll(".badge,.crumb"), { y: 12, opacity: 0, duration: 0.8 }, 0.05)
        .from(hero.querySelectorAll(".lede"), { y: 24, opacity: 0, duration: 1 }, 0.35)
        .from(hero.querySelectorAll(".row .btn"), { y: 18, opacity: 0, duration: 0.9, stagger: 0.08 }, 0.5)
        .from(hero.querySelectorAll(".meta li"), { y: 10, opacity: 0, duration: 0.7, stagger: 0.06 }, 0.65)
        .from(hero.querySelectorAll(".scroll-cue"), { opacity: 0, duration: 0.8 }, 1);
      gsap
        .timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } })
        .to(cv, { yPercent: 22, scale: 1.12, ease: "none" }, 0)
        .to(wrap, { yPercent: -18, opacity: 0.15, ease: "none" }, 0)
        .to(hero.querySelector(".veil"), { opacity: 1, ease: "none" }, 0);
    }

    /* headline masked word reveal (words are pre-split by <Split/>) */
    gsap.utils.toArray<HTMLElement>(".sec-head h2, .band h2, .sec h2.serif, .faq-group h2").forEach((h) => {
      if (!below(h)) return;
      const w = h.querySelectorAll(".wi");
      if (!w.length) return;
      gsap.from(w, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.035, scrollTrigger: { trigger: h, start: "top 88%" } });
    });
    gsap.utils.toArray<HTMLElement>(".sec-head p, .sec-head .label, .split > .gap > .label").forEach((p) => {
      if (!below(p)) return;
      gsap.from(p, { y: 20, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: p, start: "top 90%" } });
    });

    /* grids: staggered rise */
    gsap.utils.toArray<HTMLElement>(".cells, .rows, .ticks, .qa, .tiers, .faq, .facts, .phases, .tbl tbody, .channels").forEach((g) => {
      if (g.closest(".console") || g.closest(".viz")) return;
      const kids = Array.from(g.children).filter(below);
      if (!kids.length) return;
      gsap.set(kids, { y: 34, opacity: 0 });
      ScrollTrigger.create({
        trigger: g, start: "top 86%", once: true,
        onEnter: () => gsap.to(kids, { y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.07 }),
      });
    });

    /* paper sections: card expands to full bleed */
    gsap.utils.toArray<HTMLElement>(".sec.paper").forEach((s) => {
      gsap.fromTo(s, { clipPath: "inset(5% 3.5% 0% 3.5% round 18px)" }, {
        clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
        scrollTrigger: { trigger: s, start: "top bottom", end: "top 25%", scrub: true },
      });
      const w = s.querySelector(".wrap");
      if (w) gsap.fromTo(w, { y: 60 }, { y: 0, ease: "none", scrollTrigger: { trigger: s, start: "top bottom", end: "top 25%", scrub: true } });
    });

    /* depth parallax */
    gsap.utils.toArray<HTMLElement>(".gridlines").forEach((g) => {
      gsap.fromTo(g, { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: g.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
    gsap.utils.toArray<HTMLElement>(".band").forEach((b) => {
      const c = b.querySelector("canvas");
      if (c) gsap.fromTo(c, { yPercent: -14, scale: 1.15 }, { yPercent: 14, scale: 1.15, ease: "none", scrollTrigger: { trigger: b, start: "top bottom", end: "bottom top", scrub: true } });
    });

    /* phases: progress rail */
    gsap.utils.toArray<HTMLElement>(".phases").forEach((ph) => {
      if (ph.hasAttribute("data-hx") && window.matchMedia("(min-width: 1000px)").matches) return;
      const rail = document.createElement("i");
      rail.className = "rail";
      ph.appendChild(rail);
      cleanups.push(() => rail.remove());
      gsap.fromTo(rail, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: ph, start: "top 80%", end: "bottom 55%", scrub: 0.6 } });
      Array.from(ph.querySelectorAll(".phase")).forEach((p, i) => {
        ScrollTrigger.create({ trigger: ph, start: `top+=${i * 60} 70%`, onEnter: () => p.classList.add("lit"), onLeaveBack: () => p.classList.remove("lit") });
      });
    });

    /* console entrance */
    gsap.utils.toArray<HTMLElement>(".console").forEach((c) => {
      if (!below(c)) return;
      gsap.from(c, { y: 60, rotateX: 8, transformPerspective: 1200, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: c, start: "top 85%" } });
    });

    /* platform: exploded stack assembles */
    const stack = root.querySelector<HTMLElement>(".stack");
    if (stack && desk) {
      const layers = Array.from(stack.children);
      gsap.set(stack, { perspective: 1400 });
      gsap
        .timeline({ scrollTrigger: { trigger: stack, start: "top 85%", end: "center 45%", scrub: 0.8 } })
        .from(layers, {
          y: (i) => (i - layers.length / 2) * 46, rotateX: 28, z: (i) => -i * 40, opacity: 0.25,
          transformOrigin: "50% 100%", ease: "power2.out", stagger: 0.04,
        }, 0);
    }


    /* facts: underline draws in */
    gsap.utils.toArray<HTMLElement>(".facts").forEach((f) => {
      const kids = Array.from(f.children) as HTMLElement[];
      kids.forEach((k) => k.style.setProperty("--fx", "0"));
      ScrollTrigger.create({ trigger: f, start: "top 82%", once: true, onEnter: () => kids.forEach((k, i) => setTimeout(() => k.style.setProperty("--fx", "1"), i * 140)) });
      cleanups.push(() => kids.forEach((k) => k.style.removeProperty("--fx")));
    });

    /* process: pinned horizontal track */
    gsap.utils.toArray<HTMLElement>(".phases[data-hx]").forEach((ph) => {
      if (!window.matchMedia("(min-width: 1000px)").matches) return;
      const sec = ph.closest<HTMLElement>(".sec");
      const wrap = ph.parentElement;
      if (!sec || !wrap) return;
      ph.classList.add("hx");
      sec.classList.add("hx-sec");
      const items = Array.from(ph.querySelectorAll<HTMLElement>(".phase"));
      const count = document.createElement("div");
      count.className = "hx-count";
      count.innerHTML = `<b>01</b><span>/</span><span>${String(items.length).padStart(2, "0")}</span>`;
      wrap.insertBefore(count, ph);
      const cur = count.querySelector("b")!;
      cleanups.push(() => { count.remove(); ph.classList.remove("hx"); sec.classList.remove("hx-sec"); });
      const dist = () => Math.max(0, ph.scrollWidth - wrap.clientWidth + parseFloat(getComputedStyle(wrap).paddingRight) * 2);
      gsap.to(ph, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: sec, pin: true, start: () => (sec.offsetHeight > window.innerHeight ? "bottom bottom" : "center center"),
          end: () => `+=${dist() + window.innerHeight * 0.35}`, scrub: 0.7, invalidateOnRefresh: true,
          onUpdate: (st) => {
            const idx = Math.min(items.length - 1, Math.floor(st.progress * items.length * 0.999 + 0.25));
            items.forEach((it, i) => it.classList.toggle("lit", i <= idx));
            cur.textContent = String(idx + 1).padStart(2, "0");
          },
        },
      });
    });

    /* live signal feed: newest event slides in on top, clock in the header ticks */
    root.querySelectorAll<HTMLElement>(".signal-feed").forEach((feed) => {
      const tb = feed.querySelector("tbody");
      if (!tb) return;
      const orig = Array.from(tb.children) as HTMLElement[];
      const origT = orig.map((r) => r.children[0]?.textContent ?? "");
      feed.classList.add("live");
      const toMin = (s: string) => { const [h, m] = s.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
      const fmt = (n: number) => `${String(Math.floor(n / 60) % 24).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
      let clock = Math.max(...origT.map(toMin));
      let on = false, id = 0;
      const push = () => {
        const last = tb.lastElementChild as HTMLElement | null;
        if (!last) return;
        clock += 3 + Math.floor(Math.random() * 11);
        if (last.children[0]) last.children[0].textContent = fmt(clock);
        tb.querySelectorAll("tr.fresh").forEach((r) => r.classList.remove("fresh"));
        tb.prepend(last);
        last.classList.add("fresh");
        gsap.fromTo(last, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.7, ease: "expo.out" });
        gsap.fromTo(Array.from(tb.children).slice(1), { y: -14 }, { y: 0, duration: 0.6, ease: "power3.out", stagger: 0.02 });
      };
      const st = ScrollTrigger.create({
        trigger: feed, start: "top 90%", end: "bottom 10%",
        onToggle: (s) => {
          on = s.isActive;
          window.clearInterval(id);
          if (on) id = window.setInterval(push, 2600);
        },
      });
      cleanups.push(() => {
        window.clearInterval(id); st.kill();
        feed.classList.remove("live");
        orig.forEach((r, i) => { r.classList.remove("fresh"); if (r.children[0]) r.children[0].textContent = origT[i]; tb.appendChild(r); });
      });
    });

    /* marquee: speed and direction follow scroll velocity */
    const mq = root.querySelector<HTMLElement>(".marq .tr");
    if (mq) {
      mq.style.animation = "none";
      const tw = gsap.to(mq, { xPercent: -50, duration: 60, ease: "none", repeat: -1 });
      const tick = () => {
        const v = Math.abs(motionState.velocity);
        tw.timeScale(Math.min(8, 1 + v / 6) * (motionState.direction < 0 ? -1 : 1));
      };
      gsap.ticker.add(tick);
      cleanups.push(() => gsap.ticker.remove(tick));
    }

    /* footer wordmark fill */
    const word = document.querySelector<HTMLElement>(".foot .word");
    if (word) {
      gsap.fromTo(word, { backgroundSize: "0% 100%", yPercent: 30 }, {
        backgroundSize: "100% 100%", yPercent: 0, ease: "none",
        scrollTrigger: { trigger: word, start: "top bottom", end: "bottom bottom", scrub: true },
      });
    }
  }, root);

  /* magnetic buttons + cell spotlight (plain listeners) */
  if (fine) {
    root.querySelectorAll<HTMLElement>(".btn-p").forEach((b) => {
      const xT = gsap.quickTo(b, "x", { duration: 0.5, ease: "power3.out" });
      const yT = gsap.quickTo(b, "y", { duration: 0.5, ease: "power3.out" });
      const move = (e: PointerEvent) => {
        const r = b.getBoundingClientRect();
        xT((e.clientX - r.left - r.width / 2) * 0.22);
        yT((e.clientY - r.top - r.height / 2) * 0.3);
      };
      const leave = () => { xT(0); yT(0); };
      b.addEventListener("pointermove", move);
      b.addEventListener("pointerleave", leave);
      cleanups.push(() => { b.removeEventListener("pointermove", move); b.removeEventListener("pointerleave", leave); gsap.set(b, { x: 0, y: 0 }); });
    });
    root.querySelectorAll<HTMLElement>(".cells > *").forEach((c) => {
      const move = (e: PointerEvent) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty("--mx", `${e.clientX - r.left}px`);
        c.style.setProperty("--my", `${e.clientY - r.top}px`);
      };
      c.addEventListener("pointermove", move);
      cleanups.push(() => c.removeEventListener("pointermove", move));
    });
  }

  /* mono labels decode like a terminal when they enter */
  const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/<>#*+";
  root.querySelectorAll<HTMLElement>(".label, .sec .mono.brass, .phase .dur").forEach((el) => {
    if (el.children.length || el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    const final = el.textContent ?? "";
    if (!final.trim() || final.length > 60) return;
    el.classList.add("scr");
    let raf = 0;
    const run = () => {
      const t0 = performance.now(), dur = 700 + final.length * 12;
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const n = Math.floor(p * final.length);
        let out = final.slice(0, n);
        for (let i = n; i < final.length; i++) out += final[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        el.textContent = out;
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const st = ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: run });
    cleanups.push(() => { cancelAnimationFrame(raf); st.kill(); el.textContent = final; el.classList.remove("scr"); });
  });

  /* 3D tilt: pricing tiers, consoles, layers */
  if (fine) {
    root.querySelectorAll<HTMLElement>(".tier, .console, .layer, .channel").forEach((c) => {
      const isConsole = c.classList.contains("console");
      const amp = isConsole ? 4 : c.classList.contains("layer") ? 0 : 6;
      const rx = gsap.quickTo(c, "rotateX", { duration: 0.6, ease: "power3.out" });
      const ry = gsap.quickTo(c, "rotateY", { duration: 0.6, ease: "power3.out" });
      if (amp) gsap.set(c, { transformPerspective: 1000 });
      const move = (e: PointerEvent) => {
        const r = c.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        if (amp) { rx(-py * amp); ry(px * amp); }
        c.style.setProperty("--mx", `${e.clientX - r.left}px`);
        c.style.setProperty("--my", `${e.clientY - r.top}px`);
      };
      const leave = () => { rx(0); ry(0); };
      c.addEventListener("pointermove", move);
      c.addEventListener("pointerleave", leave);
      cleanups.push(() => { c.removeEventListener("pointermove", move); c.removeEventListener("pointerleave", leave); if (amp) gsap.set(c, { clearProps: "transform" }); });
    });
  }

  const refresh = () => ScrollTrigger.refresh();
  const t = window.setTimeout(refresh, 300);
  if (document.fonts?.ready) document.fonts.ready.then(refresh);

  return () => {
    window.clearTimeout(t);
    cleanups.forEach((f) => f());
    ctx.revert();
  };
}
