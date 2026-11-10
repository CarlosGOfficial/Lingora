import { useEffect, useRef, useState } from 'react'
import { SPEAK_CLOSE_THRESHOLD, SPEAK_PASS_THRESHOLD } from '../../config'
import type { Exercise, SpeakMode } from '../../engine/exercises'
import { scoreSpeech, type SpeechResult } from '../../lib/pronounce'
import { listen, recognitionErrorMessage, recognitionSupported, speak, type Listening } from '../../lib/speech'
import { logSpeech, pauseSpeaking, speakingPaused } from '../../lib/speechLog'
import { useStore } from '../../store/useStore'
import { AudioButton } from '../AudioButton'
import { Icon } from '../Icon'
import { TargetText } from '../TargetText'
import type { ExerciseProps } from './types'

const MAX_TRIES = 3

type Phase = 'idle' | 'listening' | 'scored' | 'error'

const TITLES: Record<SpeakMode, (lang: string) => string> = {
  shadow: () => 'Say this out loud',
  echo: () => 'Listen, then say what you heard',
  say: (lang) => `Say it in ${lang}`,
  read: () => 'Read it aloud',
}

/**
 * Speaking, in four ways (engine/exercises.ts SpeakMode): shadow (hear and see it),
 * echo (hear it, no text until you've tried), say (from the English) and read (read the
 * text aloud, audio after). Each try is scored by how it sounds, and logged for the
 * "Tricky to say" list and the speaking quest.
 */
export function Speak({ ex, course, locked, onSubmit }: ExerciseProps<Extract<Exercise, { type: 'speak' }>>) {
  const { item } = ex
  const mode: SpeakMode = ex.mode ?? 'shadow'
  const rate = useStore((s) => s.settings.speechRate)
  const supported = recognitionSupported()
  const [phase, setPhase] = useState<Phase>('idle')
  const [live, setLive] = useState('')
  const [result, setResult] = useState<SpeechResult | null>(null)
  const [best, setBest] = useState(0)
  const [tries, setTries] = useState(0)
  const [error, setError] = useState('')
  const [hinted, setHinted] = useState(false)
  const session = useRef<Listening | null>(null)

  useEffect(() => () => session.current?.stop(), [])
  // "Can't speak now" was pressed recently: skip quietly (no effect on reviews).
  useEffect(() => { if (speakingPaused() && !locked) onSubmit({ quality: 'skip', advance: true }) }, [])

  // Show the words once you've had a go (echo), or when they're the point (shadow, read).
  const reveal = mode === 'shadow' || mode === 'read' || tries > 0 || locked || hinted
  const record = async () => {
    if (phase === 'listening') {
      session.current?.stop()
      return
    }
    window.speechSynthesis?.cancel()
    setLive('')
    setError('')
    setPhase('listening')
    session.current = listen(course.bcp47, setLive)
    try {
      const alts = await session.current.result
      if (!alts.length) {
        setPhase('error')
        setError(recognitionErrorMessage('no-speech'))
        return
      }
      // "Say it" accepts any accepted answer (obrigado / obrigada).
      const targets = mode === 'say' ? [item, ...(item.alt ?? []).map((target) => ({ ...item, target, reading: undefined }))] : [item]
      const r = targets.map((t) => scoreSpeech(alts, t, course.lang)).sort((a, b) => b.score - a.score)[0]
      logSpeech(item.id, course.lang, r.score)
      const n = tries + 1
      const top = Math.max(best, r.score)
      setResult(r)
      setBest(top)
      setTries(n)
      setPhase('scored')
      if (r.score >= SPEAK_PASS_THRESHOLD) onSubmit(hinted ? { quality: 'almost', given: r.heard, note: 'Right after hearing it: try it from memory next time.' } : { quality: 'correct', given: r.heard })
      else if (n >= MAX_TRIES)
        onSubmit({
          quality: 'almost',
          given: r.heard,
          note: top >= SPEAK_CLOSE_THRESHOLD ? 'Close! This one will come back for more practice.' : 'Keep practising this one — it’ll come back soon.',
        })
    } catch (e) {
      setPhase('error')
      setError(recognitionErrorMessage((e as Error).message))
    }
  }

  const verdict = !result ? null : result.score >= SPEAK_PASS_THRESHOLD ? 'good' : result.score >= SPEAK_CLOSE_THRESHOLD ? 'close' : 'off'
  // Words are separate units in Portuguese (characters in Chinese and Japanese).
  const joiner = course.lang === 'pt'

  return (
    <div className="ex" data-testid={`speak-${mode}`}>
      <h2 className="ex-title">{TITLES[mode](course.name)}</h2>
      <div className="prompt-row">
        {mode === 'say' ? (
          <div className="speak-say">
            <div className="speak-meaning">{item.meaning}</div>
            {reveal ? <TargetText item={item} course={course} size="md" reading /> : (
              <button type="button" className="btn btn-ghost small" onClick={() => { setHinted(true); speak(item.target, course.bcp47, rate) }} disabled={locked}>
                <Icon name="volume" size={14} /> Hear it (a hint)
              </button>
            )}
          </div>
        ) : (
          <>
            {(mode !== 'read' || tries > 0 || locked) && <AudioButton text={item.target} lang={course.bcp47} autoPlay={mode !== 'read'} withSlow />}
            <div>
              {reveal ? <TargetText item={item} course={course} size="lg" reading={mode === 'read' ? undefined : true} /> : <div className="speak-hidden" aria-label="Hidden until you try">🎧 · · ·</div>}
              {(reveal && mode !== 'read') || locked ? <div className="muted">{item.meaning}</div> : null}
            </div>
          </>
        )}
      </div>

      {supported ? (
        <div className="speak-zone">
          <button className={`mic-btn ${phase === 'listening' ? 'is-live' : ''}`} onClick={record} disabled={locked} aria-label={phase === 'listening' ? 'Stop' : 'Record'} data-testid="mic">
            <Icon name="mic" size={34} />
          </button>
          <div className="muted small" aria-live="polite">
            {phase === 'listening' ? 'Listening… tap to stop' : tries ? 'Tap to try again' : 'Tap the mic and speak'}
          </div>

          {phase === 'listening' && (
            <div className="live-transcript" lang={course.bcp47}>
              {live || <span className="listening-dots" aria-hidden="true"><i /><i /><i /></span>}
            </div>
          )}

          {phase === 'scored' && result && (
            <div className={`speak-result ${verdict}`}>
              <div className={`speak-units ${joiner ? 'spaced' : ''}`} lang={course.bcp47} aria-label="Your pronunciation, part by part">
                {result.units.map((u, i) => (
                  <span key={i} className={u.ok ? 'hit' : 'miss'}>
                    {u.text}
                  </span>
                ))}
              </div>
              <div className="meter">
                <div style={{ width: `${Math.round(result.score * 100)}%` }} />
              </div>
              <div className="small">
                <strong>
                  {verdict === 'good' ? 'Great pronunciation!' : verdict === 'close' ? 'Close! Focus on the red parts.' : 'Not quite — listen again and copy the rhythm.'}
                </strong>{' '}
                {Math.round(result.score * 100)}% match
                {result.heard && (
                  <>
                    {' '}
                    · heard “<span lang={course.bcp47}>{result.heard}</span>”
                  </>
                )}
              </div>
              {verdict !== 'good' && !locked && (
                <div className="row small">
                  <button type="button" className="btn btn-ghost small" onClick={() => speak(item.target, course.bcp47, rate * 0.7)}>
                    <Icon name="slow" size={14} /> Hear it slowly
                  </button>
                  <span className="muted">{MAX_TRIES - tries} tries left</span>
                </div>
              )}
            </div>
          )}
          {phase === 'error' && (
            <div className="speak-result off" role="alert">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="speak-zone">
          <p className="muted">Speech recognition isn’t available in this browser (try Chrome or Edge). Say it aloud, then rate yourself:</p>
          {!reveal && <button type="button" className="btn small" onClick={() => setHinted(true)}>Show the answer</button>}
        </div>
      )}

      {!locked && (
        <div className="ex-actions split">
          <button className="btn btn-ghost" onClick={() => { pauseSpeaking(); onSubmit({ quality: 'skip', advance: true }) }} title="Speaking exercises are skipped for 15 minutes" data-testid="cant-speak">
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
