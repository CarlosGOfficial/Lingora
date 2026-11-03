import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CompleteScreen } from '../components/CompleteScreen'
import { Icon } from '../components/Icon'
import { SessionRunner, type SessionSummary } from '../components/SessionRunner'
import { COURSES } from '../content'
import { JUMP_PASS, currentSectionIndex, lessonsBefore, sections } from '../content/sections'
import { buildUnitReview, effectiveOpts } from '../engine/exercises'
import { sessionXp, type XpBreakdown } from '../engine/xp'
import { useStore } from '../store/useStore'

/**
 * "Jump here": a mixed test on everything before a section. Passing it (80% right the
 * first time) marks those lessons done, so the course continues from that section.
 */
export function SectionTestPage() {
  const { index = '' } = useParams()
  const navigate = useNavigate()
  const activeLang = useStore((s) => s.activeLang)
  const settings = useStore((s) => s.settings)
  const completed = useStore((s) => s.progress[s.activeLang].completedLessons)
  const recordSession = useStore((s) => s.recordSession)
  const streakBefore = useStore((s) => s.streak.current)
  const course = COURSES[activeLang]
  const target = sections(course)[Number(index)]
  const [exercises, setExercises] = useState(() => (target ? build() : []))
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ passed: boolean; score: number; xp: XpBreakdown; durationMs: number } | null>(null)

  function build() {
    const lessons = lessonsBefore(course, target.index)
    // Treat everything before the section as one big unit, and test a longer mix of it.
    const unit = { ...target.units[0], id: `jump-${target.level}`, lessons }
    const opts = effectiveOpts(settings, course)
    const [first, ...rest] = buildUnitReview(unit, course, opts)
    return [first, ...rest, ...buildUnitReview(unit, course, opts).slice(1, 7)]
  }

  // Only sections you haven't reached can be jumped to.
  if (!target || target.index === 0 || (!result && target.index <= currentSectionIndex(course, completed))) return <Navigate to="/sections" replace />

  const finish = (sum: SessionSummary) => {
    const score = sum.graded ? sum.correct / sum.graded : 0
    const passed = score >= JUMP_PASS
    const xp = sessionXp('lesson', sum)
    if (passed) recordSession({ lang: activeLang, xp: xp.total, ratings: sum.ratings, lessonIds: lessonsBefore(course, target.index).map((l) => l.id) })
    setResult({ passed, score, xp, durationMs: sum.durationMs })
  }

  if (result?.passed)
    return (
      <CompleteScreen
        title={`Welcome to Section ${target.index + 1}!`}
        xp={result.xp.total}
        breakdown={result.xp}
        baseLabel="Test passed"
        accuracy={result.score}
        durationMs={result.durationMs}
        streakBefore={streakBefore}
        onContinue={() => navigate('/', { replace: true })}
      />
    )

  if (result)
    return (
      <div className="session">
        <main className="session-body jump-result">
          <Icon name="target" size={48} className="c-accent" />
          <h1>Not quite yet</h1>
          <p className="muted">
            You got <strong>{Math.round(result.score * 100)}%</strong> right — you need {Math.round(JUMP_PASS * 100)}% to jump to Section {target.index + 1}. Keep going from where you
            are, or try again.
          </p>
          <div className="row">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => {
                setExercises(build())
                setAttempt((n) => n + 1)
                setResult(null)
              }}
            >
              Try again
            </button>
            <button className="btn btn-lg" onClick={() => navigate('/sections', { replace: true })}>
              Back to sections
            </button>
          </div>
        </main>
      </div>
    )

  return <SessionRunner key={attempt} exercises={exercises} course={course} onFinish={finish} onExit={() => navigate('/sections')} />
}
