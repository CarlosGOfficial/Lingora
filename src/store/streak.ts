import { FREEZE_EVERY, MAX_FREEZES } from '../config'
import { addDays, daysBetween } from '../lib/date'

export interface Streak {
  current: number
  longest: number
  lastActiveDay: string | null
  freezes: number
  /** Days covered by a streak freeze (shown on the heatmap). */
  frozenDays: string[]
}

export const emptyStreak = (): Streak => ({ current: 0, longest: 0, lastActiveDay: null, freezes: 0, frozenDays: [] })

/** Apply freezes for missed days, or break the streak. Idempotent per day. */
export function reconcile(streak: Streak, today: string): Streak {
  if (!streak.lastActiveDay) return streak
  const gap = daysBetween(streak.lastActiveDay, today)
  if (gap <= 1) return streak
  const missed = gap - 1
  if (streak.current > 0 && streak.freezes >= missed) {
    const frozen = Array.from({ length: missed }, (_, i) => addDays(streak.lastActiveDay!, i + 1))
    return {
      ...streak,
      freezes: streak.freezes - missed,
      frozenDays: [...streak.frozenDays, ...frozen],
      lastActiveDay: addDays(today, -1),
    }
  }
  return { ...streak, current: 0 }
}

/** Register activity today. Returns the new streak. */
export function bump(streak: Streak, today: string): Streak {
  const s = reconcile(streak, today)
  if (s.lastActiveDay === today) return s
  const continues = s.lastActiveDay !== null && daysBetween(s.lastActiveDay, today) === 1 && s.current > 0
  const current = continues ? s.current + 1 : 1
  const earned = current % FREEZE_EVERY === 0 && s.freezes < MAX_FREEZES ? 1 : 0
  return {
    ...s,
    current,
    longest: Math.max(s.longest, current),
    lastActiveDay: today,
    freezes: s.freezes + earned,
  }
}
