"use client";
import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion/state";
import { initPageMotion } from "@/lib/motion/page";

/** Fired just before a client navigation (PageTransition) so pinned scenes are unwrapped while the page still exists. */
export const LEAVE_EVENT = "bg:leave";

/**
 * Rendered at the end of every page so its effect runs only after the page subtree has hydrated
 * (layout effects can run earlier, and touching page DOM then breaks hydration).
 * Pins wrap sections in .pin-spacer, and React would fail to remove those sections on navigation,
 * so the motion is reverted before the route changes, not only on unmount.
 */
export function PageMotion() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const main = document.getElementById("main");
    if (!main) return;
    const path = location.pathname;
    let cleanup: (() => void) | undefined;
    let stopped = false;
    const raf = requestAnimationFrame(() => { if (!stopped) cleanup = initPageMotion(main); });
    const stop = () => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(raf);
      cleanup?.();
    };
    const onPop = () => { if (location.pathname !== path) stop(); };
    window.addEventListener(LEAVE_EVENT, stop);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener(LEAVE_EVENT, stop);
      window.removeEventListener("popstate", onPop);
      stop();
    };
  }, []);
  return null;
}
