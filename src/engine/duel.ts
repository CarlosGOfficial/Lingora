import { COURSES } from '../content'
import type { Item, LangCode } from '../content/types'
import { mulberry32, shuffle } from '../lib/random'

/*
 * Live duels (server/duels.ts): both players get the same 10 multiple-choice questions,
 * made from a shared seed. Only the server builds them, and it keeps the answers: the
 * browser gets prompts and options, and each answer is checked by the server.
 */

export const DUEL_QUESTIONS = 10
export const DUEL_SECONDS = 150
export const DUEL_TIERS = ['starter', 'core', 'all'] as const
export type DuelTier = (typeof DUEL_TIERS)[number]
const UNITS: Record<DuelTier, number> = { starter: 3, core: 8, all: Infinity }

export type DuelOption = { id: string; text: string; sub?: string }
/** What the player sees: "what does this mean?" or "how do you say this?". */
export type DuelQuestion = { kind: 'meaning' | 'target'; prompt: string; sub?: string; options: DuelOption[] }
type Built = DuelQuestion & { answer: string }

const sub = (it: Item) => (it.reading && it.reading !== it.target ? it.reading : undefined)

export function buildDuel(lang: LangCode, tier: DuelTier, seed: number): Built[] {
  const course = COURSES[lang]
  const units = course.units.slice(0, UNITS[tier])
  const words = units.flatMap((u) => u.lessons.flatMap((l) => l.items)).filter((it) => it.kind === 'word')
  const rand = mulberry32(seed)
  // One item per meaning (some words share an English gloss), so every question has one right answer.
  const byMeaning = new Map<string, Item>()
  for (const it of words) if (!byMeaning.has(it.meaning.toLowerCase())) byMeaning.set(it.meaning.toLowerCase(), it)
  const pool = [...byMeaning.values()]
  const picked = shuffle(pool, rand).slice(0, DUEL_QUESTIONS)
  return picked.map((item, i) => {
    const kind: Built['kind'] = (i + Math.floor(rand() * 2)) % 2 ? 'target' : 'meaning'
    const decoys = shuffle(pool.filter((p) => p.id !== item.id && p.target !== item.target), rand).slice(0, 3)
    const options = shuffle([item, ...decoys], rand).map((o): DuelOption =>
      kind === 'meaning' ? { id: o.id, text: o.meaning } : { id: o.id, text: o.target, sub: sub(o) })
    return kind === 'meaning'
      ? { kind, prompt: item.target, sub: sub(item), options, answer: item.id }
      : { kind, prompt: item.meaning, options, answer: item.id }
  })
}

/** For the browser: no answers. */
export const publicQuestions = (qs: Built[]): DuelQuestion[] => qs.map(({ answer: _answer, ...q }) => q)

/** Elo, as in Wordle's ranked mode: K = 32. Returns [delta for a, delta for b]. */
export function eloDeltas(a: number, b: number, scoreA: 0 | 0.5 | 1): [number, number] {
  const expected = 1 / (1 + 10 ** ((b - a) / 400))
  const d = Math.round(32 * (scoreA - expected))
  return [d, -d]
}

/** Coins for a finished duel (paid once each, through the coin ledger). */
export const DUEL_COINS = { win: 20, draw: 10, loss: 5 }
