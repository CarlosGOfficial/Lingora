import { Link, Navigate, useParams } from 'react-router-dom'
import { AudioButton } from '../components/AudioButton'
import { GrammarCard } from '../components/GrammarCard'
import { Icon } from '../components/Icon'
import { TargetText } from '../components/TargetText'
import { courseFor, getGrammar, isLessonUnlocked } from '../content'
import { useStore } from '../store/useStore'

/** Per-unit reference: can-do goals, grammar, vocabulary and key phrases. */
export function GuidebookPage() {
  const { unitId = '' } = useParams()
  const course = courseFor(unitId)
  const unit = course?.units.find((u) => u.id === unitId)
  const completed = useStore((s) => (course ? s.progress[course.lang].completedLessons : []))
  if (!course || !unit) return <Navigate to="/" replace />
  const index = course.units.indexOf(unit)

  return (
    <div className="stack guidebook">
      <Link to="/" className="back-link">
        ← Back to course
      </Link>
      <header className={`unit-head`}>
        <div>
          <span className="unit-level">
            {unit.level} · Unit {index + 1} · Guidebook
          </span>
          <h1>{unit.title}</h1>
        </div>
        <ul className="can-do">
          {unit.canDo.map((c) => (
            <li key={c}>
              <Icon name="target" size={14} /> {c}
            </li>
          ))}
        </ul>
      </header>

      {unit.lessons.map((lesson, li) => (
        <section key={lesson.id} className="guide-lesson">
          <div className="guide-lesson-head">
            <div>
              <span className="muted small">Lesson {li + 1}</span>
              <h2>{lesson.title}</h2>
              <p className="muted">{lesson.goal}</p>
            </div>
            {isLessonUnlocked(course, completed, lesson.id) && (
              <Link to={`/lesson/${lesson.id}`} className="btn">
                {completed.includes(lesson.id) ? 'Practice' : 'Start'}
              </Link>
            )}
          </div>

          {getGrammar(lesson.id).map((p) => (
            <GrammarCard key={p.title} point={p} course={course} />
          ))}

          <h3>Key phrases</h3>
          <ul className="guide-list">
            {lesson.sentences.map((s) => (
              <li key={s.id}>
                <AudioButton text={s.target} lang={course.bcp47} />
                <TargetText item={s} course={course} size="sm" />
                <span className="muted small grow">{s.meaning}</span>
              </li>
            ))}
          </ul>

          <h3>Vocabulary</h3>
          <ul className="guide-vocab">
            {lesson.items.map((w) => (
              <li key={w.id}>
                <AudioButton text={w.target} lang={course.bcp47} />
                <TargetText item={w} course={course} size="sm" />
                <span className="muted small">{w.meaning}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
