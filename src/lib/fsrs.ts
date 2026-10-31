/**
 * FSRS-4.5 (Free Spaced Repetition Scheduler) — a compact implementation.
 * Models memory with Difficulty (1..10), Stability (days until retrievability
 * drops to 90%) and Retrievability (probability of recall right now).
 * Reference: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 */

export type Rating = 1 | 2 | 3 | 4 // Again | Hard | Good | Easy

export interface SrsCard {
  due: number // epoch ms
  stability: number
  difficulty: number
  reps: number
  lapses: number
  lastReview: number | null
}

const W = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793,
  0.3246, 1.587, 0.2272, 2.8755,
]
const DECAY = -0.5
const FACTOR = 19 / 81
export const DESIRED_RETENTION = 0.9
export const DAY_MS = 86_400_000
/** Failed cards come back within the same day for relearning. */
const RELEARN_MS = 10 * 60_000
const MAX_INTERVAL_DAYS = 365 * 3

const clampD = (d: number) => Math.min(10, Math.max(1, d))

export function initDifficulty(g: Rating): number {
  return clampD(W[4] - (g - 3) * W[5])
}

export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0
  return Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY)
}

export function intervalDays(stability: number, retention = DESIRED_RETENTION): number {
  const raw = (stability / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1)
  return Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.round(raw)))
}

function nextDifficulty(d: number, g: Rating): number {
  const d1 = d - W[6] * (g - 3)
  return clampD(W[7] * initDifficulty(4) + (1 - W[7]) * d1)
}

function recallStability(d: number, s: number, r: number, g: Rating): number {
  const hard = g === 2 ? W[15] : 1
  const easy = g === 4 ? W[16] : 1
  return s * (Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hard * easy + 1)
}

function forgetStability(d: number, s: number, r: number): number {
  const sf = W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r))
  return Math.min(s, sf)
}

export function newCard(now: number): SrsCard {
  return { due: now, stability: 0, difficulty: 0, reps: 0, lapses: 0, lastReview: null }
}

export function review(card: SrsCard, g: Rating, now: number): SrsCard {
  let stability: number
  let difficulty: number
  if (card.reps === 0 || card.lastReview === null) {
    stability = W[g - 1]
    difficulty = initDifficulty(g)
  } else {
    const elapsed = Math.max(0, (now - card.lastReview) / DAY_MS)
    const r = retrievability(elapsed, card.stability)
    difficulty = nextDifficulty(card.difficulty, g)
    stability = g === 1 ? forgetStability(card.difficulty, card.stability, r) : recallStability(card.difficulty, card.stability, r, g)
  }
  const due = g === 1 ? now + RELEARN_MS : now + intervalDays(stability) * DAY_MS
  return {
    due,
    stability,
    difficulty,
    reps: card.reps + 1,
    lapses: card.lapses + (g === 1 && card.reps > 0 ? 1 : 0),
    lastReview: now,
  }
}

/** A card counts as "learned" once it has survived at least one interval. */
export function isLearned(card: SrsCard): boolean {
  return card.reps > 0 && card.stability >= 1
}
