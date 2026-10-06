import { setRequestLocale } from "next-intl/server";
import { PageMotion } from "@/components/PageMotion";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import type { FaqGroup } from "@/lib/types";
import { SubHero, Band, Arrow } from "@/components/Hero";
import { Split } from "@/components/Split";
import { Md } from "@/components/Md";
import { JsonLd } from "@/components/JsonLd";

type P = { params: Promise<{ locale: Locale }> };
export async function generateMetadata({ params }: P) { const { locale } = await params; return pageMetadata(locale, "faq", "/faq"); }

const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*?([^*]+)\*\*?/g, "$1");

export default async function Page({ params }: P) {
  const { locale } = await params;
  setRequestLocale(locale);
  const d = await content(locale, "faq");
  const ui = await content(locale, "ui");
  const schema = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: d.groups.flatMap((g: FaqGroup) => g.items.map(([q, a]: string[]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: plain(a) } }))),
  };
  return (
    <>
      <SubHero crumbHome={ui.breadcrumbHome} crumb={d.crumb} title={d.title} lede={d.lede} seed={53} />
      <section className="sec">
        <div className="wrap faq-layout">
          <nav className="faq-nav" aria-label={d.navLabel}>{d.groups.map((g: FaqGroup) => <a key={g.id} href={`#g-${g.id}`}>{g.title}</a>)}</nav>
          <div>
            {d.groups.map((g: FaqGroup, gi: number) => (
              <div className="faq-group" id={`g-${g.id}`} key={g.id}>
                <h2><Split text={g.title} /></h2>
                <div className="faq">
                  {g.items.map(([q, a]: string[], i: number) => (
                    <details key={q} open={gi === 0 && i === 0}><summary>{q}</summary><div className="a"><p><Md text={a} /></p></div></details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Band title={d.band.title} text={d.band.text} seed={59}>
        <Link className="btn btn-p" href="/contact">{d.band.cta1} <Arrow /></Link>
      </Band>
      <JsonLd data={schema} />
      <PageMotion />
    </>
  );
}
