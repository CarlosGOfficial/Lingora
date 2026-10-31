import { useEffect, useRef, useState } from 'react'
import type { XpBreakdown } from '../engine/xp'
import { celebrate } from '../lib/celebrate'
import { COINS_PER_XP, SHOP_ITEM_BY_ID, levelFromXp, levelUpCoins } from '../shop/catalog'
import { totalXp } from '../shop/wallet'
import { todayXp, useStore } from '../store/useStore'
import { Icon } from './Icon'

interface Props {
  title: string
  xp: number
  /** Where the XP came from (lesson, combo, perfect); omitted for flat rewards like stories. */
  breakdown?: XpBreakdown
  baseLabel?: string
  accuracy?: number
  durationMs?: number
  streakBefore: number
  onContinue(): void
}

/** Counts from 0 up to `to` (instantly when the user prefers reduced motion). */
function useCountUp(to: number, ms = 900) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return setN(to)
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      setN(Math.round(to * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, ms])
  return n
}

export function CompleteScreen({ title, xp, breakdown, baseLabel = 'Lesson complete', accuracy, durationMs, streakBefore, onContinue }: Props) {
  const streak = useStore((s) => s.streak.current)
  const xpByDay = useStore((s) => s.xpByDay)
  const dailyGoal = useStore((s) => s.dailyGoal)
  const celebrationId = useStore((s) => s.appearance.equipped.celebration)
  const extended = streak > streakBefore
  const mins = durationMs ? Math.max(1, Math.round(durationMs / 60_000)) : null
  const shownXp = useCountUp(xp)

  // The session's XP is already counted, so "before" values subtract it.
  const total = totalXp(xpByDay)
  const levelNow = levelFromXp(total)
  const leveledUp = levelNow > levelFromXp(total - xp)
  const coins = xp * COINS_PER_XP + (leveledUp ? levelUpCoins(levelNow) : 0)
  const today = todayXp(xpByDay)
  const goalReachedNow = today >= dailyGoal && today - xp < dailyGoal

  const played = useRef(false)
  useEffect(() => {
    if (played.current) return
    played.current = true
    celebrate(SHOP_ITEM_BY_ID.get(celebrationId ?? '')?.celebration ?? 'confetti')
  }, [celebrationId])

  const rows = breakdown
    ? [
        { label: baseLabel, value: breakdown.base, icon: 'check' as const },
        { label: 'Combo bonus', value: breakdown.combo, icon: 'flame' as const },
        { label: 'Perfect — no mistakes!', value: breakdown.perfect, icon: 'star' as const },
      ].filter((r) => r.value > 0)
    : []

  return (
    <div className="complete">
      <div className="complete-burst">
        <Icon name="star" size={64} filled />
      </div>
      <h1>
        <span className="hero-gradient">{title}</span>
      </h1>

      <div className="xp-total" aria-label={`${xp} XP earned`}>
        <Icon name="bolt" filled size={34} />
        <span>+{shownXp}</span>
        <small>XP</small>
      </div>

      {rows.length > 0 && (
        <ul className="xp-breakdown">
          {rows.map((r, i) => (
            <li key={r.label} style={{ animationDelay: `${150 + i * 120}ms` }}>
              <Icon name={r.icon} filled={r.icon !== 'check'} size={16} />
              <span className="grow">{r.label}</span>
              <strong>+{r.value}</strong>
            </li>
          ))}
        </ul>
      )}

      <div className="goal-progress">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="small">{goalReachedNow ? 'Daily goal complete! 🎉' : today >= dailyGoal ? 'Daily goal done — bonus XP!' : 'Daily goal'}</span>
          <span className="small muted">
            {today} / {dailyGoal} XP
          </span>
        </div>
        <div className="progress thin goal-bar">
          <div style={{ width: `${Math.min(1, today / dailyGoal) * 100}%` }} />
        </div>
      </div>

      <div className="complete-stats">
        <div className="stat-tile tone-coin">
          <span className="stat-label">Coins</span>
          <span className="stat-value">+{coins}</span>
        </div>
        {accuracy !== undefined && (
          <div className="stat-tile tone-success">
            <span className="stat-label">Accuracy</span>
            <span className="stat-value">{Math.round(accuracy * 100)}%</span>
          </div>
        )}
        {mins && (
          <div className="stat-tile tone-accent">
            <span className="stat-label">Time</span>
            <span className="stat-value">{mins} min</span>
          </div>
        )}
      </div>
      {leveledUp && (
        <div className="streak-banner level-banner">
          <Icon name="star" filled size={24} />
          <span>
            Level {levelNow}! +{levelUpCoins(levelNow)} bonus coins — new items may be unlocked in the shop.
          </span>
        </div>
      )}
      {extended && (
        <div className="streak-banner">
          <Icon name="flame" filled size={28} />
          <span>
            {streak === 1 ? 'Streak started!' : `${streak} day streak!`} Come back tomorrow to keep it going.
          </span>
        </div>
      )}
      <button className="btn btn-primary btn-lg" autoFocus onClick={onContinue}>
        Continue
      </button>
    </div>
  )
}
