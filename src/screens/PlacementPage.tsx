import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { SessionRunner, type SessionSummary } from '../components/SessionRunner'
import { COURSES } from '../content'
import { levelLabel, sections } from '../content/sections'
import { effectiveOpts } from '../engine/exercises'
import { nextUnit, placedAt, placementImport, placementQuestions, recordRound, startPlacement, type PlacementState } from '../engine/placement'
import { sessionXp } from '../engine/xp'
import type { Rating } from '../lib/fsrs'
import { useStore } from '../store/useStore'

/**
 * "I already know some": a ~25-question adaptive test (see engine/placement). You're placed at
 * a unit; on "Start here" the lessons before it are marked done and their words and sentences
 * become cards you know (reviewed later as usual), so nothing is lost and nothing is repeated.
 */
export function PlacementPage() {
  const navigate = useNavigate()
  const activeLang = useStore((s) => s.activeLang)
  const settings = useStore((s) => s.settings)
  const completed = useStore((s) => s.progress[s.activeLang].completedLessons)
  const recordSession = useStore((s) => s.recordSession)
  const course = COURSES[activeLang]
  const opts = effectiveOpts(settings, course)
  const [state, setState] = useState<PlacementState | null>(null)
  const [answers, setAnswers] = useState<{ ratings: Record<string, Rating>; xp: number }>({ ratings: {}, xp: 0 })
  const unit = state ? nextUnit(state) : null
  const exercises = useMemo(() => (unit === null ? [] : placementQuestions(course.units[unit], course, opts.listening)), [unit, state?.rounds.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // The course's unit → section, for "Section 2 · Unit 3".
  const where = (u: number) => {
    let n = 0
    for (const s of sections(course)) {
      if (u < n + s.units.length) return { section: s, inSection: u - n }
      n += s.units.length
    }
    return null
  }

  if (!state)
    return (
      <div className="session">
        <main className="session-body jump-result" data-testid="placement-intro">
          <Icon name="target" size={48} className="c-accent" />
          <h1>Find your level</h1>
          <p className="muted">
            About 25 quick questions on {course.name}. They get harder when you're right and easier when you're not, so don't worry about what you don't know. Skip anything you
            can't answer.
          </p>
          <div className="row">
            <button className="btn btn-primary btn-lg" data-testid="placement-start" onClick={() => setState(startPlacement(course.units.length))}>
              Start the test
            </button>
            <button className="btn btn-lg" onClick={() => navigate('/', { replace: true })}>
              Start from the beginning
            </button>
          </div>
        </main>
      </div>
    )

  if (unit !== null) {
    const finish = (sum: SessionSummary) => {
      setAnswers((a) => ({ ratings: { ...a.ratings, ...sum.ratings }, xp: a.xp + sessionXp('lesson', sum).total }))
      setState((s) => recordRound(s!, unit, sum.correct, sum.graded))
    }
    return <SessionRunner key={state.rounds.length} exercises={exercises} course={course} onFinish={finish} onExit={() => navigate(-1)} noRetry />
  }

  const at = placedAt(state)
  const imp = placementImport(course, at)
  const already = imp.lessonIds.filter((id) => completed.includes(id)).length
  const spot = where(at)
  const right = state.rounds.reduce((n, r) => n + r.correct, 0)
  const asked = state.rounds.reduce((n, r) => n + r.graded, 0)
  const apply = () => {
    // Words from the units you placed past count as known ("Good"); your test answers win where they overlap.
    // (Answers about later units don't make cards: you haven't had those lessons yet.)
    const ratings: Record<string, Rating> = {}
    for (const i of imp.items) ratings[i.id] = answers.ratings[i.id] ?? 3
    recordSession({ lang: activeLang, xp: answers.xp, ratings, lessonIds: imp.lessonIds })
    navigate('/', { replace: true })
  }
  return (
    <div className="session">
      <main className="session-body jump-result" data-testid="placement-result">
        <Icon name={at ? 'flag' : 'book'} size={48} className="c-accent" />
        <h1>{at === 0 ? 'Start at the beginning' : at >= course.units.length ? 'You know the whole course!' : 'You’re placed!'}</h1>
        {spot && at > 0 && (
          <p className="placement-spot" data-testid="placement-spot">
            <span className="eyebrow">
              Section {spot.section.index + 1} · {levelLabel(course, spot.section.level)} · Unit {spot.inSection + 1}
            </span>
            <strong>{course.units[at].title}</strong>
          </p>
        )}
        <p className="muted">
          You got {right} of {asked} right.{' '}
          {at > 0
            ? `Starting here marks ${imp.lessonIds.length - already} earlier lessons as done and adds their ${imp.items.length} words and sentences to your reviews as ones you know. You can still open any of them.`
            : 'The first lessons are the best place to start. Have fun!'}
        </p>
        <div className="row">
          <button className="btn btn-primary btn-lg" data-testid="placement-apply" onClick={apply}>
            {at > 0 ? 'Start here' : 'Start learning'}
          </button>
          {at > 0 && (
            <button className="btn btn-lg" onClick={() => navigate('/', { replace: true })}>
              Start from the beginning
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
