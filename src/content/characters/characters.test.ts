import { describe, expect, it } from 'vitest'
import { COURSES, GRAMMAR, allItems } from '..'
import { hanIn, type CharData } from '.'
import zh from './zh.json'
import ja from './ja.json'

const DATA = { zh: zh as unknown as CharData, ja: ja as unknown as CharData }

describe.each(['zh', 'ja'] as const)('character data: %s', (lang) => {
  const data = DATA[lang]
  it('covers every character the course uses', () => {
    const used = new Set<string>()
    for (const it of allItems(COURSES[lang])) for (const c of hanIn(it.target)) used.add(c)
    for (const u of COURSES[lang].units) for (const s of u.reading?.sentences ?? []) for (const c of hanIn(s.target)) used.add(c)
    for (const [id, points] of Object.entries(GRAMMAR)) if (id.startsWith(lang)) for (const p of points) for (const e of p.examples) for (const c of hanIn(e.target)) used.add(c)
    const missing = [...used].filter((c) => !data.chars[c])
    expect(missing).toEqual([])
    expect(used.size).toBeGreaterThan(200)
  })
  it('every entry has a radical with a name, a stroke count, a reading and parts that are characters', () => {
    for (const [c, info] of Object.entries(data.chars)) {
      expect(data.radicals[info.r]?.name, c).toBeTruthy()
      expect(info.s, c).toBeGreaterThan(0)
      expect(lang === 'zh' ? !!info.py : !!(info.on?.length || info.kun?.length), c).toBe(true)
      for (const p of info.p) expect(p, c).toMatch(/^[⺀-⿕㐀-䶿一-鿿]$/u)
    }
  })
  it('known entries', () => {
    if (lang === 'zh') {
      expect(data.chars['好']).toMatchObject({ r: 38, s: 6, py: 'hǎo', p: ['女', '子'] })
      expect(data.chars['语']).toMatchObject({ r: 149, rf: '讠' })
    } else {
      expect(data.chars['語']).toMatchObject({ r: 149, rf: '言', s: 14, on: ['ゴ'], p: ['言', '吾'] })
      expect(data.chars['食'].kun).toContain('た.べる')
    }
  })
})
