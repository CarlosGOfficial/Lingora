import { describe, expect, it } from 'vitest'
import { COURSES, allItems } from '../content'
import { QUEST_POOL, questsFor } from '../content/goals'
import { buildPractice, buildReadAloud } from './exercises'

describe('speaking practice', () => {
  const course = COURSES.pt
  const items = allItems(course).slice(0, 60)
  it('mixes shadowing, echo and say-it, without repeating an item', () => {
    const ex = buildPractice('speaking', items, course, { listening: true, speaking: true })
    const modes = ex.map((e) => (e.type === 'speak' ? e.mode : null))
    expect(modes.filter((m) => m === 'shadow').length).toBeGreaterThan(0)
    expect(modes).toContain('echo')
    expect(modes).toContain('say')
    const ids = ex.map((e) => (e.type === 'speak' ? e.item.id : ''))
    expect(new Set(ids).size).toBe(ids.length)
    // "Say it" is for words (short, one clear answer).
    for (const e of ex) if (e.type === 'speak' && e.mode === 'say') expect(e.item.kind).toBe('word')
  })
  it('reads a passage aloud, up to 10 sentences', () => {
    const sentences = items.filter((i) => i.kind === 'sentence')
    const ex = buildReadAloud(sentences)
    expect(ex.length).toBe(Math.min(10, sentences.length))
    expect(ex.every((e) => e.type === 'speak' && e.mode === 'read')).toBe(true)
  })
})

describe('the speaking quest', () => {
  it('is only offered to people who have spoken before', () => {
    expect(QUEST_POOL.some((q) => q.metric === 'speak')).toBe(true)
    for (let d = 1; d <= 28; d++) {
      const day = `2026-11-${String(d).padStart(2, '0')}`
      expect(questsFor('u1', day).some((q) => q.metric === 'speak')).toBe(false)
    }
    const offered = Array.from({ length: 28 }, (_, d) => questsFor('u1', `2026-11-${String(d + 1).padStart(2, '0')}`, { speaker: true })).filter((qs) => qs.some((q) => q.metric === 'speak'))
    expect(offered.length).toBeGreaterThan(0)
  })
})
