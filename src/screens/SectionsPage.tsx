import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { COURSES } from '../content'
import { currentSectionIndex, isSectionComplete, levelLabel, sectionProgress, sections } from '../content/sections'
import { useStore } from '../store/useStore'

/** The course at a glance: each section (one per level), how far you are, and where you can jump. */
export function SectionsPage() {
  const activeLang = useStore((s) => s.activeLang)
  const completed = useStore((s) => s.progress[s.activeLang].completedLessons)
  const course = COURSES[activeLang]
  const all = sections(course)
  const current = currentSectionIndex(course, completed)

  return (
    <div className="stack">
      <PageHeader icon="layers" title={`${course.name} sections`} subtitle={`${course.standardFull}. Each section matches one level.`} />
      {/* Not at the start of the course? Find your level instead of jumping section by section. */}
      <article className="jump-card placement-card" data-testid="placement-card">
        <Icon name="target" size={28} className="c-accent" />
        <div className="grow">
          <strong>Already know some {course.name}?</strong>
          <p className="small muted">Take a 25-question placement test and skip what you know. Earlier words join your reviews.</p>
        </div>
        <Link to="/placement" className="btn">
          Find my level
        </Link>
      </article>
      <div className="section-list stagger">
        {all.map((s) => {
          const { done, total } = sectionProgress(s, completed)
          const finished = isSectionComplete(s, completed)
          const state = finished ? 'done' : s.index === current ? 'current' : s.index < current ? 'done' : 'ahead'
          const link = s.index === current ? '/' : `/?section=${s.index + 1}`
          return (
            <article key={s.level} className={`section-card lang-${activeLang} ${state}`}>
              <div className="section-card-head">
                <span className="section-num">{finished ? <Icon name="check" size={22} /> : s.index + 1}</span>
                <div className="grow">
                  <span className="eyebrow">
                    Section {s.index + 1} · {levelLabel(course, s.level)}
                  </span>
                  <h2>{s.title}</h2>
                </div>
              </div>
              <p className="muted">{s.blurb}</p>
              <div className="section-units">
                {s.units.map((u) => (
                  <span key={u.id} className="chip-unit">
                    {u.title}
                  </span>
                ))}
              </div>
              <div className="section-progress">
                <div className="progress thin">
                  <div style={{ width: `${(done / total) * 100}%` }} />
                </div>
                <span className="small muted">
                  {done} / {total} lessons · {s.units.length} units
                </span>
              </div>
              <div className="row">
                {state === 'current' && (
                  <Link to={link} className="btn btn-primary">
                    {done ? 'Continue' : 'Start'} <Icon name="play" size={14} />
                  </Link>
                )}
                {state === 'done' && (
                  <Link to={link} className="btn">
                    <Icon name="layers" size={16} /> Review section
                  </Link>
                )}
                {state === 'ahead' && (
                  <>
                    <Link to={`/section-test/${s.index}`} className="btn btn-primary">
                      <Icon name="bolt" size={16} filled /> Jump here
                    </Link>
                    <Link to={link} className="btn btn-ghost">
                      Preview
                    </Link>
                  </>
                )}
              </div>
            </article>
          )
        })}
      </div>
      <p className="small muted">“Jump here” gives you a short test on everything before that section. Pass it and those lessons count as done.</p>
    </div>
  )
}
