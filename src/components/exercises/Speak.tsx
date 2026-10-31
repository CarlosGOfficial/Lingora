import { useEffect, useRef, useState } from 'react'
import { SPEAK_PASS_THRESHOLD } from '../../config'
import type { Exercise } from '../../engine/exercises'
import { speechScore } from '../../lib/answer'
import { listen, recognitionSupported, type Listening } from '../../lib/speech'
import { AudioButton } from '../AudioButton'
import { Icon } from '../Icon'
import { TargetText } from '../TargetText'
import type { ExerciseProps } from './types'

const MAX_TRIES = 3

/** Shadowing: hear the model, say it, get scored by speech recognition. */
export function Speak({ ex, course, locked, onSubmit }: ExerciseProps<Extract<Exercise, { type: 'speak' }>>) {
  const { item } = ex
  const supported = recognitionSupported()
  const [state, setState] = useState<'idle' | 'listening' | 'scored' | 'error'>('idle')
  const [heard, setHeard] = useState('')
  const [score, setScore] = useState(0)
  const [tries, setTries] = useState(0)
  const [error, setError] = useState('')
  const session = useRef<Listening | null>(null)

  useEffect(() => () => session.current?.stop(), [])

  const record = async () => {
    if (state === 'listening') {
      session.current?.stop()
      return
    }
    setState('listening')
    session.current = listen(course.bcp47)
    try {
      const alts = await session.current.result
      const sc = speechScore(alts, item)
      const n = tries + 1
      setHeard(alts[0] ?? '')
      setScore(sc)
      setTries(n)
      setState('scored')
      if (sc >= SPEAK_PASS_THRESHOLD) onSubmit({ quality: 'correct', given: alts[0] })
      else if (n >= MAX_TRIES) onSubmit({ quality: 'almost', given: alts[0], note: 'Keep practising this one — it’ll come back soon.' })
    } catch (e) {
      setState('error')
      setError((e as Error).message === 'not-allowed' ? 'Microphone permission was denied.' : 'Couldn’t hear anything — try again.')
    }
  }

  return (
    <div className="ex">
      <h2 className="ex-title">Say this out loud</h2>
      <div className="prompt-row">
        <AudioButton text={item.target} lang={course.bcp47} autoPlay withSlow />
        <div>
          <TargetText item={item} course={course} size="lg" reading />
          <div className="muted">{item.meaning}</div>
        </div>
      </div>

      {supported ? (
        <div className="speak-zone">
          <button className={`mic-btn ${state === 'listening' ? 'is-live' : ''}`} onClick={record} disabled={locked} aria-label="Record">
            <Icon name="mic" size={34} />
          </button>
          <div className="muted small">{state === 'listening' ? 'Listening… tap to stop' : 'Tap the mic and speak'}</div>
          {state === 'scored' && (
            <div className={`speak-result ${score >= SPEAK_PASS_THRESHOLD ? 'good' : 'meh'}`}>
              <div className="meter">
                <div style={{ width: `${Math.round(score * 100)}%` }} />
              </div>
              <div>
                {Math.round(score * 100)}% match{heard && <> · heard “<span lang={course.bcp47}>{heard}</span>”</>}
              </div>
              {score < SPEAK_PASS_THRESHOLD && !locked && <div className="small">Try again ({MAX_TRIES - tries} left)</div>}
            </div>
          )}
          {state === 'error' && <div className="speak-result meh">{error}</div>}
        </div>
      ) : (
        <div className="speak-zone">
          <p className="muted">Speech recognition isn’t available in this browser (try Chrome or Edge). Say it aloud, then rate yourself:</p>
        </div>
      )}

      {!locked && (
        <div className="ex-actions split">
          <button className="btn btn-ghost" onClick={() => onSubmit({ quality: 'skip', advance: true })}>
            Can’t speak now
          </button>
          {!supported && (
            <>
              <button className="btn" onClick={() => onSubmit({ quality: 'almost', note: 'Self-assessed' })}>
                Not quite
              </button>
              <button className="btn btn-primary" onClick={() => onSubmit({ quality: 'correct' })}>
                I said it right
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
