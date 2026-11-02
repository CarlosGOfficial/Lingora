import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CompleteScreen } from '../components/CompleteScreen'
import { SessionRunner, type SessionSummary } from '../components/SessionRunner'
import { findUnit, isUnitComplete, unitReviewId } from '../content'
import { buildUnitReview, effectiveOpts } from '../engine/exercises'
import { sessionXp, type XpBreakdown } from '../engine/xp'
import { useStore } from '../store/useStore'

/** Checkpoint at the end of a unit: mixed practice across all its lessons. */
export function UnitReviewPage() {
  const { unitId = '' } = useParams()
  const navigate = useNavigate()
  const found = findUnit(unitId)
  const settings = useStore((s) => s.settings)
  const recordSession = useStore((s) => s.recordSession)
  const streakBefore = useStore((s) => s.streak.current)
  const completed = useStore((s) => (found ? s.progress[found.course.lang].completedLessons : []))
  const [exercises] = useState(() => (found ? buildUnitReview(found.unit, found.course, effectiveOpts(settings, found.course)) : []))
  const [done, setDone] = useState<(SessionSummary & { xp: XpBreakdown; streakBefore: number }) | null>(null)

  if (!found || (!done && !isUnitComplete(found.unit, completed))) return <Navigate to="/" replace />

  const finish = (sum: SessionSummary) => {
    const xp = sessionXp('lesson', sum)
    recordSession({ lang: found.course.lang, xp: xp.total, ratings: sum.ratings, lessonId: unitReviewId(found.unit.id) })
    setDone({ ...sum, xp, streakBefore })
  }

  if (done) {
    return (
      <CompleteScreen
        title="Unit review complete!"
        xp={done.xp.total}
        breakdown={done.xp}
        baseLabel="Unit review"
        accuracy={done.graded ? done.correct / done.graded : undefined}
        durationMs={done.durationMs}
        streakBefore={done.streakBefore}
        onContinue={() => navigate('/')}
      />
    )
  }
  return <SessionRunner exercises={exercises} course={found.course} onFinish={finish} onExit={() => navigate('/')} />
}
