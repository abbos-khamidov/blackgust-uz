"use client";
import { useEffect, useRef, useState } from "react";

/** Counts integers up when scrolled into view. Non-numeric values (e.g. "24/7", "<1 h") render as-is. */
export function Counter({ value }: { value: string }) {
  const m = value.match(/^(\D*)(\d+)(\D*)$/);
  const target = m ? Number(m[2]) : NaN;
  const animate = !!m && target < 1900;
  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!animate || !ref.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (ref.current.getBoundingClientRect().top < innerHeight) return;
    setShown(`${m![1]}0${m![3]}`);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / 1800);
        const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
        setShown(`${m![1]}${v}${m![3]}`);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { rootMargin: "0px 0px -10% 0px" });
    io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <b ref={ref}>{shown}</b>;
}
