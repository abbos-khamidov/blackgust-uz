"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion/state";

/** Brass follower ring for fine pointers. Grows over interactive elements, shows a label over [data-cursor]. */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia("(pointer:fine)").matches) return;
    const r = ring.current, d = dot.current;
    if (!r || !d) return;
    document.documentElement.classList.add("has-cursor");
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      d.style.transform = `translate3d(${x}px,${y}px,0)`;
      const el = (e.target as HTMLElement).closest?.("a,button,summary,[role=tab],input,select,textarea,.globe-cv,.tier,.cells>*");
      r.classList.toggle("on", !!el && !el.matches(".globe-cv,.tier,.cells>*"));
      r.classList.toggle("soft", !!el && el.matches(".tier,.cells>*"));
      r.classList.toggle("drag", !!el && el.matches(".globe-cv"));
    };
    const down = () => r.classList.add("press");
    const up = () => r.classList.remove("press");
    const leave = () => { x = y = -100; };
    const tick = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      r.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);
  return (
    <>
      <div ref={ring} className="cur-ring" aria-hidden="true" />
      <div ref={dot} className="cur-dot" aria-hidden="true" />
    </>
  );
}
