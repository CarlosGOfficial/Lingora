import { describe, expect, it } from 'vitest'
import { DUEL_QUESTIONS, buildDuel, eloDeltas, publicQuestions } from './duel'

describe('duels', () => {
  it('builds the same 10 questions from the same seed', () => {
    for (const lang of ['zh', 'ja', 'pt'] as const) {
      const a = buildDuel(lang, 'core', 1234)
      expect(a).toHaveLength(DUEL_QUESTIONS)
      expect(buildDuel(lang, 'core', 1234)).toEqual(a)
      expect(buildDuel(lang, 'core', 99)).not.toEqual(a)
    }
  })
  it('every question has 4 different options, one of them right', () => {
    for (const q of buildDuel('ja', 'all', 7)) {
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options.map((o) => o.text)).size).toBe(4)
      expect(q.options.filter((o) => o.id === q.answer)).toHaveLength(1)
    }
  })
  it('what the browser gets has no answers', () => {
    expect(JSON.stringify(publicQuestions(buildDuel('pt', 'starter', 5)))).not.toContain('"answer"')
  })
  it('rating changes add up to zero, and upsets pay more', () => {
    const [a, b] = eloDeltas(1000, 1000, 1)
    expect(a).toBe(16)
    expect(a + b).toBe(0)
    expect(eloDeltas(900, 1200, 1)[0]).toBeGreaterThan(eloDeltas(1200, 900, 1)[0])
  })
})
