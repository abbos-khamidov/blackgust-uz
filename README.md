# BlackGust — blackgust.uz

Site for BlackGust in Uzbekistan and Asia — the enterprise/government product of AISolution. Languages: Uzbek (default), Russian, English, Chinese, Korean. Visual-first: dot-matrix globe hero, intro, page shutter, pinned scroll scenes, live model.

## Stack
- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- next-intl 4 — locale routing (`/` = Uzbek, `/ru`, `/en`, `/zh`, `/ko`; old `/kk/*` → 301 to `/*`)
- GSAP + ScrollTrigger, Lenis smooth scroll, Canvas 2D (live organization model)
- zod for API validation; self-hosted fonts (@fontsource)

## Run
```bash
npm install
cp .env.example .env.local     # fill Telegram and/or Resend
npm run dev                    # http://localhost:3000
npm run i18n:check             # all locales must match en.json
npm run build && npm start     # production
```

## Where things live
| What | Where |
|---|---|
| All texts (5 languages) | `src/messages/*.json` (`en.json` is the source) |
| Contacts, prices (USD), AISolution links | `src/config/site.ts` |
| Pages | `src/app/[locale]/*/page.tsx` |
| Header, footer, language switcher, form | `src/components/` |
| Motion: smooth scroll, reveals, parallax | `src/components/MotionRoot.tsx`, `src/lib/motion/page.ts` |
| Live model ("How it works") | `src/lib/motion/flow.ts`, `src/components/FlowViz.tsx` |
| Particle wind field (heroes) | `src/lib/motion/gust.ts` |
| Globe (home hero + inner heroes) | `src/lib/motion/globe.ts`, land dots in `src/lib/motion/land.ts` (regenerate: `node scripts/gen-globe.mjs`) |
| Intro, page shutter, cursor | `src/app/[locale]/layout.tsx`, `src/app/[locale]/template.tsx`, `src/components/Cursor.tsx`, CSS "x10 visual layer" in globals.css |
| Lead API (anti-spam + Telegram/email) | `src/app/api/lead/route.ts` |
| SEO: metadata, hreflang, sitemap, robots, OG | `src/lib/seo.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/og/route.tsx` |
| Cursor rules | `.cursor/rules/blackgust.mdc` |

## Pricing
All prices in USD (`src/config/site.ts`), payment in UZS at the Central Bank rate on the invoice date.
- Turnkey development: Foundation from $90,000 · Enterprise from $250,000 · Sovereign from $490,000
- Consulting: strategy session free · diagnostic from $29,000 · AI strategy from $59,000 · sovereign AI architecture from $79,000 · leadership program from $19,000 · fractional CAIO from $20,000 / month
- Simple consulting and small-company work stays with AISolution (aisolution.uz).

## Lead form
`POST /api/lead` — origin check, honeypot, ≥3 s completion time, 5 requests / 10 min per IP, duplicate suppression, optional Cloudflare Turnstile. Delivers to Telegram and/or email (Resend). Rate limit and dedup are in-memory: fine for one PM2 process; use Redis if you run several instances.

## Deploy (Hetzner, same as aisolution.uz)
```bash
npm ci && npm run build
pm2 start npm --name blackgust-uz -- start -- -p 3011
```
Nginx: proxy `blackgust.uz` → `127.0.0.1:3011`, Let's Encrypt for TLS, redirect `www` → apex. Set `NEXT_PUBLIC_SITE_URL=https://blackgust.uz`.

## Before launch — verify
- Technical claims on Platform/Security pages (in-region data center, SAML/OIDC, Kubernetes, SIEM export, own Uzbek STT/TTS, deploy timelines).
- "OpenAI Select Partner" is stated for AISolution only (approved wording). Get written approval before showing it next to the BlackGust brand.
- Create the mailbox hello@blackgust.uz and confirm WhatsApp on +998 93 949 20 00.
- Native-speaker review of UZ, ZH, KO texts.
- Consulting prices are proposals — confirm.
- Uzbek text uses ‘ (U+2018) for oʻ/gʻ and ’ (U+2019) for the tutuq belgisi, because IBM Plex Sans renders U+02BB/U+02BC with broken spacing.
