import type { Locale } from "../i18n/content";

const LOCALE_MARKERS: Record<Locale, RegExp> = {
  ru: /(?:Сда[её]тся|Прода[её]тся|Квартира|комнат)/i,
  en: /\b(?:Apartment|Studio|House|Flat)\s+for\b/i,
  hy: /(?:Տրվում է|Բնակարան|Վարձով)/,
};

function extractLocaleSegment(text: string, locale: Locale): string {
  const marks: { idx: number; lang: Locale }[] = [];
  (["ru", "en", "hy"] as const).forEach((lang) => {
    const m = text.search(LOCALE_MARKERS[lang]);
    if (m >= 0) marks.push({ idx: m, lang });
  });
  if (marks.length <= 1) return text;

  marks.sort((a, b) => a.idx - b.idx);
  const own = marks.find((m) => m.lang === locale);
  if (!own) return text;

  const next = marks.find((m) => m.idx > own.idx);
  return text.slice(own.idx, next?.idx ?? text.length).trim();
}

function fixMergedWords(text: string): string {
  let t = text;
  t = t.replace(/([а-яёa-z0-9])([А-ЯЁA-Z])/g, "$1 $2");
  t = t.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  t = t.replace(/([ա-ֆ])([Ա-Ֆ])/g, "$1 $2");
  t = t.replace(/([.!?։])([А-ЯЁA-ZԱ-Ֆ])/g, "$1 $2");
  t = t.replace(/услуги\s*удобств/gi, "услуги и удобств");
  t = t.replace(/аренда\s*депозит/gi, "аренда, депозит");
  t = t.replace(/арендадепозит/gi, "аренда, депозит");
  t = t.replace(/месяц\s*Звоните/gi, "месяц. Звоните");
  t = t.replace(/месяцЗвоните/gi, "месяц. Звоните");
  t = t.replace(/rent\s*The/gi, "rent. The");
  t = t.replace(/rentThe/gi, "rent. The");
  t = t.replace(/rental\s*deposit/gi, "rental deposit");
  t = t.replace(/rentaldeposit/gi, "rental deposit");
  t = t.replace(/month\s*Call/gi, "month. Call");
  t = t.replace(/monthCall/gi, "month. Call");
  return t;
}

function formatBullets(text: string): string {
  return text
    .replace(/\s*\*\s*/g, "\n• ")
    .replace(/([^\n])\s*•\s*/g, "$1\n• ")
    .replace(/\n{2,}•/g, "\n•");
}

function normalizeWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function formatPropertyDescription(text: string, locale: Locale): string {
  if (!text) return "";
  let t = extractLocaleSegment(text, locale);
  t = fixMergedWords(t);
  t = formatBullets(t);
  t = t.replace(/([.!?])([А-ЯЁA-Z])/g, "$1 $2");
  return normalizeWhitespace(t);
}
