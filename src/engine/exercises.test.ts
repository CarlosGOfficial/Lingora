import { describe, expect, it } from 'vitest'
import { COURSES, LANG_CODES, allItems } from '../content'
import { buildLesson, buildUnitReview, cloze, readingDrill } from './exercises'

const opts = { listening: true, speaking: true }

describe.each(LANG_CODES)('exercise generation: %s', (lang) => {
  const course = COURSES[lang]
  const pool = allItems(course)

  it('builds a fill-in-the-blank for every multi-word sentence, with the answer among 4 options', () => {
    for (const s of pool.filter((i) => i.kind === 'sentence' && (i.tokens?.length ?? 0) >= 2)) {
      const ex = cloze(s, pool)
      expect(ex, s.id).not.toBeNull()
      if (ex?.type !== 'cloze') continue
      expect(ex.options).toHaveLength(4)
      expect(new Set(ex.options).size).toBe(4)
      expect(ex.options).toContain(s.tokens![ex.blank])
    }
  })

  it('builds pronunciation drills with the right reading among 4 distinct options', () => {
    const words = pool.filter((i) => i.kind === 'word' && i.reading && i.reading !== i.target)
    if (lang === 'pt') return expect(words).toHaveLength(0)
    let built = 0
    for (const w of words) {
      const ex = readingDrill(w, pool, lang)
      if (ex?.type !== 'reading') continue
      built++
      expect(ex.options).toHaveLength(4)
      expect(new Set(ex.options).size).toBe(4)
      expect(ex.options).toContain(w.reading)
    }
    expect(built / words.length).toBeGreaterThan(0.9)
  })

  it('builds lessons and unit reviews for every unit', () => {
    for (const unit of course.units) {
      for (const lesson of unit.lessons) expect(buildLesson(lesson, course, opts).length, lesson.id).toBeGreaterThan(10)
      const review = buildUnitReview(unit, course, opts)
      expect(review.length, unit.id).toBeGreaterThanOrEqual(12)
      expect(review[0].type).toBe('match')
    }
  })
})
