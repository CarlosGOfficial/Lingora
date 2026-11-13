import type { Course, Item, Unit } from '../content/types'
import { buildUnitReview, type Exercise } from './exercises'

/*
 * Placement test: a binary search over the course's units. Each round tests one unit with a
 * few questions; doing well there means you know it (and everything before), so the search
 * moves up, otherwise down. About five rounds of five questions (~25) place anyone in a
 * course of up to ~32 units; bigger courses get a sixth round.
 */

export const PLACEMENT_QUESTIONS = 5
/** Right answers out of PLACEMENT_QUESTIONS to count a unit as known. */
export const PLACEMENT_PASS = 4
export const PLACEMENT_MAX_ROUNDS = 6

export interface PlacementState {
  /** Units [0, lo) are known; the answer is somewhere in [lo, hi]. */
  lo: number
  hi: number
  rounds: { unit: number; correct: number; graded: number }[]
}

export const startPlacement = (units: number): PlacementState => ({ lo: 0, hi: units, rounds: [] })

/** The unit to test next, or null when placed. */
export function nextUnit(s: PlacementState): number | null {
  if (s.lo >= s.hi || s.rounds.length >= PLACEMENT_MAX_ROUNDS) return null
  return Math.floor((s.lo + s.hi) / 2)
}

/** Record a round's score on `unit` and narrow the search. */
export function recordRound(s: PlacementState, unit: number, correct: number, graded: number): PlacementState {
  // Scaled, so a round with fewer gradable questions is judged fairly.
  const passed = graded > 0 && correct / graded >= PLACEMENT_PASS / PLACEMENT_QUESTIONS
  return {
    lo: passed ? unit + 1 : s.lo,
    hi: passed ? s.hi : unit,
    rounds: [...s.rounds, { unit, correct, graded }],
  }
}

/** Where you're placed: the number of units you know (start at unit `placedAt`). */
export const placedAt = (s: PlacementState) => s.lo

/** A round's questions: recognition and production only (no speaking, no matching), so it's quick. */
export function placementQuestions(unit: Unit, course: Course, listening: boolean): Exercise[] {
  return buildUnitReview(unit, course, { listening, speaking: false })
    .filter((e) => e.type !== 'match' && e.type !== 'speak')
    .slice(0, PLACEMENT_QUESTIONS)
}

/** Everything learned in the units you placed past: their lessons are marked done and their words become known cards. */
export function placementImport(course: Course, units: number): { lessonIds: string[]; items: Item[] } {
  const done = course.units.slice(0, units)
  const lessons = done.flatMap((u) => u.lessons)
  const seen = new Set<string>()
  const items = lessons.flatMap((l) => [...l.items, ...l.sentences]).filter((i) => !seen.has(i.id) && seen.add(i.id))
  return { lessonIds: lessons.map((l) => l.id), items }
}
