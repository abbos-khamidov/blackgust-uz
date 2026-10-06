"use client";
import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion/state";
import { initPageMotion } from "@/lib/motion/page";

/**
 * Rendered at the end of every page so its effect runs only after the page subtree has hydrated
 * (layout effects can run earlier, and touching page DOM then breaks hydration).
 */
export function PageMotion() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const main = document.getElementById("main");
    if (!main) return;
    let cleanup: (() => void) | undefined;
    const raf = requestAnimationFrame(() => { cleanup = initPageMotion(main); });
    return () => { cancelAnimationFrame(raf); cleanup?.(); };
  }, []);
  return null;
}
