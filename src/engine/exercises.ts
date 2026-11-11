import { traceable } from '../components/exercises/Write'
import { allItems, getGrammar } from '../content'
import type { Course, GrammarPoint, Item, Lesson, Unit } from '../content/types'
import type { CardRecord, Settings } from '../store/useStore'
import { normalize } from '../lib/answer'
import { kanaVariants, toneVariants } from '../lib/pronounce'
import { sample, shuffle } from '../lib/random'
import { hasVoiceFor } from '../lib/speech'
import { isTrainerItem, trainerPool } from '../trainer'

export type Exercise =
  | { type: 'intro'; item: Item }
  | { type: 'mcq'; item: Item; prompt: 'target' | 'meaning' | 'audio'; options: Item[] }
  | { type: 'type'; item: Item }
  | { type: 'dictation'; item: Item }
  | { type: 'match'; items: Item[] }
  | { type: 'build'; item: Item; bank: string[] }
  /**
   * Speaking. shadow (default): hear it and see it, say it. echo: hear it without the text.
   * say: see the English, say it in the language. read: read the text aloud (no audio first).
   */
  | { type: 'speak'; item: Item; mode?: SpeakMode }
  /** Trace one character of the word, stroke by stroke (zh / ja). */
  | { type: 'write'; item: Item; char: string }
  | { type: 'grammar'; point: GrammarPoint }
  /** A sentence with one word missing; pick the word. */
  | { type: 'cloze'; item: Item; blank: number; options: string[] }
  /** Characters shown without their reading; pick the right pinyin / kana. */
  | { type: 'reading'; item: Item; options: string[] }

export type SpeakMode = 'shadow' | 'echo' | 'say' | 'read'
type Opts = Pick<Settings, 'listening' | 'speaking'>

/** Listening drills are impossible without a TTS voice for the language. */
export function effectiveOpts(settings: Opts, course: Course): Opts {
  return { listening: settings.listening && hasVoiceFor(course.bcp47), speaking: settings.speaking }
}

const sound = (it: Item) => it.reading ?? it.target

function distractors(item: Item, pool: Item[], n: number): Item[] {
  const candidates = pool.filter(
    (p) => p.id !== item.id && p.kind === item.kind && p.target !== item.target && p.meaning !== item.meaning && sound(p) !== sound(item),
  )
  return sample(candidates, n)
}

export function mcq(item: Item, pool: Item[], prompt: 'target' | 'meaning' | 'audio'): Exercise {
  // Audio prompts must not offer homophones (e.g. 他/她 are both "tā").
  return { type: 'mcq', item, prompt, options: shuffle([item, ...distractors(item, pool, 3)]) }
}

export function build(item: Item, pool: Item[]): Exercise {
  const tokens = item.tokens ?? []
  // Compare case-insensitively so "São" never appears as a decoy for "são".
  const used = new Set(tokens.map(normalize))
  const candidates = new Map<string, string>()
  for (const p of pool) {
    if (p.kind !== 'sentence' || p.id === item.id) continue
    for (const t of p.tokens ?? []) if (!used.has(normalize(t))) candidates.set(normalize(t), t)
  }
  const extra = shuffle([...candidates.values()]).slice(0, Math.max(2, Math.ceil(tokens.length / 2)))
  return { type: 'build', item, bank: shuffle([...tokens, ...extra]) }
}

/** Fill in the blank: hide one word of a sentence (preferably one that was taught as a word). */
export function cloze(item: Item, pool: Item[]): Exercise | null {
  const tokens = item.tokens ?? []
  if (tokens.length < 2) return null
  const taught = new Set(pool.filter((p) => p.kind === 'word').map((p) => normalize(p.target)))
  const known = tokens.map((t, i) => (taught.has(normalize(t)) ? i : -1)).filter((i) => i >= 0)
  const blank = sample(known.length ? known : tokens.map((_, i) => i), 1)[0]
  const answer = tokens[blank]
  const inSentence = new Set(tokens.map(normalize))
  // Decoys: taught words of a similar length that aren't in this sentence.
  const decoys = [...new Set(pool.filter((p) => p.kind === 'word' && !inSentence.has(normalize(p.target))).map((p) => p.target))]
    .sort((a, b) => Math.abs([...a].length - [...answer].length) - Math.abs([...b].length - [...answer].length))
    .slice(0, 12)
  if (decoys.length < 3) return null
  return { type: 'cloze', item, blank, options: shuffle([answer, ...sample(decoys, 3)]) }
}

/** Pronunciation drill for words written in characters: tone variants (zh) or kana misreadings (ja). */
export function readingDrill(item: Item, pool: Item[], lang: Course['lang']): Exercise | null {
  const reading = item.reading
  if (!reading || reading === item.target || lang === 'pt') return null
  const near = lang === 'zh' ? toneVariants(reading, 2) : kanaVariants(reading, 1)
  const others = shuffle(
    pool
      .filter((p) => p.kind === item.kind && p.reading && p.reading !== reading && p.id !== item.id)
      .map((p) => p.reading!)
      .filter((r) => Math.abs([...r].length - [...reading].length) <= 2),
  )
  const options = [...new Set([...near, ...others])].filter((o) => o !== reading).slice(0, 3)
  if (options.length < 3) return null
  return { type: 'reading', item, options: shuffle([reading, ...options]) }
}

const present = <T>(xs: (T | null)[]): T[] => xs.filter((x): x is T => x !== null)

/**
 * A new lesson: teach words in pairs (intro → immediate recognition), consolidate
 * with matching and pronunciation, then move to listening and production;
 * sentences come last.
 */
export function buildLesson(lesson: Lesson, course: Course, opts: Opts): Exercise[] {
  const pool = allItems(course)
  const words = lesson.items
  const ex: Exercise[] = []

  for (let i = 0; i < words.length; i += 2) {
    const pair = words.slice(i, i + 2)
    pair.forEach((it) => ex.push({ type: 'intro', item: it }))
    pair.forEach((it, j) => ex.push(mcq(it, pool, j % 2 === 0 ? 'target' : 'meaning')))
  }
  if (words.length >= 3) ex.push({ type: 'match', items: sample(words, Math.min(5, words.length)) })
  ex.push(...present(sample(words, words.length).map((w) => readingDrill(w, pool, course.lang))).slice(0, 2))

  // Explicit grammar right before the sentences that use it.
  getGrammar(lesson.id).forEach((point) => ex.push({ type: 'grammar', point }))
  lesson.sentences.forEach((s) => ex.push({ type: 'intro', item: s }))
  if (opts.listening) sample(words, 2).forEach((it) => ex.push(mcq(it, pool, 'audio')))
  sample(words, Math.min(3, words.length)).forEach((it) => ex.push({ type: 'type', item: it }))
  lesson.sentences.forEach((s) => ex.push(build(s, pool)))
  ex.push(...present(sample(lesson.sentences, lesson.sentences.length).map((s) => cloze(s, pool))).slice(0, 1))
  if (opts.speaking) sample(lesson.sentences.length ? lesson.sentences : words, 2).forEach((it) => ex.push({ type: 'speak', item: it }))
  if (opts.listening && lesson.sentences.length) ex.push({ type: 'dictation', item: sample(lesson.sentences, 1)[0] })
  // Writing practice: trace a character from one of the new words.
  const writable = words.filter((w) => canWrite(course, w))
  if (writable.length) ex.push(writeEx(sample(writable, 1)[0]))
  return ex
}

/** Unit review: a mixed checkpoint across every lesson in the unit. */
export function buildUnitReview(unit: Unit, course: Course, opts: Opts): Exercise[] {
  const pool = allItems(course)
  const words = unit.lessons.flatMap((l) => l.items)
  const sentences = unit.lessons.flatMap((l) => l.sentences)
  const ex: Exercise[] = [
    ...sample(words, 4).map((w) => mcq(w, pool, 'meaning')),
    ...sample(words, 3).map((w): Exercise => ({ type: 'type', item: w })),
    ...present(sample(words, words.length).map((w) => readingDrill(w, pool, course.lang))).slice(0, 2),
    ...present(sample(sentences, sentences.length).map((s) => cloze(s, pool))).slice(0, 2),
    ...sample(sentences, 2).map((s) => build(s, pool)),
  ]
  if (opts.listening) ex.push(...sample(words, 2).map((w) => mcq(w, pool, 'audio')))
  if (opts.speaking && sentences.length) ex.push({ type: 'speak', item: sample(sentences, 1)[0] })
  // Start with a quick matching round, then everything else interleaved.
  return [{ type: 'match', items: sample(words, 5) }, ...shuffle(ex)]
}

/**
 * Review: one exercise per due card. Young cards get recognition, mature cards
 * get production — and types are interleaved so no two in a row feel the same.
 */
export function buildReview(cards: { card: CardRecord; item: Item }[], course: Course, opts: Opts): Exercise[] {
  const pool = allItems(course)
  return shuffle(cards).map(({ card, item }) => {
    // Trainer cards (verb forms, measure words): type it, or pick it from its own forms.
    if (isTrainerItem(item.id)) {
      const choice = () => mcq(item, trainerPool(item), 'meaning')
      return card.reps <= 1 || Math.random() < 0.3 ? choice() : { type: 'type', item }
    }
    const options: (() => Exercise)[] = []
    if (card.reps <= 1) {
      options.push(() => mcq(item, pool, 'target'), () => mcq(item, pool, 'meaning'))
      if (opts.listening) options.push(() => mcq(item, pool, 'audio'))
    } else {
      options.push(() => ({ type: 'type', item }))
      if (item.kind === 'sentence' && item.tokens?.length) options.push(() => build(item, pool))
      const fill = item.kind === 'sentence' ? cloze(item, pool) : readingDrill(item, pool, course.lang)
      if (fill) options.push(() => fill)
      if (opts.listening) options.push(() => ({ type: 'dictation', item }))
      if (opts.speaking) options.push(() => ({ type: 'speak', item }))
      if (canWrite(course, item)) options.push(() => writeEx(item))
      options.push(() => mcq(item, pool, 'meaning'))
    }
    return options[Math.floor(Math.random() * options.length)]()
  })
}

export type PracticeMode = 'speaking' | 'listening' | 'weak' | 'writing'

export function buildPractice(mode: PracticeMode, items: Item[], course: Course, opts: Opts): Exercise[] {
  const pool = allItems(course)
  if (mode === 'speaking') {
    const sentences = items.filter((i) => i.kind === 'sentence')
    const words = items.filter((i) => i.kind === 'word')
    // A mix: shadow sentences, echo some without the text, and say some from the English.
    const shadow = sample(sentences, 4).map((item): Exercise => ({ type: 'speak', item, mode: 'shadow' }))
    const used = new Set(shadow.map((e) => (e as { item: Item }).item.id))
    const echo = sample([...words, ...sentences].filter((i) => !used.has(i.id)), 2).map((item): Exercise => ({ type: 'speak', item, mode: 'echo' }))
    for (const e of echo) used.add((e as { item: Item }).item.id)
    const say = sample(words.filter((i) => !used.has(i.id)), 2).map((item): Exercise => ({ type: 'speak', item, mode: 'say' }))
    return shuffle([...shadow, ...echo, ...say])
  }
  if (mode === 'listening') {
    return sample(items, 8).map((item, i) => (i % 2 === 0 ? { type: 'dictation', item } : mcq(item, pool, 'audio')))
  }
  if (mode === 'writing') {
    // One character from each of 8 learned words, weakest first, then shuffled.
    return shuffle(items.filter((i) => i.kind === 'word' && traceable(i.target).length).slice(0, 8)).map((item) => writeEx(item))
  }
  // weak: items arrive pre-sorted by lowest stability
  return items.slice(0, 10).map((item, i) => {
    const kinds: (() => Exercise)[] = [() => ({ type: 'type', item }), () => mcq(item, pool, 'meaning')]
    if (opts.listening) kinds.push(() => ({ type: 'dictation', item }))
    return kinds[i % kinds.length]()
  })
}

/** Tracing: one character of the word (the least common-looking one: the first that isn't kana, if any). */
export function writeEx(item: Item): Exercise {
  const chars = traceable(item.target)
  const pick = chars.find((c) => /[\u4e00-\u9fff]/.test(c)) ?? chars[Math.floor(Math.random() * chars.length)]
  return { type: 'write', item, char: pick }
}
const canWrite = (course: Course, item: Item) => (course.lang === 'zh' || course.lang === 'ja') && item.kind === 'word' && traceable(item.target).length > 0

export function exerciseItems(ex: Exercise): Item[] {
  if (ex.type === 'grammar') return []
  return ex.type === 'match' ? ex.items : [ex.item]
}

/** Learning new community-deck cards: meet each one, then recognise it both ways (and match a few). */
export function buildDeckLearn(items: Item[], pool: Item[]): Exercise[] {
  const intros: Exercise[] = items.map((item) => ({ type: 'intro', item }))
  const quiz = shuffle(items.flatMap((item) => [mcq(item, pool, 'target'), mcq(item, pool, 'meaning')]))
  return [...intros, ...(items.length >= 4 ? [{ type: 'match', items: sample(items, 4) } as Exercise] : []), ...quiz]
}

/** Read a passage aloud, sentence by sentence (graded readers and stories). */
export function buildReadAloud(sentences: Item[]): Exercise[] {
  return sentences.slice(0, 10).map((item) => ({ type: 'speak', item, mode: 'read' }))
}
