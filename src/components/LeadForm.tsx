"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Script from "next/script";

export type FormText = {
  name: string; role: string; org: string; sector: string; interest: string; phone: string; email: string; msg: string;
  msgPh: string; select: string; sectors: string[]; interests: string[]; submit: string; sending: string; consent: string;
  okTitle: string; okText: string; errRequired: string; errEmail: string; errRate: string; errServer: string;
};

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function LeadForm({ f, locale }: { f: FormText; locale: string }) {
  const started = useRef(0);
  useEffect(() => { started.current = Date.now(); }, []);
  const [state, setState] = useState<"idle" | "sending" | "ok">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    const payload = {
      name: get("name"), role: get("role"), org: get("org"), sector: get("sector"), interest: get("interest"),
      phone: get("phone"), email: get("email"), msg: get("msg"),
      website: get("website"), // honeypot
      elapsed: Date.now() - started.current,
      turnstile: get("cf-turnstile-response"),
      locale, page: typeof location !== "undefined" ? location.pathname : "",
    };
    if (!payload.name || (!payload.phone && !payload.email)) return setError(f.errRequired);
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return setError(f.errEmail);
    setState("sending");
    try {
      const res = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.status === 429) { setState("idle"); return setError(f.errRate); }
      if (!res.ok) { setState("idle"); return setError(f.errServer); }
      setState("ok");
    } catch {
      setState("idle");
      setError(f.errServer);
    }
  }

  if (state === "ok") {
    return (
      <div className="form-ok" role="status">
        <b>{f.okTitle}</b>
        <p className="dim">{f.okText}</p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div className="two">
        <div className="field"><label htmlFor="f-name">{f.name}</label><input id="f-name" name="name" autoComplete="name" required maxLength={120} /></div>
        <div className="field"><label htmlFor="f-role">{f.role}</label><input id="f-role" name="role" autoComplete="organization-title" maxLength={120} /></div>
      </div>
      <div className="two">
        <div className="field"><label htmlFor="f-org">{f.org}</label><input id="f-org" name="org" autoComplete="organization" maxLength={160} /></div>
        <div className="field"><label htmlFor="f-sector">{f.sector}</label>
          <select id="f-sector" name="sector" defaultValue=""><option value="">{f.select}</option>{f.sectors.map((s) => <option key={s}>{s}</option>)}</select></div>
      </div>
      <div className="field"><label htmlFor="f-interest">{f.interest}</label>
        <select id="f-interest" name="interest" defaultValue=""><option value="">{f.select}</option>{f.interests.map((s) => <option key={s}>{s}</option>)}</select></div>
      <div className="two">
        <div className="field"><label htmlFor="f-phone">{f.phone}</label><input id="f-phone" name="phone" type="tel" autoComplete="tel" placeholder="+" maxLength={40} /></div>
        <div className="field"><label htmlFor="f-email">{f.email}</label><input id="f-email" name="email" type="email" autoComplete="email" maxLength={160} /></div>
      </div>
      <div className="field"><label htmlFor="f-msg">{f.msg}</label><textarea id="f-msg" name="msg" placeholder={f.msgPh} maxLength={4000} /></div>
      <div className="hp" aria-hidden="true"><label htmlFor="f-website">Website</label><input id="f-website" name="website" tabIndex={-1} autoComplete="off" /></div>
      {SITE_KEY ? (<><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer /><div className="cf-turnstile" data-sitekey={SITE_KEY} data-theme="dark" /></>) : null}
      {error ? <div className="form-err" role="alert">{error}</div> : null}
      <div className="row" style={{ alignItems: "center" }}>
        <button className="btn btn-p" type="submit" disabled={state === "sending"}>{state === "sending" ? f.sending : f.submit} <span className="ar">→</span></button>
        <span className="note">{f.consent}</span>
      </div>
    </form>
  );
}
