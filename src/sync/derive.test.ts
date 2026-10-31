import { describe, expect, it } from 'vitest'
import { newCard, review } from '../lib/fsrs'
import { derive } from './derive'
import type { Snapshot } from './types'

const T = Date.UTC(2026, 9, 1, 12)
const base = (): Snapshot => ({
  account: { id: 'u1', username: 'tester', prefs: {} },
  reviews: [],
  imports: [],
  xp: [],
  completions: [],
  purchases: [],
  claims: [],
})

describe('derive (event replay)', () => {
  it('replays reviews through FSRS in time order, regardless of arrival order', () => {
    const snap: Snapshot = {
      ...base(),
      completions: [{ refId: 'zh-u1-l1', lang: 'zh', kind: 'lesson', at: T }],
      xp: [
        { lang: 'zh', day: '2026-10-01', xp: 10 },
        { lang: 'ja', day: '2026-10-02', xp: 5 },
      ],
      reviews: [
        { id: 'b', itemId: 'zh-nihao', lang: 'zh', rating: 3, at: T + 4 * 86_400_000 },
        { id: 'a', itemId: 'zh-nihao', lang: 'zh', rating: 3, at: T },
      ],
    }
    const d = derive(snap, '2026-10-02')
    const expected = review(review(newCard(T), 3, T), 3, T + 4 * 86_400_000)
    expect(d.progress.zh.cards['zh-nihao']).toMatchObject({ stability: expected.stability, due: expected.due, reps: 2 })
    expect(d.progress.zh.completedLessons).toEqual(['zh-u1-l1'])
    expect(d.progress.zh.xp).toBe(10)
    expect(d.xpByDay).toEqual({ '2026-10-01': 10, '2026-10-02': 5 })
    expect(d.streak.current).toBe(2)
  })

  it('applies only reviews newer than an imported card snapshot', () => {
    const state = review(newCard(T), 3, T)
    const snap: Snapshot = {
      ...base(),
      imports: [{ itemId: 'pt-oi', lang: 'pt', state }],
      reviews: [{ id: 'old', itemId: 'pt-oi', lang: 'pt', rating: 1, at: T - 1000 }],
    }
    expect(derive(snap, '2026-10-01').progress.pt.cards['pt-oi']).toMatchObject({ stability: state.stability, reps: 1 })
  })

  it('a bought Streak Freeze covers a later missed day', () => {
    const noon = (day: string) => new Date(`${day}T12:00:00`).getTime()
    const snap: Snapshot = {
      ...base(),
      xp: [
        { lang: 'zh', day: '2026-10-01', xp: 10 },
        { lang: 'zh', day: '2026-10-03', xp: 10 },
      ],
      purchases: [{ id: 'p1', itemId: 'pw_freeze', price: 200, at: noon('2026-10-01') }],
    }
    const d = derive(snap, '2026-10-03')
    expect(d.streak.current).toBe(2)
    expect(d.streak.frozenDays).toEqual(['2026-10-02'])
    expect(d.shop.purchases).toHaveLength(1)
  })
})
