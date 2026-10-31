import type { Item } from '../content/types'

export type Quality = 'correct' | 'almost' | 'wrong'

const PUNCT = /[\s.,!?;:'"“”‘’()\-—…。、，！？；：「」『』・（）〜~]/g

export function normalize(s: string): string {
  return s.normalize('NFKC').toLowerCase().replace(PUNCT, '')
}

/** Removes tone marks / accents: "nǐ hǎo" → "nihao", "você" → "voce". */
export function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC')
}

export function levenshtein(a: string, b: string): number {
  const aa = [...a]
  const bb = [...b]
  if (!aa.length) return bb.length
  if (!bb.length) return aa.length
  let prev = Array.from({ length: bb.length + 1 }, (_, i) => i)
  for (let i = 1; i <= aa.length; i++) {
    const cur = [i]
    for (let j = 1; j <= bb.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (aa[i - 1] === bb[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[bb.length]
}

/** 0..1 similarity on normalized strings. */
export function similarity(a: string, b: string): number {
  const x = normalize(a)
  const y = normalize(b)
  const len = Math.max([...x].length, [...y].length)
  if (len === 0) return 1
  return 1 - levenshtein(x, y) / len
}

export function acceptedAnswers(item: Item): string[] {
  return [item.target, item.reading, item.romanization, ...(item.alt ?? [])].filter((s): s is string => !!s)
}

export interface CheckResult {
  quality: Quality
  /** Why an answer was "almost" right. */
  note?: string
}

export function checkTyped(input: string, item: Item): CheckResult {
  const given = normalize(input)
  if (!given) return { quality: 'wrong' }
  const candidates = acceptedAnswers(item).map(normalize)
  if (candidates.includes(given)) return { quality: 'correct' }

  const bare = stripDiacritics(given)
  if (candidates.some((c) => stripDiacritics(c) === bare)) {
    return { quality: 'almost', note: item.reading && /[a-z]/i.test(item.reading) ? 'Watch the tones.' : 'Watch the accents.' }
  }
  // One-character slip on longer Latin-script answers counts as a typo.
  const latin = /^[a-z]+$/.test(bare)
  if (latin && bare.length >= 5 && candidates.some((c) => levenshtein(stripDiacritics(c), bare) === 1)) {
    return { quality: 'almost', note: 'Small typo.' }
  }
  return { quality: 'wrong' }
}

/** Best similarity of any speech transcript against any accepted form. */
export function speechScore(transcripts: string[], item: Item): number {
  const forms = acceptedAnswers(item)
  let best = 0
  for (const t of transcripts) for (const f of forms) best = Math.max(best, similarity(stripDiacritics(t), stripDiacritics(f)))
  return best
}
