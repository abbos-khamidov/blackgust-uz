"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { motionState, prefersReducedMotion } from "@/lib/motion/state";

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

/** Global smooth scroll, header hide/show, scroll reset on navigation. Page choreography lives in <PageMotion/>. */
export function MotionRoot() {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("motion");
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    const top = document.getElementById("top");
    let hidden = false;
    const prog = top?.querySelector<HTMLElement>(".prog");
    lenis.on("scroll", (e: Lenis) => {
      ScrollTrigger.update();
      if (prog) prog.style.transform = `scaleX(${e.progress || 0})`;
      const v = e.velocity || 0;
      motionState.velocity = v;
      motionState.direction = e.direction < 0 ? -1 : 1;
      motionState.boost = Math.min(1.4, Math.abs(v) / 40);
      const h = e.scroll > 240 && e.direction > 0 && !document.querySelector(".drawer.open");
      if (top && h !== hidden) {
        hidden = h;
        gsap.to(top, { yPercent: h ? -110 : 0, duration: 0.45, ease: "power3.out" });
      }
    });
    const tick = (time: number) => {
      lenis?.raf(time * 1000);
      motionState.boost *= 0.94;
      motionState.velocity *= 0.9;
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onLock = (e: Event) => ((e as CustomEvent).detail ? lenis?.stop() : lenis?.start());
    window.addEventListener("bg:lock", onLock);

    // in-page anchors through Lenis
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href*="#"]') as HTMLAnchorElement | null;
      if (!a || !lenis) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -90 });
      history.replaceState(null, "", url.hash);
    };
    document.addEventListener("click", onClick);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("bg:lock", onLock);
      document.removeEventListener("click", onClick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  useEffect(() => {
    if (!location.hash) lenis?.scrollTo(0, { immediate: true });
    const top = document.getElementById("top");
    if (top) gsap.set(top, { yPercent: 0 });
  }, [pathname]);

  return null;
}
