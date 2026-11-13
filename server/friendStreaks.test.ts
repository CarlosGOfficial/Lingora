import { describe, expect, it } from 'vitest'
import { dayStreak, sharedStreak, trioCoins } from './ops'

const days = (...d: string[]) => new Set(d)

describe('friend streaks', () => {
  it('counts days in a row you were both active, through yesterday until today is in', () => {
    const me = days('2026-11-10', '2026-11-11', '2026-11-12')
    const them = days('2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13')
    // Today (13th): they played, I haven't yet: the streak is 3 and at risk.
    expect(sharedStreak(me, them, '2026-11-13')).toEqual({ days: 3, aToday: false, bToday: true })
    me.add('2026-11-13')
    expect(sharedStreak(me, them, '2026-11-13')).toEqual({ days: 4, aToday: true, bToday: true })
  })
  it('a day only one of you was active breaks it', () => {
    const me = days('2026-11-10', '2026-11-12', '2026-11-13')
    const them = days('2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13')
    expect(sharedStreak(me, them, '2026-11-13').days).toBe(2)
  })
  it('nothing yesterday and nothing today: no streak', () => {
    expect(sharedStreak(days('2026-11-10'), days('2026-11-10'), '2026-11-13').days).toBe(0)
  })
  it('works across month and year ends (UTC days)', () => {
    expect(dayStreak(['2025-12-30', '2025-12-31', '2026-01-01'], '2026-01-01')).toBe(3)
    expect(dayStreak(['2026-02-27', '2026-02-28', '2026-03-01'], '2026-03-01')).toBe(3)
    expect(dayStreak(['2028-02-28', '2028-02-29', '2028-03-01'], '2028-03-01')).toBe(3)
  })
  it('the daily trio pays more every 7th day', () => {
    expect([1, 6, 7, 8, 14].map(trioCoins)).toEqual([40, 40, 120, 40, 120])
  })
})
