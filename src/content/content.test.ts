import { describe, expect, it } from 'vitest'
import { normalize } from '../lib/answer'
import { COURSES, GRAMMAR, LANG_CODES, allItems, getGrammar } from '.'

/** Guards against authoring mistakes as the course content grows. */
describe.each(LANG_CODES)('course content: %s', (lang) => {
  const course = COURSES[lang]
  const items = allItems(course)
  const readingSentences = course.units.flatMap((u) => u.reading?.sentences ?? [])

  it('has unique, language-prefixed ids', () => {
    const ids = [
      ...items.map((i) => i.id),
      ...readingSentences.map((i) => i.id),
      ...course.units.map((u) => u.id),
      ...course.units.flatMap((u) => u.lessons.map((l) => l.id)),
      ...course.units.flatMap((u) => (u.reading ? [u.reading.id] : [])),
    ]
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
    for (const id of ids) expect(id.startsWith(`${lang}-`)).toBe(true)
  })

  it('sentence tiles rebuild the sentence exactly', () => {
    for (const s of items.filter((i) => i.kind === 'sentence')) {
      expect(s.tokens?.length, s.id).toBeGreaterThan(0)
      expect(normalize(s.tokens!.join('')), s.id).toBe(normalize(s.target))
    }
  })

  it('has no two words with the same text or meaning', () => {
    const words = items.filter((i) => i.kind === 'word')
    const dup = (key: (i: (typeof words)[number]) => string) => {
      const seen = words.map(key)
      return words.filter((_, i) => seen.indexOf(seen[i]) !== i).map((w) => w.id)
    }
    expect(dup((w) => w.target)).toEqual([])
    expect(dup((w) => w.meaning.toLowerCase())).toEqual([])
  })

  it('gives every lesson enough words for a matching round', () => {
    for (const u of course.units) for (const l of u.lessons) expect(l.items.length, l.id).toBeGreaterThanOrEqual(3)
  })

  it('has well-formed reading questions', () => {
    for (const u of course.units) {
      expect(u.reading, u.id).toBeDefined()
      for (const q of u.reading!.questions) {
        expect(q.answer).toBeGreaterThanOrEqual(0)
        expect(q.answer).toBeLessThan(q.options.length)
        expect(new Set(q.options).size).toBe(q.options.length)
      }
    }
  })

  it('gives readings for CJK languages', () => {
    if (lang === 'pt') return
    for (const it of [...items, ...readingSentences]) expect(it.reading ?? it.romanization, it.id).toBeTruthy()
  })

  it('has grammar notes for every lesson and none for unknown lessons', () => {
    const lessonIds = course.units.flatMap((u) => u.lessons.map((l) => l.id))
    for (const id of lessonIds) expect(getGrammar(id).length, id).toBeGreaterThan(0)
    const orphans = Object.keys(GRAMMAR).filter((id) => id.startsWith(`${lang}-`) && !lessonIds.includes(id))
    expect(orphans).toEqual([])
  })

  it('has grammar examples with readings (CJK) and unique titles', () => {
    for (const id of course.units.flatMap((u) => u.lessons.map((l) => l.id))) {
      const points = getGrammar(id)
      expect(new Set(points.map((p) => p.title)).size, id).toBe(points.length)
      for (const p of points) {
        expect(p.examples.length, p.title).toBeGreaterThan(0)
        if (lang !== 'pt') for (const e of p.examples) expect(e.reading ?? e.romanization, e.target).toBeTruthy()
      }
    }
  })
})
