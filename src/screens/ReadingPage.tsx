import { ReadingToggle } from '../components/ReadingToggle'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AudioButton } from '../components/AudioButton'
import { CompleteScreen } from '../components/CompleteScreen'
import { Icon } from '../components/Icon'
import { TargetText } from '../components/TargetText'
import { XP } from '../config'
import { findReading } from '../content'
import { useStore } from '../store/useStore'

export function ReadingPage() {
  const { readingId = '' } = useParams()
  const navigate = useNavigate()
  const found = findReading(readingId)
  const { recordSession, streak } = useStore()
  const [shown, setShown] = useState<Record<number, boolean>>({})
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [done, setDone] = useState<{ streakBefore: number; accuracy: number } | null>(null)

  if (!found) return <Navigate to="/" replace />
  const { course, reading } = found
  const allAnswered = reading.questions.every((_, i) => answers[i] !== undefined)
  const correct = reading.questions.filter((q, i) => answers[i] === q.answer).length

  if (done) {
    return <CompleteScreen title="Story complete!" xp={XP.reading} accuracy={done.accuracy} streakBefore={done.streakBefore} onContinue={() => navigate('/')} />
  }

  return (
    <div className="reading-page">
      <header className="session-top">
        <button className="icon-btn" aria-label="Close" onClick={() => navigate(-1)}>
          <Icon name="x" />
        </button>
        <h1 className="reading-title" lang={course.bcp47}>
          {reading.title}
        </h1>
        <ReadingToggle course={course} />
      </header>

      <div className="reading-body">
        <section className="passage">
          <AudioButton text={reading.sentences.map((s) => s.target).join(' ')} lang={course.bcp47} withSlow />
          {reading.sentences.map((s, i) => (
            <div key={s.id} className="passage-line">
              <button className="passage-text" onClick={() => setShown({ ...shown, [i]: !shown[i] })} title="Tap to show translation">
                <TargetText item={s} course={course} size="md" />
              </button>
              <AudioButton text={s.target} lang={course.bcp47} />
              {shown[i] && (
                <div className="passage-translation">
                  {s.meaning}
                  {s.note && <span className="note"> · {s.note}</span>}
                </div>
              )}
            </div>
          ))}
          <p className="muted small">Tap a sentence to see its translation — but try to understand it first.</p>
        </section>

        <section className="questions">
          <h2>Check your understanding</h2>
          {reading.questions.map((q, qi) => (
            <div key={qi} className="question">
              <strong>{q.q}</strong>
              <div className="options options-list">
                {q.options.map((o, oi) => {
                  const picked = answers[qi]
                  const cls = picked === undefined ? '' : oi === q.answer ? 'is-correct' : oi === picked ? 'is-wrong' : ''
                  return (
                    <button key={oi} className={`option ${cls}`} disabled={picked !== undefined} onClick={() => setAnswers({ ...answers, [qi]: oi })}>
                      {o}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          <button
            className="btn btn-primary btn-lg block"
            disabled={!allAnswered}
            onClick={() => {
              const before = streak.current
              recordSession({ lang: course.lang, xp: XP.reading, ratings: {}, readingId })
              setDone({ streakBefore: before, accuracy: correct / reading.questions.length })
            }}
          >
            Finish story
          </button>
        </section>
      </div>
    </div>
  )
}
