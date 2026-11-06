import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CompleteScreen } from '../components/CompleteScreen'
import { SessionRunner, type SessionSummary } from '../components/SessionRunner'
import { COURSES, getItem } from '../content'
import type { Item } from '../content/types'
import { buildPractice, effectiveOpts, type PracticeMode } from '../engine/exercises'
import { sessionXp, type XpBreakdown } from '../engine/xp'
import { useStore } from '../store/useStore'

const MODES: PracticeMode[] = ['speaking', 'listening', 'weak', 'writing']

export function PracticeSession() {
  const { mode = '' } = useParams()
  const navigate = useNavigate()
  const { activeLang, progress, recordSession, streak } = useStore()
  const course = COURSES[activeLang]
  const [exercises] = useState(() => {
    if (!MODES.includes(mode as PracticeMode)) return []
    const opts = effectiveOpts({ listening: true, speaking: true }, course)
    if (mode === 'listening' && !opts.listening) return []
    if (mode === 'writing' && course.lang === 'pt') return []
    const items = Object.values(progress[activeLang].cards)
      .sort((a, b) => a.stability - b.stability)
      .map((c) => getItem(c.itemId))
      .filter((x): x is Item => !!x)
    return items.length >= 4 ? buildPractice(mode as PracticeMode, items, course, opts) : []
  })
  const [done, setDone] = useState<{ xp: XpBreakdown; accuracy: number; durationMs: number; streakBefore: number } | null>(null)

  if (!exercises.length) return <Navigate to="/practice" replace />

  const finish = (sum: SessionSummary) => {
    const xp = sessionXp('practice', sum)
    const before = streak.current
    recordSession({ lang: activeLang, xp: xp.total, ratings: sum.ratings })
    setDone({ xp, accuracy: sum.graded ? sum.correct / sum.graded : 1, durationMs: sum.durationMs, streakBefore: before })
  }

  if (done) {
    return (
      <CompleteScreen
        title="Practice complete!"
        xp={done.xp.total}
        breakdown={done.xp}
        baseLabel="Practice complete"
        accuracy={done.accuracy}
        durationMs={done.durationMs}
        streakBefore={done.streakBefore}
        onContinue={() => navigate('/practice')}
      />
    )
  }
  return <SessionRunner exercises={exercises} course={course} onFinish={finish} onExit={() => navigate('/practice')} />
}
