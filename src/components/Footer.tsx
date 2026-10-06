import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { contacts, parentCompany } from "@/config/site";
import { localeNames, routing } from "@/i18n/routing";
import { Logo } from "./Icons";
import { Md } from "./Md";

export async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "footer" });
  const ui = await getTranslations({ locale, namespace: "ui" });
  const year = new Date().getFullYear();
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="fg">
          <div>
            <Link className="brand" href="/"><Logo />BlackGust</Link>
            <p className="mt-m dim" style={{ maxWidth: "36ch" }}>{t("tagline")}</p>
            <p className="mt-m built" style={{ maxWidth: "40ch", fontSize: ".88rem" }}><Md text={t("built")} /></p>
          </div>
          <div><h5>{t("platformH")}</h5><ul>
            <li><Link href="/platform">{t("architecture")}</Link></li>
            <li><Link href="/platform#modules">{t("modules")}</Link></li>
            <li><Link href="/platform#deploy">{t("deployment")}</Link></li>
            <li><Link href="/security">{t("security")}</Link></li>
          </ul></div>
          <div><h5>{t("workH")}</h5><ul>
            <li><Link href="/approach">{t("approach")}</Link></li>
            <li><Link href="/solutions">{t("solutions")}</Link></li>
            <li><Link href="/government">{t("government")}</Link></li>
            <li><Link href="/pricing">{t("pricing")}</Link></li>
          </ul></div>
          <div><h5>{t("companyH")}</h5><ul>
            <li><Link href="/company">{t("about")}</Link></li>
            <li><Link href="/company#careers">{t("careers")}</Link></li>
            <li><Link href="/faq">{t("faq")}</Link></li>
            <li><Link href="/aisolution">{t("aisolution")}</Link></li>
          </ul></div>
        </div>
        <div className="fg mt-l" style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(0,3fr)" }}>
          <div><h5>{t("contactH")}</h5><ul>
            <li><a href={`mailto:${contacts.email}`}>{contacts.email}</a></li>
            <li><a href={`https://wa.me/${contacts.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener">WhatsApp {contacts.whatsappDisplay}</a></li>
            <li className="dim">{contacts.address.street}, {contacts.address.city}</li>
          </ul></div>
          <div><h5>{ui("language")}</h5><ul style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
            {routing.locales.map((l) => <li key={l}><Link href="/" locale={l} hrefLang={l} aria-current={l === locale ? "true" : undefined}>{localeNames[l]}</Link></li>)}
          </ul></div>
        </div>
        <div className="word" aria-hidden="true">BlackGust</div>
        <div className="legal">
          <span>{t("legal", { year })}</span>
          <span><a href={parentCompany.url} target="_blank" rel="noopener">aisolution.uz</a> · blackgust.com</span>
          <span>{t("hours")}</span>
        </div>
      </div>
    </footer>
  );
}
