import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CompleteScreen } from '../components/CompleteScreen'
import { SessionRunner, type SessionSummary } from '../components/SessionRunner'
import { findLesson } from '../content'
import { buildLesson, effectiveOpts } from '../engine/exercises'
import { sessionXp, type XpBreakdown } from '../engine/xp'
import { useStore } from '../store/useStore'

export function LessonPage() {
  const { lessonId = '' } = useParams()
  const navigate = useNavigate()
  const found = findLesson(lessonId)
  const settings = useStore((s) => s.settings)
  const recordSession = useStore((s) => s.recordSession)
  const streakBefore = useStore((s) => s.streak.current)
  const [exercises] = useState(() => (found ? buildLesson(found.lesson, found.course, effectiveOpts(settings, found.course)) : []))
  const [done, setDone] = useState<(SessionSummary & { xp: XpBreakdown; streakBefore: number }) | null>(null)

  if (!found) return <Navigate to="/" replace />

  const finish = (sum: SessionSummary) => {
    const xp = sessionXp('lesson', sum)
    const before = streakBefore
    recordSession({ lang: found.course.lang, xp: xp.total, ratings: sum.ratings, lessonId })
    setDone({ ...sum, xp, streakBefore: before })
  }

  if (done) {
    return (
      <CompleteScreen
        title="Lesson complete!"
        xp={done.xp.total}
        breakdown={done.xp}
        accuracy={done.graded ? done.correct / done.graded : undefined}
        durationMs={done.durationMs}
        streakBefore={done.streakBefore}
        onContinue={() => navigate('/')}
      />
    )
  }
  return <SessionRunner exercises={exercises} course={found.course} onFinish={finish} onExit={() => navigate('/')} />
}
