// Verifies every locale file has exactly the same structure as en.json:
// same keys, same array lengths, same {placeholders} and markdown link targets.
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "src/messages");
const base = JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8"));
const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
const links = (s) => [...s.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]).sort().join(",");
let errors = 0;

function cmp(a, b, p, file) {
  const err = (m) => { errors++; console.error(`${file}: ${p || "<root>"} — ${m}`); };
  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b)) return err(`type ${typeof a} vs ${typeof b}`);
  if (typeof a === "string") {
    if (vars(a) !== vars(b)) err(`placeholders {${vars(a)}} vs {${vars(b)}}`);
    if (links(a) !== links(b)) err(`links ${links(a)} vs ${links(b)}`);
    if (!b.trim()) err("empty string");
    return;
  }
  if (Array.isArray(a)) {
    if (a.length !== b.length) return err(`array length ${a.length} vs ${b.length}`);
    a.forEach((x, i) => cmp(x, b[i], `${p}[${i}]`, file));
    return;
  }
  if (a && typeof a === "object") {
    for (const k of Object.keys(a)) k in b ? cmp(a[k], b[k], p ? `${p}.${k}` : k, file) : err(`missing key ${k}`);
    for (const k of Object.keys(b)) if (!(k in a)) err(`extra key ${k}`);
  }
}

const only = process.argv.slice(2);
for (const f of fs.readdirSync(dir)) {
  if (f === "en.json" || !f.endsWith(".json")) continue;
  if (only.length && !only.includes(f)) continue;
  cmp(base, JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")), "", f);
}
if (errors) { console.error(`\n${errors} problem(s)`); process.exit(1); }
console.log("i18n: all locales match en.json");
