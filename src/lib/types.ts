/** Shapes of structured content in src/messages/*.json */
export type Cell = { k: string; h: string; p: string; href?: string; items?: string[] };
export type Layer = { tag: string; h: string; p: string; chips: string[]; hl?: boolean; dashed?: boolean };
export type ModelOption = { k: string; h: string; p: string; items: string[]; hl?: boolean };
export type Tier = { step: string; title: string; price: string; per?: string; note: string; items: string[]; cta: string; hl?: boolean };
export type Phase = { dur: string; title: string; text?: string; out: string; list?: string[] };
export type Tab = { tab: string; quote: string; qa: string[][] };
export type FaqGroup = { id: string; title: string; items: string[][] };
