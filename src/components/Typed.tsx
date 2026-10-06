"use client";
import { useEffect, useRef, useState } from "react";

/** Types its text when scrolled into view; full text is rendered on the server and for reduced motion. */
export function Typed({ text, className }: { text: string; className?: string }) {
  const [n, setN] = useState(text.length);
  const [caret, setCaret] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < innerHeight) return;
    setN(0);
    let iv: ReturnType<typeof setInterval> | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setCaret(true);
      const per = Math.max(12, Math.min(28, 2200 / text.length));
      iv = setInterval(() => setN((v) => {
        if (v + 1 >= text.length) { clearInterval(iv); setCaret(false); return text.length; }
        return v + 1;
      }), per);
    }, { rootMargin: "0px 0px -25% 0px" });
    io.observe(el);
    return () => { io.disconnect(); clearInterval(iv); };
  }, [text]);
  return (
    <span ref={ref} className={`${className ?? ""}${caret ? " caret" : ""}`} aria-label={text}>
      <span aria-hidden="true">{text.slice(0, n)}</span>
    </span>
  );
}
