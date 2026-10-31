import type { Course, GrammarPoint } from '../content/types'
import { AudioButton } from './AudioButton'
import { TargetText } from './TargetText'

export function GrammarCard({ point, course }: { point: GrammarPoint; course: Course }) {
  return (
    <article className="grammar-card">
      <h3>{point.title}</h3>
      {point.pattern && (
        <div className="grammar-pattern" lang={course.bcp47}>
          {point.pattern}
        </div>
      )}
      <p>{point.explanation}</p>
      <ul className="grammar-examples">
        {point.examples.map((e) => (
          <li key={e.target}>
            <AudioButton text={e.target} lang={course.bcp47} />
            <div>
              <TargetText item={e} course={course} size="md" />
              <div className="muted small">{e.meaning}</div>
            </div>
          </li>
        ))}
      </ul>
    </article>
  )
}
