"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { localeNames, routing, type Locale } from "@/i18n/routing";
import { Logo } from "./Icons";
import { BrandMark } from "./BrandMark";

const NAV = ["platform", "approach", "solutions", "government", "security", "pricing", "company", "faq"] as const;

export function Header() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const [langAt, setLangAt] = useState<string | null>(null);
  // Menus close automatically on navigation: they are "open" only for the path they were opened on.
  const open = openAt === pathname;
  const langOpen = langAt === pathname;
  const setOpen = (v: boolean) => setOpenAt(v ? pathname : null);
  const setLangOpen = (v: boolean | ((x: boolean) => boolean)) => setLangAt((typeof v === "function" ? v(langOpen) : v) ? pathname : null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    window.dispatchEvent(new CustomEvent("bg:lock", { detail: open }));
  }, [open]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (langRef.current && !langRef.current.contains(e.target as Node)) setLangAt(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setLangAt(null); setOpenAt(null); } };
    document.addEventListener("click", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("click", close); document.removeEventListener("keydown", esc); };
  }, []);

  const active = (k: string) => pathname === `/${k}` || pathname.startsWith(`/${k}/`);

  return (
    <header id="top" className="top">
      <a className="skip" href="#main">{t("ui.skip")}</a>
      <i className="prog" aria-hidden="true" />
      <div className="wrap bar">
        <Link className="brand" href="/" aria-label="BlackGust"><Logo /><BrandMark /></Link>
        <nav className="pill" aria-label={t("ui.mainMenu")}>
          {NAV.map((k) => (
            <Link key={k} href={`/${k}`} aria-current={active(k) ? "page" : undefined}>{t(`nav.${k}`)}</Link>
          ))}
        </nav>
        <div className="right">
          <div className="lang" ref={langRef}>
            <button type="button" aria-expanded={langOpen} aria-haspopup="listbox" aria-label={t("ui.language")} onClick={() => setLangOpen((v) => !v)}>
              {locale.toUpperCase()} <span aria-hidden="true">▾</span>
            </button>
            {langOpen && (
              <ul role="listbox" aria-label={t("ui.language")}>
                {routing.locales.map((l) => (
                  <li key={l}>
                    <Link href={pathname} locale={l} hrefLang={l} aria-current={l === locale ? "true" : undefined}>
                      {localeNames[l]}<span>{l}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link className="cta-s" href="/contact">{t("ui.cta")} <span aria-hidden="true">→</span></Link>
          <button className="menu-btn" type="button" aria-expanded={open} aria-controls="drawer" onClick={() => setOpen(true)}>{t("ui.menu")}</button>
        </div>
      </div>
      <div className={`drawer${open ? " open" : ""}`} id="drawer" hidden={!open}>
        <div className="bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link className="brand" href="/"><Logo /><BrandMark /></Link>
          <button className="menu-btn" type="button" style={{ display: "inline-flex" }} onClick={() => setOpen(false)}>{t("ui.close")}</button>
        </div>
        <nav aria-label={t("ui.mobileMenu")}>
          <Link href="/">{t("nav.home")}<span>→</span></Link>
          {NAV.map((k) => (
            <Link key={k} href={`/${k}`}>{t(`nav.${k}`)}<span>{active(k) ? t("ui.youAreHere") : "→"}</span></Link>
          ))}
          <Link href="/contact">{t("nav.contact")}<span>→</span></Link>
        </nav>
        <div className="langs">
          {routing.locales.map((l) => (
            <Link key={l} href={pathname} locale={l} hrefLang={l} aria-current={l === locale ? "true" : undefined}>{localeNames[l]}</Link>
          ))}
        </div>
        <div className="mt-l"><Link className="btn btn-p" href="/contact">{t("ui.cta")} <span className="ar">→</span></Link></div>
      </div>
    </header>
  );
}
