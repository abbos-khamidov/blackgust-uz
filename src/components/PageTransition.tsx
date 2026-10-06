"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { prefersReducedMotion } from "@/lib/motion/state";
import { LEAVE_EVENT } from "./PageMotion";

const COVER_MS = 560;

/**
 * Exit half of the page transition: an internal link click closes lapis-ruled bars over the page and
 * names the destination, then navigates. The entry half is the CSS shutter in [locale]/template.tsx.
 * Without JS (or with reduced motion) links behave normally.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");

  // the new page has mounted (its shutter is on top): drop the cover instantly
  useEffect(() => { ref.current?.classList.remove("on"); }, [pathname]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let timer = 0, safety = 0;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      if (/^\/(api|og)(\/|$)/.test(url.pathname) || /\.\w+$/.test(url.pathname)) return;
      e.preventDefault();
      const text = (a.getAttribute("aria-label") || a.textContent || "").replace(/[→↗▾]/g, "").trim();
      setLabel(text.length > 42 ? "" : text);
      ref.current?.classList.add("on");
      window.clearTimeout(timer);
      window.clearTimeout(safety);
      timer = window.setTimeout(() => {
        window.dispatchEvent(new Event(LEAVE_EVENT)); // unwrap pinned scenes under the cover
        router.push(url.pathname + url.search + url.hash);
      }, COVER_MS);
      safety = window.setTimeout(() => ref.current?.classList.remove("on"), 5000);
    };
    window.addEventListener("click", onClick, true);
    return () => { window.removeEventListener("click", onClick, true); window.clearTimeout(timer); window.clearTimeout(safety); };
  }, [router]);

  return (
    <div className="ptx" ref={ref} aria-hidden="true">
      <div className="ptx-bars"><i /><i /><i /><i /><i /><i /></div>
      <div className="ptx-l"><span>BlackGust</span><b>{label}</b></div>
    </div>
  );
}
