import type { Course } from '../../content/types'
import type { Quality } from '../../lib/answer'

export interface ExerciseResult {
  quality: Quality | 'skip'
  /** What the learner gave, for the feedback bar. */
  given?: string
  note?: string
  /** Skip the feedback bar and go straight to the next exercise. */
  advance?: boolean
}

export interface ExerciseProps<E> {
  ex: E
  course: Course
  locked: boolean
  onSubmit(result: ExerciseResult): void
}
