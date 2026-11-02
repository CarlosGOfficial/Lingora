/**
 * Pronunciation helpers: pinyin syllables and tone variants for Mandarin, kana
 * variants for Japanese, and speech scoring that judges how something *sounds*
 * rather than which characters a recogniser happened to write.
 */
import { COURSES, allItems } from '../content'
import type { Item, LangCode } from '../content/types'
import { normalize, stripDiacritics } from './answer'

/* ---------- Pinyin ---------- */

const TONE_MARKS: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
}
const TONED = new Map<string, { base: string; tone: number }>()
for (const [base, marks] of Object.entries(TONE_MARKS)) marks.forEach((m, i) => TONED.set(m, { base, tone: i + 1 }))

const stripTones = (s: string) => [...s].map((ch) => TONED.get(ch)?.base ?? ch).join('')

const INITIAL = '(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])'
const FINAL = '(?:iang|iong|uang|ueng|iao|ian|uai|uan|üan|ang|eng|ing|ong|ai|ei|ao|ou|an|en|er|in|un|ün|ia|ie|iu|ua|uo|ui|ue|üe|a|o|e|i|u|ü)'
/** One syllable, optionally with erhua (-r) when no vowel follows. */
const SYLLABLE = new RegExp(`${INITIAL}?${FINAL}(?:r(?![aeiouü]))?`, 'y')

const isHan = (ch: string) => /\p{Script=Han}/u.test(ch)

/** Toneless syllables of a pinyin string ("nǐ hǎo" → ["ni","hao"]); null if it can't be parsed. */
export function pinyinSyllables(pinyin: string): string[] | null {
  const out: string[] = []
  const chunks = stripTones(pinyin.normalize('NFC').toLowerCase().replace(/v/g, 'ü'))
    .split(/[^a-zü]+/)
    .filter(Boolean)
  for (const chunk of chunks) {
    let i = 0
    while (i < chunk.length) {
      SYLLABLE.lastIndex = i
      const m = SYLLABLE.exec(chunk)
      if (!m || !m[0]) return null
      out.push(m[0])
      i += m[0].length
    }
  }
  return out
}

/** Character → most common toneless syllable, learned from every course item whose syllables line up 1:1. */
let hanziMap: Map<string, string> | null = null
function getHanziMap(): Map<string, string> {
  if (hanziMap) return hanziMap
  const counts = new Map<string, Map<string, number>>()
  const zh = COURSES.zh
  const items = [...allItems(zh), ...zh.units.flatMap((u) => u.reading?.sentences ?? [])]
  for (const it of items) {
    if (!it.reading) continue
    const chars = [...it.target].filter(isHan)
    const sylls = pinyinSyllables(it.reading)
    if (!sylls || sylls.length !== chars.length) continue
    chars.forEach((ch, i) => {
      const m = counts.get(ch) ?? new Map<string, number>()
      m.set(sylls[i], (m.get(sylls[i]) ?? 0) + 1)
      counts.set(ch, m)
    })
  }
  hanziMap = new Map([...counts].map(([ch, m]) => [ch, [...m].sort((a, b) => b[1] - a[1])[0][0]]))
  return hanziMap
}

/** Converts Chinese text to toneless syllables; unknown characters stay as themselves. */
export function hanziToSyllables(text: string): string[] {
  const map = getHanziMap()
  return [...text].filter(isHan).map((ch) => map.get(ch) ?? ch)
}

/** Distinct readings that differ from the original only in tones ("nǐ hǎo" → "ní hǎo", …). */
export function toneVariants(reading: string, n: number, rand: () => number = Math.random): string[] {
  const chars = [...reading]
  const toned = chars.map((ch, i) => (TONED.has(ch) ? i : -1)).filter((i) => i >= 0)
  if (!toned.length) return []
  const out = new Set<string>()
  for (let guard = 0; out.size < n && guard < 40; guard++) {
    const copy = [...chars]
    const pos = toned[Math.floor(rand() * toned.length)]
    const { base, tone } = TONED.get(copy[pos])!
    const others = [1, 2, 3, 4].filter((t) => t !== tone)
    copy[pos] = TONE_MARKS[base][others[Math.floor(rand() * others.length)] - 1]
    const v = copy.join('')
    if (v !== reading) out.add(v)
  }
  return [...out]
}

/* ---------- Kana ---------- */

const DAKUTEN_PAIRS = 'かがきぎくぐけげこごさざしじすずせぜそぞただちぢつづてでとどはばひびふぶへべほぼカガキギクグケゲコゴサザシジスズセゼソゾタダチヂツヅテデトドハバヒビフブヘベホボ'
const DAKUTEN = new Map<string, string>()
for (let i = 0; i < DAKUTEN_PAIRS.length; i += 2) {
  DAKUTEN.set(DAKUTEN_PAIRS[i], DAKUTEN_PAIRS[i + 1])
  DAKUTEN.set(DAKUTEN_PAIRS[i + 1], DAKUTEN_PAIRS[i])
}

/** Plausible misreadings: a voiced/unvoiced swap, or a long vowel / small っ added or removed. */
export function kanaVariants(reading: string, n: number, rand: () => number = Math.random): string[] {
  const chars = [...reading]
  const out = new Set<string>()
  const swappable = chars.map((ch, i) => (DAKUTEN.has(ch) ? i : -1)).filter((i) => i >= 0)
  for (let guard = 0; out.size < n && guard < 40; guard++) {
    const copy = [...chars]
    const r = rand()
    if (swappable.length && r < 0.5) {
      const pos = swappable[Math.floor(rand() * swappable.length)]
      copy[pos] = DAKUTEN.get(copy[pos])!
    } else if (copy.includes('う') && r < 0.75) {
      copy.splice(copy.indexOf('う'), 1)
    } else if (copy.includes('っ')) {
      copy.splice(copy.indexOf('っ'), 1)
    } else {
      copy.splice(1 + Math.floor(rand() * Math.max(1, copy.length - 1)), 0, 'う')
    }
    const v = copy.join('')
    if (v && v !== reading) out.add(v)
  }
  return [...out]
}

/* ---------- Numbers ---------- */

const PT_NUMBERS = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove', 'vinte']
const KANJI_DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']

function kanjiNumber(n: number): string {
  if (n < 10) return KANJI_DIGITS[n]
  if (n < 100) return `${n >= 20 ? KANJI_DIGITS[Math.floor(n / 10)] : ''}十${n % 10 ? KANJI_DIGITS[n % 10] : ''}`
  return String(n)
}

/** Recognisers often write numbers as digits; turn them back into words for comparison. */
export function spellNumbers(text: string, lang: LangCode): string {
  return text.replace(/\d+/g, (d) => {
    const n = Number(d)
    if (lang === 'pt') return PT_NUMBERS[n] ?? d
    return kanjiNumber(n)
  })
}

/* ---------- Scoring ---------- */

function editDistance<T>(a: T[], b: T[]): number {
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = cur
  }
  return prev[b.length]
}

const seqSimilarity = <T>(a: T[], b: T[]) => (Math.max(a.length, b.length) ? 1 - editDistance(a, b) / Math.max(a.length, b.length) : 1)

/** Which positions of `a` are part of a longest common subsequence with `b`. */
function matchedPositions<T>(a: T[], b: T[]): boolean[] {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const ok = new Array<boolean>(a.length).fill(false)
  for (let i = 0, j = 0; i < a.length && j < b.length; ) {
    if (a[i] === b[j]) {
      ok[i] = true
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  return ok
}

export interface SpeechUnit {
  text: string
  ok: boolean
}

export interface SpeechResult {
  /** 0..1 */
  score: number
  heard: string
  /** The target split into characters (CJK) or words (Portuguese), each marked hit or missed. */
  units: SpeechUnit[]
}

const PUNCT = /[\s.,!?;:'"“”‘’()\-—…。、，！？；：「」『』・（）〜~]/u
const chars = (s: string) => [...s.normalize('NFKC')].filter((ch) => !PUNCT.test(ch))
const plainWord = (w: string) => stripDiacritics(normalize(w))

function scoreOne(transcript: string, item: Item, lang: LangCode): SpeechResult {
  const heard = spellNumbers(transcript, lang)

  if (lang === 'zh') {
    const targetChars = chars(item.target)
    const expected = (item.reading && pinyinSyllables(item.reading)) || hanziToSyllables(item.target)
    const got = hanziToSyllables(heard)
    const bySound = seqSimilarity(expected, got)
    const byChars = seqSimilarity(targetChars, chars(heard))
    // Mark characters by sound when syllables line up with characters, else by character.
    const hanTarget = targetChars.filter(isHan)
    const ok = expected.length === hanTarget.length ? matchedPositions(expected, got) : matchedPositions(hanTarget, chars(heard))
    let k = 0
    const units = targetChars.map((ch) => ({ text: ch, ok: isHan(ch) ? ok[k++] ?? false : true }))
    return { score: Math.max(bySound, byChars), heard: transcript, units }
  }

  if (lang === 'ja') {
    // Recognisers mix kanji and kana freely: compare against both the written form and the reading.
    const forms = [item.target, item.reading, ...(item.alt ?? []).filter((a) => !/[a-z]/i.test(a))].filter((f): f is string => !!f)
    const got = chars(heard)
    const best = forms.map((f) => ({ f, sim: seqSimilarity(chars(f), got) })).sort((a, b) => b.sim - a.sim)[0]
    const shown = chars(item.target)
    const ok = best.f === item.target ? matchedPositions(shown, got) : null
    const units = ok ? shown.map((ch, i) => ({ text: ch, ok: ok[i] })) : chars(best.f).map((ch, i, all) => ({ text: ch, ok: matchedPositions(all, got)[i] }))
    return { score: best.sim, heard: transcript, units }
  }

  // Portuguese: compare word by word, ignoring accents and case.
  const forms = [item.target, ...(item.alt ?? [])]
  const got = heard.split(/\s+/).map(plainWord).filter(Boolean)
  const scored = forms.map((f) => {
    const words = f.split(/\s+/).filter((w) => plainWord(w))
    const plain = words.map(plainWord)
    const charSim = seqSimilarity(chars(plain.join('')), chars(got.join('')))
    return { words, plain, sim: Math.max(seqSimilarity(plain, got), charSim) }
  })
  const best = scored.sort((a, b) => b.sim - a.sim)[0]
  const ok = matchedPositions(best.plain, got)
  return { score: best.sim, heard: transcript, units: best.words.map((w, i) => ({ text: w, ok: ok[i] })) }
}

/** Scores every alternative transcript and keeps the best. */
export function scoreSpeech(transcripts: string[], item: Item, lang: LangCode): SpeechResult {
  const results = transcripts.filter((t) => t.trim()).map((t) => scoreOne(t, item, lang))
  if (!results.length) return { score: 0, heard: '', units: chars(item.target).map((text) => ({ text, ok: false })) }
  return results.sort((a, b) => b.score - a.score)[0]
}
