"use client";
import { useId, useState, type ReactNode } from "react";

export function Tabs({ tabs }: { tabs: { label: string; panel: ReactNode }[] }) {
  const [i, setI] = useState(0);
  const id = useId();
  return (
    <div>
      <div className="tabs" role="tablist">
        {tabs.map((t, k) => (
          <button key={k} role="tab" id={`${id}-t${k}`} aria-controls={`${id}-p${k}`} aria-selected={i === k} type="button" onClick={() => setI(k)}>{t.label}</button>
        ))}
      </div>
      {tabs.map((t, k) => (
        <div key={k} role="tabpanel" id={`${id}-p${k}`} aria-labelledby={`${id}-t${k}`} className="tabpanel" hidden={i !== k}>{t.panel}</div>
      ))}
    </div>
  );
}
