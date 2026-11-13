/*
 * Word lookup for Lingora's three languages, used outside Lingora: tap a Chinese, Japanese
 * or Portuguese word in a Banter message (or a solved Wordle word) to see its reading and
 * meaning, and add it to your Lingora reviews.
 * KEEP THIS FILE IDENTICAL in Banter, Wordle Unlimited and Lingora (npm run check:shared
 * in Banter compares them). Pure functions only, no app imports.
 *
 * The data is Lingora's course vocabulary, published by Lingora at /lookup/<lang>.json
 * (scripts/build-lookup.ts): every course word with its reading, meaning and item id, plus
 * single characters (from the character explorer data) as a fallback.
 */

export type LookupLang = "zh" | "ja" | "pt";
export const LOOKUP_LANGS: LookupLang[] = ["zh", "ja", "pt"];
/** One word: [written form, reading, meaning, Lingora item id]. */
export type LookupWord = [string, string, string, string];
export type LookupFile = { v: 1; lang: LookupLang; words: LookupWord[]; chars: Record<string, [string, string]> };
export type LookupEntry = { text: string; reading: string; meaning: string; itemId: string | null; lang: LookupLang; char: boolean };
export type Token = { text: string; entry: LookupEntry | null };

const HAN = /[一-鿿㐀-䶿]/;
const KANA = /[぀-ヿ]/;
const CJK = /[぀-ヿ一-鿿㐀-䶿]/;
const LATIN_WORD = /[A-Za-zÀ-ÖØ-öø-ÿ]+/g;

/** Strip accents and case: "Você" → "voce". */
export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export type Dict = {
  lang: LookupLang;
  /** Written form → entry (for zh / ja: by first character, longest first). */
  byFirst: Map<string, LookupEntry[]>;
  /** pt: folded word → entry. */
  byWord: Map<string, LookupEntry>;
  chars: Map<string, LookupEntry>;
};

export function buildDict(file: LookupFile): Dict {
  const byFirst = new Map<string, LookupEntry[]>();
  const byWord = new Map<string, LookupEntry>();
  for (const [text, reading, meaning, itemId] of file.words) {
    const entry: LookupEntry = { text, reading, meaning, itemId, lang: file.lang, char: false };
    if (file.lang === "pt") {
      // Single words only (phrases can't be matched inside running text reliably).
      if (/^[A-Za-zÀ-ÖØ-öø-ÿ]+$/.test(text) && !byWord.has(fold(text))) byWord.set(fold(text), entry);
      continue;
    }
    const first = text[0];
    const list = byFirst.get(first) ?? [];
    list.push(entry);
    byFirst.set(first, list);
  }
  for (const list of byFirst.values()) list.sort((a, b) => b.text.length - a.text.length);
  const chars = new Map<string, LookupEntry>();
  for (const [c, [reading, meaning]] of Object.entries(file.chars ?? {})) chars.set(c, { text: c, reading, meaning, itemId: null, lang: file.lang, char: true });
  return { lang: file.lang, byFirst, byWord, chars };
}

/** Which of the three languages a piece of text might be in (Han without kana could be either). */
export function scriptsIn(text: string): LookupLang[] {
  const out: LookupLang[] = [];
  if (KANA.test(text)) out.push("ja");
  else if (HAN.test(text)) out.push("zh", "ja");
  if (/[A-Za-zÀ-ÿ]{3,}/.test(text)) out.push("pt");
  return out;
}

/**
 * Split text into tokens, attaching an entry to the words the dictionary knows.
 * Chinese and Japanese: longest match at each position, then single characters.
 * Portuguese: whole words (3+ letters), accents ignored; only when at least `ptMin`
 * different words match, so ordinary English text isn't underlined.
 */
export function segment(text: string, dict: Dict, ptMin = 2): Token[] {
  if (dict.lang === "pt") {
    const tokens: Token[] = [];
    const hits = new Set<string>();
    let last = 0;
    for (const m of text.matchAll(LATIN_WORD)) {
      const word = m[0], at = m.index ?? 0;
      const entry = word.length >= 3 ? dict.byWord.get(fold(word)) ?? null : null;
      if (!entry) continue;
      if (at > last) tokens.push({ text: text.slice(last, at), entry: null });
      tokens.push({ text: word, entry });
      hits.add(entry.itemId ?? entry.text);
      last = at + word.length;
    }
    if (hits.size < ptMin) return [{ text, entry: null }];
    if (last < text.length) tokens.push({ text: text.slice(last), entry: null });
    return tokens;
  }
  const tokens: Token[] = [];
  let plain = "";
  const chars = Array.from(text);
  for (let i = 0; i < chars.length;) {
    const c = chars[i];
    if (!CJK.test(c)) { plain += c; i++; continue; }
    const rest = chars.slice(i, i + 12).join("");
    const hit = (dict.byFirst.get(c) ?? []).find((e) => rest.startsWith(e.text)) ?? dict.chars.get(c) ?? null;
    if (!hit) { plain += c; i++; continue; }
    if (plain) { tokens.push({ text: plain, entry: null }); plain = ""; }
    tokens.push({ text: hit.text, entry: hit });
    i += Array.from(hit.text).length;
  }
  if (plain) tokens.push({ text: plain, entry: null });
  return tokens;
}

/** The best language to read `text` in, given the ones you're learning (first = preferred). */
export function pickLang(text: string, learning: LookupLang[]): LookupLang | null {
  const possible = scriptsIn(text);
  if (!possible.length) return null;
  if (KANA.test(text)) return possible.includes("ja") && (learning.includes("ja") || !learning.length) ? "ja" : null;
  if (HAN.test(text)) return learning.find((l) => l === "zh" || l === "ja") ?? "zh";
  return learning.includes("pt") ? "pt" : null;
}

/** Is a Lingora item id something that may be imported from another app (course words only). */
export const importableItemId = (id: string) => /^(zh|ja|pt)-[a-z0-9][a-z0-9-]{0,80}$/.test(id) && !/^(zh|ja|pt)-(deck\d|conj-|form-|adj-|mw-|char-)/.test(id);
