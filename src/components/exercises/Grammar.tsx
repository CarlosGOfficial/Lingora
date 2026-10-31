import type { Exercise } from '../../engine/exercises'
import { GrammarCard } from '../GrammarCard'
import type { ExerciseProps } from './types'

export function Grammar({ ex, course, onSubmit }: ExerciseProps<Extract<Exercise, { type: 'grammar' }>>) {
  return (
    <div className="ex">
      <span className="pill">Grammar tip</span>
      <GrammarCard point={ex.point} course={course} />
      <div className="ex-actions">
        <button className="btn btn-primary btn-lg" autoFocus onClick={() => onSubmit({ quality: 'skip', advance: true })}>
          Got it
        </button>
      </div>
    </div>
  )
}
