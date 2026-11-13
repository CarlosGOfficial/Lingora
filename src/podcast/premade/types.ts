/** A premade episode: [speaker, target, reading, translation] lines and [question, options, answer]. */
export interface Premade {
  /** Shown once this unit is finished (and placed after it in the course path). */
  after: string
  title: string
  summary: string
  lines: [0 | 1, string, string, string][]
  questions: [string, string[], number][]
}
