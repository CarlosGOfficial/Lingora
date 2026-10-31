import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { VoiceNotice } from '../components/VoiceNotice'
import { COURSES, isLessonUnlocked, isUnitComplete, nextLessonId } from '../content'
import { dayKey, formatRelative } from '../lib/date'
import { dueCards, liveStreak, todayXp, useStore } from '../store/useStore'

const ZIGZAG = [0, 46, 70, 46, 0, -46, -70, -46]

export function Home() {
  const navigate = useNavigate()
  const { activeLang, progress, streak, xpByDay, dailyGoal, name } = useStore()
  const course = COURSES[activeLang]
  const prog = progress[activeLang]
  const due = dueCards(prog)
  const upcoming = Object.values(prog.cards).sort((a, b) => a.due - b.due)[0]
  const xp = todayXp(xpByDay)
  const goalPct = Math.min(1, xp / dailyGoal)
  const next = nextLessonId(course, prog.completedLessons)
  const s = liveStreak(streak)

  return (
    <div className="home">
      <section className="hero">
        <span className={`lang-badge lang-${activeLang}`} lang={course.bcp47}>
          {course.badge}
        </span>
        <div>
          <span className="eyebrow">
            Hi {name} · <span title={course.standardFull}>{course.standard}</span> course
          </span>
          <h1>
            Learn <span className="hero-gradient">{course.name}</span>
          </h1>
          <p className="muted" lang={course.bcp47}>
            {course.nativeName}
          </p>
        </div>
      </section>

      <VoiceNotice course={course} />

      <section className="dash stagger">
        <div className="dash-card">
          <Icon name="flame" filled size={30} className={s > 0 ? 'c-flame' : 'c-muted'} />
          <div>
            <div className="dash-value">{s} day{s === 1 ? '' : 's'}</div>
            <div className="muted small">{streak.lastActiveDay === dayKey() ? 'Streak extended today' : 'Do a lesson to extend your streak'}</div>
          </div>
        </div>
        <div className="dash-card">
          <div className="ring" style={{ ['--pct' as string]: goalPct }}>
            <span>{Math.round(goalPct * 100)}%</span>
          </div>
          <div>
            <div className="dash-value">
              {xp} / {dailyGoal} XP
            </div>
            <div className="muted small">{goalPct >= 1 ? 'Daily goal reached 🎉' : 'Daily goal'}</div>
          </div>
        </div>
        <Link to="/review" className={`dash-card link ${due.length ? 'attention' : ''}`}>
          <Icon name="layers" size={30} className="c-accent" />
          <div>
            <div className="dash-value">{due.length} due</div>
            <div className="muted small">
              {due.length ? 'Review now to lock it in' : upcoming ? `Next review ${formatRelative(upcoming.due)}` : 'Learn words to unlock reviews'}
            </div>
          </div>
        </Link>
      </section>

      {course.units.map((unit, ui) => {
        const unitDone = isUnitComplete(unit, prog.completedLessons)
        const readingDone = unit.reading && prog.completedReadings.includes(unit.reading.id)
        const newTier = ui === 0 || course.units[ui - 1].level !== unit.level
        const tier = [...new Set(course.units.slice(0, ui + 1).map((u) => u.level))].length
        return (
          <section key={unit.id} className={`unit unit-${activeLang}`}>
            {newTier && (
              <div className="tier-head">
                <span className="tier-num">Tier {tier}</span>
                <span>
                  {course.standard} · <strong>{unit.level}</strong>
                </span>
              </div>
            )}
            <header className="unit-head">
              <div>
                <span className="unit-level">
                  {unit.level} · Unit {ui + 1}
                </span>
                <h2>{unit.title}</h2>
                <Link to={`/guide/${unit.id}`} className="guide-btn">
                  <Icon name="book" size={16} /> Guidebook
                </Link>
              </div>
              <ul className="can-do">
                {unit.canDo.map((c) => (
                  <li key={c}>
                    <Icon name={unitDone ? 'check' : 'target'} size={14} /> {c}
                  </li>
                ))}
              </ul>
            </header>
            <div className="path">
              {unit.lessons.map((lesson, li) => {
                const done = prog.completedLessons.includes(lesson.id)
                const unlocked = isLessonUnlocked(course, prog.completedLessons, lesson.id)
                const current = lesson.id === next
                return (
                  <div key={lesson.id} className={`path-step ${current ? 'is-current' : ''}`} style={{ transform: `translateX(${ZIGZAG[li % ZIGZAG.length]}px)` }}>
                    {current && <span className="start-bubble">{done ? 'Practice' : 'Start'}</span>}
                    <button
                      className={`node ${done ? 'done' : current ? 'current' : 'locked'}`}
                      disabled={!unlocked}
                      onClick={() => navigate(`/lesson/${lesson.id}`)}
                      aria-label={`${lesson.title}${done ? ' (completed)' : unlocked ? '' : ' (locked)'}`}
                    >
                      <Icon name={done ? 'check' : unlocked ? 'star' : 'lock'} size={28} filled={!done && unlocked} />
                    </button>
                    <div className="node-label">
                      <strong>{lesson.title}</strong>
                      <span className="muted small">{lesson.goal}</span>
                    </div>
                  </div>
                )
              })}
              {unit.reading && (
                <div className="path-step" style={{ transform: `translateX(${ZIGZAG[unit.lessons.length % ZIGZAG.length]}px)` }}>
                  <button
                    className={`node reading ${readingDone ? 'done' : unitDone ? 'current' : 'locked'}`}
                    disabled={!unitDone}
                    onClick={() => navigate(`/reading/${unit.reading!.id}`)}
                    aria-label={`Story: ${unit.reading.title}`}
                  >
                    <Icon name={unitDone ? 'book' : 'lock'} size={28} />
                  </button>
                  <div className="node-label">
                    <strong>Story</strong>
                    <span className="muted small" lang={course.bcp47}>
                      {unit.reading.title}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )
      })}

      <section className="coming-soon muted">
        More {course.standard} units are on the way. Keep your reviews up while you wait — that’s where long-term memory is built.
      </section>
    </div>
  )
}
