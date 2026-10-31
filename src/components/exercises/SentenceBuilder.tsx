import { useState } from 'react'
import type { Exercise } from '../../engine/exercises'
import { normalize } from '../../lib/answer'
import { speak } from '../../lib/speech'
import { useStore } from '../../store/useStore'
import type { ExerciseProps } from './types'

export function SentenceBuilder({ ex, course, locked, onSubmit }: ExerciseProps<Extract<Exercise, { type: 'build' }>>) {
  const rate = useStore((s) => s.settings.speechRate)
  const [picked, setPicked] = useState<number[]>([])
  const { item, bank } = ex
  const joiner = course.lang === 'pt' ? ' ' : ''

  const submit = () => {
    const given = picked.map((i) => bank[i]).join(joiner)
    const ok = [item.target, ...(item.alt ?? [])].some((t) => normalize(t) === normalize(given))
    onSubmit({ quality: ok ? 'correct' : 'wrong', given })
  }

  return (
    <div className="ex">
      <h2 className="ex-title">Build the sentence</h2>
      <div className="prompt-bubble">{item.meaning}</div>
      <div className="build-answer" lang={course.bcp47}>
        {picked.length === 0 && <span className="muted">Tap the words below</span>}
        {picked.map((bi) => (
          <button key={bi} className="chip" disabled={locked} onClick={() => setPicked(picked.filter((x) => x !== bi))}>
            {bank[bi]}
          </button>
        ))}
      </div>
      <div className="build-bank stagger" lang={course.bcp47}>
        {bank.map((tok, bi) => (
          <button
            key={bi}
            className={`chip ${picked.includes(bi) ? 'is-used' : ''}`}
            disabled={locked || picked.includes(bi)}
            onClick={() => {
              speak(tok, course.bcp47, rate)
              setPicked([...picked, bi])
            }}
          >
            {tok}
          </button>
        ))}
      </div>
      {!locked && (
        <div className="ex-actions">
          <button className="btn btn-primary btn-lg" disabled={!picked.length} onClick={submit}>
            Check
          </button>
        </div>
      )}
    </div>
  )
}
