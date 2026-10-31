import type { Exercise } from '../../engine/exercises'
import { AudioButton } from '../AudioButton'
import { TargetText } from '../TargetText'
import type { ExerciseProps } from './types'

export function Intro({ ex, course, onSubmit }: ExerciseProps<Extract<Exercise, { type: 'intro' }>>) {
  const { item } = ex
  return (
    <div className="ex ex-intro">
      <span className="pill">{item.kind === 'word' ? 'New word' : 'New phrase'}</span>
      <div className="intro-card">
        <AudioButton text={item.target} lang={course.bcp47} autoPlay withSlow />
        <TargetText item={item} course={course} size="xl" reading />
        {item.romanization && item.reading && <div className="muted">{item.romanization}</div>}
        <div className="intro-meaning">{item.meaning}</div>
        {item.meaningAlt?.length ? <div className="muted small">also: {item.meaningAlt.join(', ')}</div> : null}
        {item.note && <div className="note">💡 {item.note}</div>}
      </div>
      <div className="ex-actions">
        <button className="btn btn-primary btn-lg" autoFocus onClick={() => onSubmit({ quality: 'skip', advance: true })}>
          Got it
        </button>
      </div>
    </div>
  )
}
