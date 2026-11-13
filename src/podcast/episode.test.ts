import { describe, expect, it } from 'vitest'
import { COURSES } from '../content'
import { KNOWN_MIN, courseEpisode, finishedUnits, knownItems, knownRatio, knownSet, validEpisodeBody } from './episode'

describe('podcast episodes', () => {
  for (const lang of ['zh', 'ja', 'pt'] as const) {
    const course = COURSES[lang]
    it(`${lang}: every unit makes a valid, fully known course episode`, () => {
      for (const [i, unit] of course.units.entries()) {
        const ep = courseEpisode(course, unit)
        expect(ep, unit.id).not.toBeNull()
        expect(validEpisodeBody(ep)).toBe(true)
        const known = knownSet(lang, knownItems(course.units.slice(0, i + 1)))
        expect(knownRatio(lang, ep!.lines, known).ratio).toBeGreaterThanOrEqual(KNOWN_MIN)
        for (const q of ep!.questions) expect(q.options[q.answer]).toBeTruthy()
      }
    })
  }

  it('measures unknown words and characters', () => {
    const zh = knownSet('zh', [{ id: 'a', kind: 'word', target: '你好', meaning: 'hi' } as never])
    expect(knownRatio('zh', [{ target: '你好！你好吗？' }], zh)).toEqual({ ratio: 4 / 5, unknown: ['吗'] })
    const pt = knownSet('pt', [{ id: 'b', kind: 'word', target: 'Obrigado', meaning: 'thanks' } as never])
    expect(knownRatio('pt', [{ target: 'Muito obrigado, amigo.' }], pt)).toEqual({ ratio: 2 / 3, unknown: ['amigo'] })
  })

  it('finished units are the ones with every lesson done', () => {
    const course = COURSES.zh
    const first = course.units[0].lessons.map((l) => l.id)
    expect(finishedUnits(course, first).map((u) => u.id)).toEqual([course.units[0].id])
    expect(finishedUnits(course, first.slice(1))).toEqual([])
  })

  it('rejects malformed bodies', () => {
    const ep = courseEpisode(COURSES.pt, COURSES.pt.units[0])!
    expect(validEpisodeBody({ ...ep, questions: ep.questions.slice(0, 2) })).toBe(false)
    expect(validEpisodeBody({ ...ep, lines: ep.lines.map((l) => ({ ...l, speaker: 2 })) })).toBe(false)
    expect(validEpisodeBody({ ...ep, questions: ep.questions.map((q) => ({ ...q, answer: 9 })) })).toBe(false)
  })
})
