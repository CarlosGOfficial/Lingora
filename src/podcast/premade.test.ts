import { describe, expect, it } from 'vitest'
import { COURSES } from '../content'
import { KNOWN_MIN, validEpisodeBody } from './episode'
import { premadeEpisodes } from './premade'

describe('premade podcasts', () => {
  for (const lang of ['zh', 'ja', 'pt'] as const) {
    const course = COURSES[lang]
    const eps = premadeEpisodes(lang)
    it(`${lang}: one after every second unit, in course order`, () => {
      expect(eps.length).toBe(8)
      const at = eps.map((e) => course.units.findIndex((u) => u.id === e.unitId))
      expect(at.every((i) => i >= 0)).toBe(true)
      expect([...at].sort((a, b) => a - b)).toEqual(at)
      expect(new Set(eps.map((e) => e.id)).size).toBe(eps.length)
    })
    it(`${lang}: every episode is well formed and at least ${KNOWN_MIN * 100}% known where it sits`, () => {
      for (const e of eps) {
        expect(validEpisodeBody(e), e.id).toBe(true)
        expect(e.known, `${e.id} ${e.title}`).toBeGreaterThanOrEqual(KNOWN_MIN)
        if (lang !== 'pt') expect(e.lines.every((l) => l.reading.length > 0), e.id).toBe(true)
      }
    })
  }
})
