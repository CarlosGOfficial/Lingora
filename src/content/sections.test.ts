import { describe, expect, it } from 'vitest'
import { COURSES, LANG_CODES, allLessons } from '.'
import { currentSectionIndex, isSectionComplete, lessonsBefore, levelLabel, sectionLessons, sections } from './sections'

describe.each(LANG_CODES)('course sections: %s', (lang) => {
  const course = COURSES[lang]
  const all = sections(course)

  it('has one named section per level, in order, covering every lesson once', () => {
    expect(all.map((s) => s.level)).toEqual([...new Set(course.units.map((u) => u.level))])
    expect(all).toHaveLength(3)
    for (const s of all) {
      expect(s.title, s.level).not.toBe(s.level)
      expect(s.blurb.length, s.level).toBeGreaterThan(20)
      expect(s.units.length, s.level).toBeGreaterThanOrEqual(4)
    }
    expect(all.flatMap(sectionLessons).map((l) => l.id)).toEqual(allLessons(course).map((x) => x.lesson.id))
  })

  it('follows your progress and covers everything before a section in its jump test', () => {
    expect(currentSectionIndex(course, [])).toBe(0)
    const firstDone = sectionLessons(all[0]).map((l) => l.id)
    expect(isSectionComplete(all[0], firstDone)).toBe(true)
    expect(currentSectionIndex(course, firstDone)).toBe(1)
    expect(lessonsBefore(course, 2).map((l) => l.id)).toEqual([...firstDone, ...sectionLessons(all[1]).map((l) => l.id)])
  })

  it('labels levels without repeating the standard', () => {
    for (const s of all) expect(levelLabel(course, s.level).split(' ').filter((w) => w === course.standard.split(' ')[0]).length).toBeLessThanOrEqual(1)
  })
})
