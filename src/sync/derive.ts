import { MAX_FREEZES } from '../config'
import type { LangCode } from '../content/types'
import { dayKey } from '../lib/date'
import { newCard, review } from '../lib/fsrs'
import type { ShopLog } from '../shop/wallet'
import { bump, emptyStreak, reconcile, type Streak } from '../store/streak'
import type { CardRecord, LangProgress } from '../store/useStore'
import type { Snapshot } from './types'

export interface Derived {
  progress: Record<LangCode, LangProgress>
  xpByDay: Record<string, number>
  streak: Streak
  shop: ShopLog
}

const emptyLang = (): LangProgress => ({ completedLessons: [], completedReadings: [], cards: {}, xp: 0 })

/**
 * Rebuild all progress from the server's event log. Deterministic: every device
 * replaying the same events through FSRS ends up with identical card states.
 */
export function derive(snap: Snapshot, today: string): Derived {
  const progress: Record<LangCode, LangProgress> = { zh: emptyLang(), ja: emptyLang(), pt: emptyLang() }

  for (const imp of snap.imports) progress[imp.lang].cards[imp.itemId] = { ...imp.state, itemId: imp.itemId }

  const reviews = [...snap.reviews].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))
  for (const r of reviews) {
    const cards = progress[r.lang].cards
    const prev: CardRecord = cards[r.itemId] ?? { ...newCard(r.at), itemId: r.itemId }
    // Imported snapshots already include everything up to their last review.
    if (prev.lastReview !== null && r.at <= prev.lastReview) continue
    cards[r.itemId] = { ...review(prev, r.rating, r.at), itemId: r.itemId }
  }

  for (const c of snap.completions) {
    const p = progress[c.lang]
    const list = c.kind === 'lesson' ? p.completedLessons : p.completedReadings
    if (!list.includes(c.refId)) list.push(c.refId)
  }

  const xpByDay: Record<string, number> = {}
  for (const e of snap.xp) {
    progress[e.lang].xp += e.xp
    xpByDay[e.day] = (xpByDay[e.day] ?? 0) + e.xp
  }

  // Replay the streak day by day; bought freezes are added on the day they were bought.
  const freezesBought: Record<string, number> = {}
  for (const p of snap.purchases) if (p.itemId === 'pw_freeze') freezesBought[dayKey(new Date(p.at))] = (freezesBought[dayKey(new Date(p.at))] ?? 0) + 1
  let streak = emptyStreak()
  const days = [...new Set([...Object.keys(xpByDay), ...Object.keys(freezesBought)])].filter((d) => d <= today).sort()
  for (const day of days) {
    if (freezesBought[day]) {
      const r = reconcile(streak, day) // missed days before this one use the freezes held then
      streak = { ...r, freezes: Math.min(MAX_FREEZES, r.freezes + freezesBought[day]) }
    }
    if (xpByDay[day] > 0) streak = bump(streak, day)
  }
  streak = reconcile(streak, today)

  const shop: ShopLog = {
    purchases: [...snap.purchases].sort((a, b) => a.at - b.at),
    claims: [...snap.claims].sort((a, b) => a.day - b.day),
  }
  return { progress, xpByDay, streak, shop }
}
