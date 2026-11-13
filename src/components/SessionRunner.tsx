import { Write } from './exercises/Write'
import { ReadingToggle } from './ReadingToggle'
import { useEffect, useRef, useState } from 'react'
import type { Course } from '../content/types'
import { exerciseItems, type Exercise } from '../engine/exercises'
import { comboReward } from '../engine/xp'
import type { Rating } from '../lib/fsrs'
import { AudioButton } from './AudioButton'
import { Icon } from './Icon'
import { TargetText } from './TargetText'
import { CharChips } from '../screens/CharactersPage'
import { Cloze } from './exercises/Cloze'
import { Grammar } from './exercises/Grammar'
import { ReadingDrill } from './exercises/ReadingDrill'
import { Intro } from './exercises/Intro'
import { Match } from './exercises/Match'
import { MultipleChoice } from './exercises/MultipleChoice'
import { SentenceBuilder } from './exercises/SentenceBuilder'
import { Speak } from './exercises/Speak'
import { TypeAnswer } from './exercises/TypeAnswer'
import type { ExerciseResult } from './exercises/types'

export interface SessionSummary {
  ratings: Record<string, Rating>
  graded: number
  correct: number
  durationMs: number
  /** Bonus XP from answering correctly in a row. */
  comboXp: number
  bestCombo: number
}

interface Props {
  exercises: Exercise[]
  course: Course
  onFinish(summary: SessionSummary): void
  onExit(): void
  /** Tests (placement): a wrong answer isn't asked again at the end. */
  noRetry?: boolean
}

const PRAISE = ['Nice!', 'Great job!', 'Correct!', 'Excellent!', 'You got it!']

function ExerciseView(props: { ex: Exercise; course: Course; locked: boolean; onSubmit(r: ExerciseResult): void }) {
  const { ex } = props
  switch (ex.type) {
    case 'intro':
      return <Intro {...props} ex={ex} />
    case 'mcq':
      return <MultipleChoice {...props} ex={ex} />
    case 'type':
    case 'dictation':
      return <TypeAnswer {...props} ex={ex} />
    case 'match':
      return <Match {...props} ex={ex} />
    case 'build':
      return <SentenceBuilder {...props} ex={ex} />
    case 'speak':
      return <Speak {...props} ex={ex} />
    case 'grammar':
      return <Grammar {...props} ex={ex} />
    case 'cloze':
      return <Cloze {...props} ex={ex} />
    case 'reading':
      return <ReadingDrill {...props} ex={ex} />
    case 'write':
      return <Write {...props} ex={ex} />
  }
}

/**
 * Plays a queue of exercises. Wrong answers are re-queued once at the end
 * (error-driven practice); first-attempt results feed the SRS ratings.
 */
export function SessionRunner({ exercises, course, onFinish, onExit, noRetry = false }: Props) {
  const [queue, setQueue] = useState(exercises)
  const [idx, setIdx] = useState(0)
  const [feedback, setFeedback] = useState<ExerciseResult | null>(null)
  // Correct answers in a row; every few pays bonus XP (Duolingo's combo).
  const [combo, setCombo] = useState(0)
  const [comboPaid, setComboPaid] = useState(false)
  const ratings = useRef<Record<string, Rating>>({})
  const requeued = useRef(new WeakSet<Exercise>())
  const stats = useRef({ graded: 0, correct: 0, start: Date.now(), comboXp: 0, bestCombo: 0 })

  const ex = queue[idx]

  const next = () => {
    setFeedback(null)
    setComboPaid(false)
    if (idx + 1 >= queue.length) {
      const s = stats.current
      onFinish({ ratings: ratings.current, graded: s.graded, correct: s.correct, durationMs: Date.now() - s.start, comboXp: s.comboXp, bestCombo: s.bestCombo })
    } else setIdx(idx + 1)
  }

  const handle = (r: ExerciseResult) => {
    const firstAttempt = !requeued.current.has(ex)
    for (const it of exerciseItems(ex)) {
      const cur = ratings.current[it.id]
      if (r.quality === 'wrong') ratings.current[it.id] = 1
      else if (r.quality === 'almost') ratings.current[it.id] = Math.min(cur ?? 3, 2) as Rating
      else if (r.quality === 'correct' || ex.type === 'intro') ratings.current[it.id] = cur ?? 3
    }
    if (r.quality !== 'skip' && firstAttempt) {
      const s = stats.current
      s.graded++
      if (r.quality === 'wrong') setCombo(0)
      else {
        s.correct++
        const streak = combo + 1
        const bonus = comboReward(streak, s.comboXp)
        s.comboXp += bonus
        s.bestCombo = Math.max(s.bestCombo, streak)
        setCombo(streak)
        setComboPaid(bonus > 0)
      }
    }
    if (r.quality === 'wrong' && firstAttempt && !noRetry) {
      requeued.current.add(ex)
      setQueue((q) => [...q, ex])
    }
    if (r.advance) next()
    else setFeedback(r)
  }

  useEffect(() => {
    if (!feedback) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!ex) return null
  const progress = (idx + (feedback ? 1 : 0)) / queue.length
  const item = ex.type === 'match' || ex.type === 'grammar' ? null : ex.item

  return (
    <div className="session">
      <header className="session-top">
        <button
          className="icon-btn"
          aria-label="Quit"
          onClick={() => {
            if (idx === 0 || confirm('Quit this session? Progress in it won’t be saved.')) onExit()
          }}
        >
          <Icon name="x" />
        </button>
        <div className="progress">
          <div style={{ width: `${progress * 100}%` }} />
        </div>
        <span key={combo >= 2 ? combo : 'off'} className={`combo-chip ${combo >= 2 ? 'on' : ''}`} aria-live="polite" title="Correct answers in a row">
          <Icon name="flame" filled size={18} /> {combo}
        </span>
        <ReadingToggle course={course} />
      </header>

      <main className="session-body">
        <ExerciseView key={idx} ex={ex} course={course} locked={!!feedback} onSubmit={handle} />
      </main>

      {feedback && (
        <footer className={`feedback feedback-${feedback.quality}`}>
          <div className="feedback-inner">
            <span className="feedback-icon" aria-hidden="true">
              <Icon name={feedback.quality === 'wrong' ? 'x' : feedback.quality === 'skip' ? 'slow' : 'check'} size={26} />
            </span>
            <div className="feedback-text">
              <strong>
                {feedback.quality === 'correct' ? PRAISE[idx % PRAISE.length] : feedback.quality === 'almost' ? 'Almost!' : feedback.quality === 'skip' ? 'Skipped' : 'Not quite'}
              </strong>
              {feedback.note && <span> {feedback.note}</span>}
              {comboPaid && (
                <span className="combo-callout">
                  <Icon name="flame" filled size={16} /> {combo} in a row! +1 XP
                </span>
              )}
              {item && feedback.quality !== 'correct' && (
                <div className="feedback-answer">
                  <span className="small">Correct answer:</span>
                  <TargetText item={item} course={course} size="sm" reading />
                  <span className="small">· {item.meaning}</span>
                  <AudioButton text={item.target} lang={course.bcp47} />
                  {item.kind === 'word' && <CharChips text={item.target} lang={course.lang} />}
                </div>
              )}
              {item && feedback.quality === 'correct' && (
                <div className="feedback-answer small">
                  <span lang={course.bcp47}>{item.target}</span> — {item.meaning} {item.kind === 'word' && <CharChips text={item.target} lang={course.lang} />}
                </div>
              )}
            </div>
            <button className="btn btn-lg btn-feedback" autoFocus onClick={next}>
              Continue
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
