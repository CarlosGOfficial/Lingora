import { useEffect, useState } from 'react'
import type { Exercise } from '../../engine/exercises'
import { AudioButton } from '../AudioButton'
import { TargetText } from '../TargetText'
import type { ExerciseProps } from './types'

export function MultipleChoice({ ex, course, locked, onSubmit }: ExerciseProps<Extract<Exercise, { type: 'mcq' }>>) {
  const [choice, setChoice] = useState<string | null>(null)
  const { item, prompt, options } = ex

  const submit = () => {
    if (!choice || locked) return
    const picked = options.find((o) => o.id === choice)!
    onSubmit({ quality: choice === item.id ? 'correct' : 'wrong', given: prompt === 'target' ? picked.meaning : picked.target })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (locked) return
      const n = Number(e.key)
      if (n >= 1 && n <= options.length) setChoice(options[n - 1].id)
      else if (e.key === 'Enter' && choice) {
        e.preventDefault()
        submit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="ex">
      {prompt === 'target' && (
        <>
          <h2 className="ex-title">What does this mean?</h2>
          <div className="prompt-row">
            <AudioButton text={item.target} lang={course.bcp47} autoPlay />
            <TargetText item={item} course={course} size="lg" />
          </div>
        </>
      )}
      {prompt === 'meaning' && <h2 className="ex-title">Select “{item.meaning}”</h2>}
      {prompt === 'audio' && (
        <>
          <h2 className="ex-title">What do you hear?</h2>
          <div className="prompt-row center">
            <AudioButton text={item.target} lang={course.bcp47} autoPlay big withSlow />
          </div>
        </>
      )}

      <div className={`options stagger ${prompt === 'target' ? 'options-list' : 'options-grid'}`}>
        {options.map((o, i) => {
          const state = locked ? (o.id === item.id ? 'is-correct' : o.id === choice ? 'is-wrong' : '') : o.id === choice ? 'is-selected' : ''
          return (
            <button key={o.id} className={`option ${state}`} disabled={locked} onClick={() => setChoice(o.id)}>
              <span className="option-key">{i + 1}</span>
              {prompt === 'target' ? <span>{o.meaning}</span> : <TargetText item={o} course={course} size="md" reading={prompt === 'audio' ? false : undefined} />}
            </button>
          )
        })}
      </div>

      {!locked && (
        <div className="ex-actions">
          <button className="btn btn-primary btn-lg" disabled={!choice} onClick={submit}>
            Check
          </button>
        </div>
      )}
    </div>
  )
}
