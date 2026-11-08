import { describe, expect, it } from 'vitest'
import { COURSES } from '../content'
import type { CardRecord } from '../store/useStore'
import { mistakesIn } from './MistakesPage'

const now = Date.UTC(2026, 10, 8)
const items = COURSES.ja.units[0].lessons[0].items
const card = (i: number, lapses: number, stability: number, daysAgo: number | null): CardRecord => ({
  itemId: items[i].id, due: now, stability, difficulty: 5, reps: 4, lapses, lastReview: daysAgo === null ? null : now - daysAgo * 86_400_000,
})

describe('mistakes notebook', () => {
  it('lists only items forgotten at least once, most-forgotten first, then weakest memory', () => {
    const cards = Object.fromEntries([card(0, 0, 10, 1), card(1, 1, 20, 1), card(2, 3, 5, 2), card(3, 1, 1, 5)].map((c) => [c.itemId, c]))
    const list = mistakesIn(cards, now)
    expect(list.map((m) => m.item.id)).toEqual([items[2].id, items[3].id, items[1].id])
    expect(list.every((m) => m.recall > 0 && m.recall <= 1)).toBe(true)
    expect(list[1].recall).toBeLessThan(list[2].recall) // same lapses: weaker memory first
  })

  it('skips cards for items that no longer exist', () => {
    const gone: CardRecord = { itemId: 'nope-123', due: now, stability: 1, difficulty: 5, reps: 3, lapses: 4, lastReview: now }
    expect(mistakesIn({ gone }, now)).toEqual([])
  })
})
