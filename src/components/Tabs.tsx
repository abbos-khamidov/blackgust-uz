"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export function Tabs({ tabs }: { tabs: { label: string; panel: ReactNode }[] }) {
  const [i, setI] = useState(0);
  const id = useId();
  const list = useRef<HTMLDivElement>(null);

  // lapis indicator glides to the selected tab (positioned after mount, so SSR markup stays identical)
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const place = () => {
      const b = el.querySelectorAll<HTMLElement>("[role=tab]")[i];
      if (!b) return;
      el.style.setProperty("--tx", `${b.offsetLeft}px`);
      el.style.setProperty("--ty", `${b.offsetTop + b.offsetHeight - 1.5}px`);
      el.style.setProperty("--tw", `${b.offsetWidth - parseFloat(getComputedStyle(b).paddingRight)}px`);
      el.classList.add("has-ind");
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [i]);

  return (
    <div>
      <div className="tabs" role="tablist" ref={list}>
        {tabs.map((t, k) => (
          <button key={k} role="tab" id={`${id}-t${k}`} aria-controls={`${id}-p${k}`} aria-selected={i === k} type="button" onClick={() => setI(k)}>{t.label}</button>
        ))}
        <span className="tab-ind" aria-hidden="true" />
      </div>
      {tabs.map((t, k) => (
        <div key={k} role="tabpanel" id={`${id}-p${k}`} aria-labelledby={`${id}-t${k}`} className="tabpanel" hidden={i !== k}>{t.panel}</div>
      ))}
    </div>
  );
}
