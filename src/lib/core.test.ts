import { describe, expect, it } from 'vitest'
import { COURSES, allItems } from '../content'
import { comboReward, sessionXp } from '../engine/xp'
import { bump, emptyStreak, reconcile } from '../store/streak'
import { checkTyped, speechScore } from './answer'
import { addDays, daysBetween, weekStart } from './date'
import { DAY_MS, intervalDays, newCard, retrievability, review } from './fsrs'

const T0 = Date.UTC(2026, 0, 1)

describe('FSRS', () => {
  it('first review stability follows the initial weights', () => {
    const again = review(newCard(T0), 1, T0)
    const good = review(newCard(T0), 3, T0)
    const easy = review(newCard(T0), 4, T0)
    expect(again.stability).toBeLessThan(good.stability)
    expect(good.stability).toBeLessThan(easy.stability)
    expect(again.due - T0).toBe(10 * 60_000)
    expect(Math.round((good.due - T0) / DAY_MS)).toBe(4)
  })

  it('at 90% retention the interval equals stability', () => {
    expect(intervalDays(10)).toBe(10)
    expect(retrievability(10, 10)).toBeCloseTo(0.9, 5)
  })

  it('successful reviews grow intervals; lapses shrink them', () => {
    let c = review(newCard(T0), 3, T0)
    const s1 = c.stability
    c = review(c, 3, c.due)
    expect(c.stability).toBeGreaterThan(s1)
    const lapsed = review(c, 1, c.due)
    expect(lapsed.stability).toBeLessThan(c.stability)
    expect(lapsed.lapses).toBe(1)
  })
})

describe('answer checking', () => {
  const zhHello = allItems(COURSES.zh).find((i) => i.id === 'zh-nihao')!
  const jaStudent = allItems(COURSES.ja).find((i) => i.id === 'ja-s-watashiwagakusei')!
  const ptVoce = allItems(COURSES.pt).find((i) => i.id === 'pt-voce')!

  it('accepts characters, pinyin with tones; toneless is "almost"', () => {
    expect(checkTyped('你好', zhHello).quality).toBe('correct')
    expect(checkTyped('nǐ hǎo', zhHello).quality).toBe('correct')
    expect(checkTyped('ni hao', zhHello).quality).toBe('almost')
    expect(checkTyped('xiexie', zhHello).quality).toBe('wrong')
  })

  it('accepts kanji, kana and romaji for Japanese', () => {
    expect(checkTyped('私は学生です', jaStudent).quality).toBe('correct')
    expect(checkTyped('わたしはがくせいです。', jaStudent).quality).toBe('correct')
    expect(checkTyped('Watashi wa gakusei desu', jaStudent).quality).toBe('correct')
  })

  it('treats missing Portuguese accents as almost', () => {
    expect(checkTyped('você', ptVoce).quality).toBe('correct')
    expect(checkTyped('voce', ptVoce).quality).toBe('almost')
  })

  it('scores speech transcripts by similarity', () => {
    expect(speechScore(['私は学生です'], jaStudent)).toBe(1)
    expect(speechScore(['こんにちは'], jaStudent)).toBeLessThan(0.5)
  })
})

describe('session XP', () => {
  it('pays a base, combo bonus (capped) and perfect bonus', () => {
    expect(sessionXp('lesson', { graded: 12, correct: 12, comboXp: 2 })).toEqual({ base: 10, combo: 2, perfect: 5, total: 17 })
    expect(sessionXp('lesson', { graded: 12, correct: 11, comboXp: 9 })).toEqual({ base: 10, combo: 5, perfect: 0, total: 15 })
    expect(sessionXp('practice', { graded: 0, correct: 0, comboXp: 0 }).total).toBe(5)
  })

  it('awards +1 combo XP at every 5 in a row, up to the cap', () => {
    expect([1, 4, 5, 6, 10].map((n) => comboReward(n, 0))).toEqual([0, 0, 1, 0, 1])
    expect(comboReward(15, 5)).toBe(0)
  })
})

describe('dates & streaks', () => {
  it('computes day math', () => {
    expect(daysBetween('2026-10-30', '2026-11-02')).toBe(3)
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(weekStart('2026-10-30')).toBe('2026-10-26') // Friday → Monday
  })

  it('increments on consecutive days, resets after a gap', () => {
    let s = bump(emptyStreak(), '2026-10-01')
    s = bump(s, '2026-10-01')
    expect(s.current).toBe(1)
    s = bump(s, '2026-10-02')
    expect(s.current).toBe(2)
    s = bump(s, '2026-10-05')
    expect(s.current).toBe(1)
    expect(s.longest).toBe(2)
  })

  it('earns a freeze at 7 days and spends it on a missed day', () => {
    let s = emptyStreak()
    for (let i = 0; i < 7; i++) s = bump(s, addDays('2026-10-01', i))
    expect(s.current).toBe(7)
    expect(s.freezes).toBe(1)
    s = reconcile(s, '2026-10-09') // missed the 8th
    expect(s.freezes).toBe(0)
    expect(s.frozenDays).toEqual(['2026-10-08'])
    s = bump(s, '2026-10-09')
    expect(s.current).toBe(8)
  })
})
