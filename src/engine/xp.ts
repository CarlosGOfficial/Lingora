import { XP } from '../config'

export type SessionKind = 'lesson' | 'review' | 'practice'

export interface XpBreakdown {
  base: number
  combo: number
  perfect: number
  total: number
}

const BASE: Record<SessionKind, number> = { lesson: XP.lessonBase, review: XP.reviewBase, practice: XP.practiceBase }

/** XP for a finished session, given its graded answers and the combo XP earned during it. */
export function sessionXp(kind: SessionKind, s: { graded: number; correct: number; comboXp: number }): XpBreakdown {
  const base = BASE[kind]
  const combo = Math.min(XP.comboMax, s.comboXp)
  const perfect = s.graded > 0 && s.correct === s.graded ? XP.perfectBonus : 0
  return { base, combo, perfect, total: base + combo + perfect }
}

/** Combo XP earned by reaching `streak` correct in a row (given what's been earned so far). */
export function comboReward(streak: number, earned: number): number {
  return streak > 0 && streak % XP.comboStep === 0 && earned < XP.comboMax ? 1 : 0
}
