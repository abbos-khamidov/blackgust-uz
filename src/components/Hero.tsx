import type { ReactNode } from "react";
import { GustCanvas } from "./GustCanvas";
import { GlobeCanvas } from "./GlobeCanvas";
import { Split } from "./Split";
import { Link } from "@/i18n/navigation";
import type { GustOptions } from "@/lib/motion/gust";

/** Inner-page hero: breadcrumb, split headline, lede, wind field behind. */
export function SubHero({ crumbHome, crumb, title, lede, seed }: { crumbHome: string; crumb: string; title: string; lede: ReactNode; seed: number }) {
  const opts: GustOptions = { density: 1300, seed, warm: 80 };
  return (
    <section className="hero hero-sub">
      <GustCanvas options={opts} />
      <div className="floor" aria-hidden="true" />
      <GlobeCanvas options={{ variant: "sub", seed }} />
      <div className="veil" />
      <div className="wrap">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">{crumbHome}</Link><span>/</span><span aria-current="page">{crumb}</span>
        </nav>
        <div className="hero-grid">
          <h1><Split text={title} /></h1>
          <p className="lede">{lede}</p>
        </div>
      </div>
    </section>
  );
}

export function Band({ title, text, children, seed }: { title: string; text: ReactNode; children: ReactNode; seed: number }) {
  return (
    <section className="band">
      <GustCanvas options={{ density: 1400, lapis: 0.14, seed, warm: 90 }} />
      <div className="veil" style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(7,8,10,.95) 30%,rgba(7,8,10,.4))" }} />
      <div className="wrap">
        <h2><Split text={title} /></h2>
        <div className="gap">
          <p className="dim">{text}</p>
          <div className="row">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function SecHead({ label, title, text }: { label: string; title: string; text?: ReactNode }) {
  return (
    <div className="sec-head">
      <span className="label">{label}</span>
      <div>
        <h2><Split text={title} /></h2>
        {text ? <p>{text}</p> : null}
      </div>
    </div>
  );
}

export const Arrow = () => <span className="ar" aria-hidden="true">→</span>;
