import { useState } from 'react'
import type { Exercise } from '../../engine/exercises'
import { checkTyped } from '../../lib/answer'
import { AudioButton } from '../AudioButton'
import type { ExerciseProps } from './types'

type Props = ExerciseProps<Extract<Exercise, { type: 'type' | 'dictation' }>>

/** Free production: translate meaning → target ("type") or transcribe audio ("dictation"). */
export function TypeAnswer({ ex, course, locked, onSubmit }: Props) {
  const [value, setValue] = useState('')
  const { item } = ex

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (locked || !value.trim()) return
    const res = checkTyped(value, item)
    onSubmit({ quality: res.quality, given: value, note: res.note })
  }

  return (
    <form className="ex" onSubmit={submit}>
      {ex.type === 'type' ? (
        <>
          <h2 className="ex-title">Write this in {course.name}</h2>
          <div className="prompt-bubble">{item.meaning}</div>
        </>
      ) : (
        <>
          <h2 className="ex-title">Type what you hear</h2>
          <div className="prompt-row center">
            <AudioButton text={item.target} lang={course.bcp47} autoPlay big withSlow />
          </div>
        </>
      )}
      <input
        className="text-input"
        lang={course.bcp47}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={locked}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={`Type in ${course.name}…`}
      />
      <p className="muted small">{course.typingHint}</p>
      {!locked && (
        <div className="ex-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={!value.trim()}>
            Check
          </button>
        </div>
      )}
    </form>
  )
}
