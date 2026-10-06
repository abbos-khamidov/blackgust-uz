import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { SITE_URL } from "@/config/site";

/**
 * Lead intake. Layers of protection: origin check, honeypot, minimum completion time,
 * per-IP rate limit, duplicate suppression, optional Cloudflare Turnstile.
 * Delivery: Telegram and/or email (Resend). Configure in .env (see .env.example).
 * NOTE: rate limit and dedup are in-memory — fine for one PM2 process; use Redis for several instances.
 */

const Lead = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().max(120).optional().default(""),
  org: z.string().trim().max(160).optional().default(""),
  sector: z.string().trim().max(80).optional().default(""),
  interest: z.string().trim().max(80).optional().default(""),
  phone: z.string().trim().max(40).regex(/^[+\d\s()\-.]*$/).optional().default(""),
  email: z.union([z.literal(""), z.string().trim().email().max(160)]).optional().default(""),
  msg: z.string().trim().max(4000).optional().default(""),
  website: z.string().max(200).optional().default(""),
  elapsed: z.number().int().nonnegative(),
  turnstile: z.string().max(4096).optional().default(""),
  locale: z.string().max(8).optional().default("en"),
  page: z.string().max(200).optional().default(""),
});

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();
const recent = new Map<string, number>();

function log(reason: string, ip: string) {
  console.warn(`[lead] rejected: ${reason} ip=${ip.replace(/\d+$/, "x")}`);
}

function allowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set([new URL(SITE_URL).origin, ...(process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)]);
  if (process.env.NODE_ENV !== "production") allowed.add(req.nextUrl.origin);
  return allowed.has(origin);
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > WINDOW_MS) hits.delete(k);
  return list.length > MAX_PER_WINDOW;
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const j = (await r.json().catch(() => ({}))) as { success?: boolean };
  return !!j.success;
}

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return false;
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  return r.ok;
}

async function sendEmail(subject: string, text: string, replyTo?: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY, to = process.env.LEAD_EMAIL_TO, from = process.env.LEAD_EMAIL_FROM;
  if (!key || !to || !from) return false;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: to.split(","), subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  return r.ok;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "0.0.0.0";

  if (!allowedOrigin(req)) { log("origin", ip); return NextResponse.json({ ok: false }, { status: 403 }); }
  if (rateLimited(ip)) { log("rate", ip); return NextResponse.json({ ok: false }, { status: 429 }); }

  let data: z.infer<typeof Lead>;
  try {
    data = Lead.parse(await req.json());
  } catch {
    log("invalid", ip);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!data.phone && !data.email) return NextResponse.json({ ok: false }, { status: 400 });

  // Bots: honeypot filled or form submitted faster than a human can type. Pretend success.
  if (data.website || data.elapsed < 3000) { log(data.website ? "honeypot" : "too-fast", ip); return NextResponse.json({ ok: true }); }

  if (!(await verifyTurnstile(data.turnstile, ip))) { log("turnstile", ip); return NextResponse.json({ ok: false }, { status: 403 }); }

  const key = (data.phone.replace(/\D/g, "") || data.email.toLowerCase());
  const last = recent.get(key);
  if (last && Date.now() - last < WINDOW_MS) return NextResponse.json({ ok: true, duplicate: true });
  recent.set(key, Date.now());

  const lines: [string, string][] = [
    ["Name", data.name], ["Title", data.role], ["Organization", data.org], ["Sector", data.sector],
    ["Interest", data.interest], ["Phone", data.phone], ["Email", data.email], ["Language", data.locale], ["Page", data.page],
  ];
  const head = "New BlackGust lead";
  const tg = `<b>${head}</b>\n` + lines.filter(([, v]) => v).map(([k, v]) => `<b>${k}:</b> ${esc(v)}`).join("\n") + (data.msg ? `\n\n${esc(data.msg)}` : "");
  const plain = lines.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n") + (data.msg ? `\n\n${data.msg}` : "");

  const results = await Promise.allSettled([sendTelegram(tg), sendEmail(`${head}: ${data.org || data.name}`, plain, data.email || undefined)]);
  const delivered = results.some((r) => r.status === "fulfilled" && r.value);

  if (!delivered) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[lead] no delivery channel configured; lead:\n" + plain);
      return NextResponse.json({ ok: true, dev: true });
    }
    console.error("[lead] delivery failed on all channels");
    recent.delete(key);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
