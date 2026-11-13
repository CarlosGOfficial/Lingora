import { describe, expect, it } from 'vitest'
import { COURSES } from '../content'
import { PLACEMENT_MAX_ROUNDS, nextUnit, placedAt, placementImport, placementQuestions, recordRound, startPlacement } from './placement'

/** Simulate a learner who knows exactly the first `known` units. */
function run(units: number, known: number) {
  let s = startPlacement(units)
  let q = 0
  for (let u = nextUnit(s); u !== null; u = nextUnit(s)) {
    s = recordRound(s, u, u < known ? 5 : 2, 5)
    q += 5
  }
  return { at: placedAt(s), questions: q }
}

describe('placement', () => {
  it('finds the exact unit for every level in a 30-unit course, in at most 25 questions', () => {
    for (let known = 0; known <= 30; known++) {
      const r = run(30, known)
      expect(r.at).toBe(known)
      expect(r.questions).toBeLessThanOrEqual(25)
    }
  })

  it('stops after the round limit even in a huge course', () => {
    const r = run(500, 250)
    expect(r.questions).toBe(PLACEMENT_MAX_ROUNDS * 5)
  })

  it('scales the pass mark when a round had fewer questions', () => {
    expect(recordRound(startPlacement(10), 5, 3, 3).lo).toBe(6)
    expect(recordRound(startPlacement(10), 5, 3, 4).hi).toBe(5)
    expect(recordRound(startPlacement(10), 5, 0, 0).hi).toBe(5)
  })

  for (const lang of ['zh', 'ja', 'pt'] as const) {
    it(`${lang}: questions are quick ones, and the import covers earlier lessons`, () => {
      const course = COURSES[lang]
      const qs = placementQuestions(course.units[3], course, true)
      expect(qs.length).toBe(5)
      expect(qs.every((e) => e.type !== 'match' && e.type !== 'speak')).toBe(true)
      const imp = placementImport(course, 4)
      expect(imp.lessonIds).toEqual(course.units.slice(0, 4).flatMap((u) => u.lessons.map((l) => l.id)))
      expect(new Set(imp.items.map((i) => i.id)).size).toBe(imp.items.length)
      expect(imp.items.length).toBeGreaterThan(20)
    })
  }
})
