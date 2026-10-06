import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { fill, priceVars } from "./format";
import { demo } from "@/config/site";
import { money } from "./format";

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Loads a message namespace as raw data with {price} variables filled in, recursively. */
export async function content<T = any>(locale: Locale, ns: string): Promise<T> {
  const t = await getTranslations({ locale });
  const vars = { ...priceVars(locale), threshold: money(locale, demo.approvalThreshold) };
  const walk = (v: any): any =>
    typeof v === "string" ? fill(v, vars) : Array.isArray(v) ? v.map(walk) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v;
  return walk(t.raw(ns)) as T;
}
