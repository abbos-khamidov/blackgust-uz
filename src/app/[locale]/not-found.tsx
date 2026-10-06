import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("ui");
  return (
    <section className="sec" style={{ minHeight: "60vh", display: "grid", alignItems: "center" }}>
      <div className="wrap gap">
        <span className="label">404</span>
        <h1 className="serif" style={{ fontSize: "var(--s-2xl)", fontWeight: 300 }}>{t("notFoundTitle")}</h1>
        <p className="dim">{t("notFoundText")}</p>
        <Link className="btn btn-p" href="/" style={{ justifySelf: "start" }}>{t("backHome")}</Link>
      </div>
    </section>
  );
}
