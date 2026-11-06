import { describe, expect, it } from 'vitest'
import { STORIES } from '.'
import { ACHIEVEMENTS, QUEST_POOL, questsFor } from '../goals'

describe('stories', () => {
  for (const [lang, list] of Object.entries(STORIES)) {
    it(`${lang}: well-formed`, () => {
      expect(list.length).toBeGreaterThan(0)
      const ids = new Set<string>()
      for (const s of list) {
        expect(s.id.startsWith(`story:${lang}-`)).toBe(true)
        expect(ids.has(s.id)).toBe(false)
        ids.add(s.id)
        for (const sc of s.scenes) {
          expect(sc.lines.length).toBeGreaterThan(0)
          expect(sc.question.answer).toBeGreaterThanOrEqual(0)
          expect(sc.question.answer).toBeLessThan(sc.question.options.length)
          for (const l of sc.lines) expect(l.target && l.meaning && l.speaker).toBeTruthy()
          // Chinese lines always carry pinyin.
          if (lang === 'zh') for (const l of sc.lines) expect(l.reading).toBeTruthy()
        }
        // Every glossary word appears somewhere in the story.
        const text = s.scenes.flatMap((sc) => sc.lines.map((l) => l.target)).join(' ').toLowerCase()
        for (const k of Object.keys(s.glossary)) expect(text.includes(k.toLowerCase()), `${s.id}: ${k}`).toBe(true)
      }
    })
  }
})

describe('goals', () => {
  it('picks 3 different quests per day, the same each time', () => {
    const a = questsFor('u1', '2026-11-06'), b = questsFor('u1', '2026-11-06')
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id))
    expect(new Set(a.map((q) => q.id)).size).toBe(3)
    expect(QUEST_POOL.length).toBeGreaterThanOrEqual(3)
  })
  it('has unique achievement ids', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
  })
})
