import type { Course, Item, LangCode, Unit } from '../content/types'

/*
 * Listening podcasts: short two-voice episodes built only from words you know.
 * Two sources:
 *  - "course" episodes, made here from a unit's own sentences (always available, offline too);
 *  - "ai" episodes, written by Claude on the server for a unit and shared by everyone at that
 *    point in the course (server/podcasts.ts), accepted only if they're >= 95% known words.
 * Pure functions, shared by the browser and the server.
 */

export interface EpisodeLine {
  /** 0 or 1: which of the two voices. */
  speaker: 0 | 1
  target: string
  reading: string
  translation: string
}

export interface EpisodeQuestion {
  q: string
  options: string[]
  answer: number
}

export interface Episode {
  id: string
  lang: LangCode
  unitId: string
  source: 'course' | 'ai'
  title: string
  summary: string
  lines: EpisodeLine[]
  questions: EpisodeQuestion[]
  /** Share of known words (0-1), checked when it was made. */
  known: number
}

export const KNOWN_MIN = 0.95
export const PODCAST_XP = 15

/** Units you've finished every lesson of, in course order. */
export function finishedUnits(course: Course, completed: string[]): Unit[] {
  return course.units.filter((u) => u.lessons.every((l) => completed.includes(l.id)))
}

/** Everything a learner who finished `units` has met: words and sentences. */
export const knownItems = (units: Unit[]): Item[] => units.flatMap((u) => u.lessons.flatMap((l) => [...l.items, ...l.sentences]))

// Grammar glue every beginner meets in the first lessons (not always items of their own).
const GLUE: Record<LangCode, string[]> = {
  zh: [],
  ja: [],
  pt: [
    // articles, prepositions and their contractions
    'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'num', 'numa', 'ao', 'aos', 'com', 'para', 'por', 'pra', 'sem', 'ate',
    // pronouns and possessives
    'eu', 'voce', 'voces', 'ele', 'ela', 'eles', 'elas', 'nos', 'me', 'te', 'lhe', 'meu', 'minha', 'seu', 'sua', 'nosso', 'nossa', 'este', 'esta', 'esse', 'essa', 'isso', 'isto', 'aquele', 'aquela', 'tudo', 'todo', 'toda',
    // glue words
    'e', 'ou', 'que', 'se', 'nao', 'sim', 'mas', 'muito', 'mais', 'menos', 'bem', 'tao', 'ja', 'so', 'boa', 'bons', 'sobre',
    // the commonest forms of ser, estar, ter, ir
    'sou', 'e', 'somos', 'sao', 'estou', 'esta', 'estamos', 'estao', 'tem', 'temos', 'tenho', 'vai', 'vamos', 'vao', 'vou', 'foi',
    // numbers
    'onze', 'doze', 'vinte', 'trinta', 'cem', 'mil',
  ],
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const CJK = /[぀-ヿ一-鿿㐀-䶿]/g
const WORD = /[A-Za-zÀ-ÖØ-öø-ÿ]+/g

/**
 * What's "known": for Chinese and Japanese, every character in the items you've met (so a
 * known character in a new combination counts, as it does for readers); for Portuguese,
 * every word in them plus the basic glue words. (Japanese also counts the kana of readings.)
 */
export function knownSet(lang: LangCode, items: Item[]): Set<string> {
  const out = new Set<string>(GLUE[lang])
  for (const i of items) {
    if (lang === 'pt') for (const w of i.target.match(WORD) ?? []) out.add(fold(w))
    else {
      for (const c of i.target.match(CJK) ?? []) out.add(c)
      // Japanese: the kana of a word's reading are known too (私 is taught with わたし).
      if (lang === 'ja') for (const c of (i.reading ?? '').match(CJK) ?? []) out.add(c)
    }
  }
  return out
}

/** Portuguese: a known word, or its plural / feminine / plural feminine form (irmãos, nova, velhas). */
function ptKnown(w: string, known: Set<string>): boolean {
  if (known.has(w)) return true
  const stems = [w.replace(/s$/, ''), w.replace(/es$/, ''), w.replace(/aes$/, 'ao'), w.replace(/oes$/, 'ao'), w.replace(/is$/, 'l')]
  for (const st of stems) {
    if (known.has(st)) return true
    if (st.endsWith('a') && known.has(st.slice(0, -1) + 'o')) return true
  }
  return false
}

/** The share of known units (characters / words) in some lines, and the unknown ones. */
export function knownRatio(lang: LangCode, lines: { target: string }[], known: Set<string>): { ratio: number; unknown: string[] } {
  let total = 0
  const unknown = new Map<string, number>()
  for (const l of lines) {
    const units = lang === 'pt' ? (l.target.match(WORD) ?? []).map(fold) : l.target.match(CJK) ?? []
    for (const u of units) {
      total++
      if (!(lang === 'pt' ? ptKnown(u, known) : known.has(u))) unknown.set(u, (unknown.get(u) ?? 0) + 1)
    }
  }
  const missed = Array.from(unknown.values()).reduce((a, b) => a + b, 0)
  return { ratio: total ? (total - missed) / total : 0, unknown: Array.from(unknown.keys()) }
}

// A small seeded shuffle, so a course episode is the same every time.
function seeded<T>(list: T[], seed: number): T[] {
  const out = [...list]
  let x = seed || 1
  for (let i = out.length - 1; i > 0; i--) {
    x = (x * 1103515245 + 12345) & 0x7fffffff
    const j = x % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * A unit's own sentences as a two-voice episode, with three "what does this mean?" questions.
 * A short unit is topped up with sentences from the units just before it (known as well).
 */
export function courseEpisode(course: Course, unit: Unit): Episode | null {
  const at = course.units.indexOf(unit)
  const sentences = unit.lessons.flatMap((l) => l.sentences)
  for (let i = at - 1; i >= 0 && sentences.length < 12; i--) sentences.push(...course.units[i].lessons.flatMap((l) => l.sentences).slice(0, 12 - sentences.length))
  if (sentences.length < 8) return null
  const lines: EpisodeLine[] = sentences.slice(0, 24).map((s, i) => ({ speaker: (i % 2) as 0 | 1, target: s.target, reading: s.reading ?? '', translation: s.meaning }))
  const n = unit.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const asked = seeded(lines.map((_, i) => i), n).slice(0, 3)
  const questions = asked.map((i, k): EpisodeQuestion => {
    const wrong = seeded(lines.filter((_, j) => j !== i && lines[j].translation !== lines[i].translation).map((l) => l.translation), n + k).slice(0, 3)
    const options = seeded([lines[i].translation, ...wrong], n * 7 + k)
    return { q: `What does “${lines[i].target}” mean?`, options, answer: options.indexOf(lines[i].translation) }
  })
  return {
    id: `course-${unit.id}`,
    lang: course.lang,
    unitId: unit.id,
    source: 'course',
    title: `${unit.title}: the conversation`,
    summary: `Everything you practised in “${unit.title}”, spoken by two voices.`,
    lines,
    questions,
    known: 1,
  }
}

/** Checks an episode from anywhere (the AI, the database) has the right shape. */
export function validEpisodeBody(e: unknown): e is Pick<Episode, 'title' | 'summary' | 'lines' | 'questions'> {
  const b = e as Episode
  const s = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max
  return (
    !!b && s(b.title, 120) && typeof b.summary === 'string' && b.summary.length <= 400 &&
    Array.isArray(b.lines) && b.lines.length >= 8 && b.lines.length <= 40 &&
    b.lines.every((l) => (l.speaker === 0 || l.speaker === 1) && s(l.target, 200) && typeof l.reading === 'string' && l.reading.length <= 400 && s(l.translation, 300)) &&
    Array.isArray(b.questions) && b.questions.length === 3 &&
    b.questions.every((q) => s(q.q, 300) && Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 4 && q.options.every((o) => s(o, 200)) && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length)
  )
}
