import { describe, expect, it } from 'vitest'
import { PALETTE_PAGES, paletteScore } from './CommandPalette'

describe('command palette', () => {
  it('ranks the start of a title over the middle, keywords and scattered letters', () => {
    const s = (q: string, title: string, k = '') => paletteScore(q, title, k)
    expect(s('dai', 'Daily Challenge')).toBeGreaterThan(s('dai', 'Play the daily'))
    expect(s('gram', 'Verb & grammar trainer')).toBeGreaterThan(s('gram', 'Programs'))
    expect(s('kanji', 'Character explorer', 'hanzi kanji radicals')).toBeGreaterThan(0)
    expect(s('dly', 'Daily Challenge')).toBeGreaterThan(0)
    expect(s('zzz', 'Daily Challenge', 'today word')).toBe(0)
    expect(s('', 'Anything')).toBeGreaterThan(0)
  })
  it('page ids are unique per app and paths start with a slash', () => {
    for (const pages of Object.values(PALETTE_PAGES)) {
      expect(new Set(pages.map((p) => p.id)).size).toBe(pages.length)
      for (const p of pages) expect(p.path.startsWith('/')).toBe(true)
    }
  })
})
