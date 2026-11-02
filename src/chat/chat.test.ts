import { describe, expect, it } from 'vitest'
import { validateChat } from '../../server/chat'
import { COURSES, LANG_CODES } from '../content'
import { learnerContext, scenarios } from './context'

describe.each(LANG_CODES)('conversation context: %s', (lang) => {
  const course = COURSES[lang]
  const firstUnit = course.units[0]
  const done = firstUnit.lessons.slice(0, 2).map((l) => l.id)

  it('offers role-plays from started units plus free chat', () => {
    const list = scenarios(course, done)
    expect(list.map((s) => s.goal)).toEqual([...firstUnit.canDo, expect.any(String)])
    expect(list[list.length - 1].id).toBe('free')
  })

  it('only includes words from finished lessons, and passes server validation', () => {
    const ctx = learnerContext(course, done, scenarios(course, done)[0])
    const learned = new Set(firstUnit.lessons.slice(0, 2).flatMap((l) => l.items.map((i) => i.target)))
    expect(ctx.words.length).toBeGreaterThan(0)
    expect(ctx.words.every((w) => learned.has(w.target))).toBe(true)
    expect(() => validateChat({ ...ctx, messages: [{ role: 'user', text: 'hi' }] })).not.toThrow()
  })

  it('rejects malformed or oversized requests', () => {
    const ctx = learnerContext(course, done, scenarios(course, done)[0])
    expect(() => validateChat({ ...ctx, messages: [{ role: 'system', text: 'x' }] })).toThrow()
    expect(() => validateChat({ ...ctx, messages: [{ role: 'user', text: 'x'.repeat(401) }] })).toThrow()
    expect(() => validateChat({ ...ctx, lang: 'fr', messages: [] })).toThrow()
  })
})
