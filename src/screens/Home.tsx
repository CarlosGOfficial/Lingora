import type { CSSProperties } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { VoiceNotice } from '../components/VoiceNotice'
import { TodayStrip } from '../components/TodayStrip'
import { COURSES, isLessonUnlocked, isUnitComplete, nextLessonId, unitReviewId } from '../content'
import { currentSectionIndex, isSectionComplete, levelLabel, sectionProgress, sections, type Section } from '../content/sections'
import type { Course } from '../content/types'
import { dayKey, formatRelative } from '../lib/date'
import { dueCards, liveStreak, todayXp, useStore } from '../store/useStore'
import { premadeEpisodes } from '../podcast/premade'
import { doneEpisodes } from '../podcast/store'

const ZIGZAG = [0, 46, 70, 46, 0, -46, -70, -46]
/** The path's sideways swing; CSS scales it down on narrow screens (--zz-scale). */
const zigzag = (i: number) => ({ '--zz': ZIGZAG[i] }) as CSSProperties

export function Home() {
  const navigate = useNavigate()
  const { activeLang, progress, streak, xpByDay, dailyGoal, name, account } = useStore()
  const course = COURSES[activeLang]
  const prog = progress[activeLang]
  const due = dueCards(prog)
  const upcoming = Object.values(prog.cards).sort((a, b) => a.due - b.due)[0]
  const xp = todayXp(xpByDay)
  const goalPct = Math.min(1, xp / dailyGoal)
  const next = nextLessonId(course, prog.completedLessons)
  // Premade podcasts sit after the unit they're written for.
  const podcastAfter = new Map(premadeEpisodes(activeLang).map((e) => [e.unitId, e]))
  const heardPodcasts = doneEpisodes()
  const s = liveStreak(streak)
  // One section on screen at a time: yours by default, or one picked from the Sections page.
  const [params, setParams] = useSearchParams()
  const all = sections(course)
  const currentIndex = currentSectionIndex(course, prog.completedLessons)
  const asked = Number(params.get('section'))
  const section = all[Number.isInteger(asked) && asked >= 1 && asked <= all.length ? asked - 1 : currentIndex]
  const nextSection = all[section.index + 1]
  const sectionDone = isSectionComplete(section, prog.completedLessons)
  const showSection = (i: number) => {
    setParams(i === currentIndex ? {} : { section: String(i + 1) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
      {account && <TodayStrip app="lingora" navigate={navigate} lingoraDue={due.length} />}

      <div className="mode-grid home-extras">
        <Link to="/stories" className="mode-card" data-testid="home-stories">
          <span className="mode-icon"><Icon name="book" size={22} /></span>
          <strong>Stories</strong>
          <span className="muted small">Short scenes with audio and questions</span>
        </Link>
        <Link to="/goals" className="mode-card" data-testid="home-goals">
          <span className="mode-icon"><Icon name="target" size={22} /></span>
          <strong>Goals</strong>
          <span className="muted small">Quests, your league, challenges, badges</span>
        </Link>
      </div>

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

      <SectionBanner course={course} section={section} total={all.length} completed={prog.completedLessons} current={section.index === currentIndex} />

      {section.index > currentIndex && (
        <div className="jump-card">
          <Icon name="bolt" size={24} filled className="c-flame" />
          <div className="grow">
            <strong>Already know this?</strong>
            <span className="muted small">
              Pass a short test on {section.index === 1 ? 'Section 1' : `Sections 1–${section.index}`} to start here.
            </span>
          </div>
          <Link to={`/section-test/${section.index}`} className="btn btn-primary small">
            Jump here
          </Link>
        </div>
      )}

      {section.units.map((unit) => {
        const ui = course.units.indexOf(unit)
        const unitDone = isUnitComplete(unit, prog.completedLessons)
        const readingDone = unit.reading && prog.completedReadings.includes(unit.reading.id)
        const reviewDone = prog.completedLessons.includes(unitReviewId(unit.id))
        return (
          <section key={unit.id} className={`unit unit-${activeLang}`}>
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
                  <div key={lesson.id} className={`path-step ${current ? 'is-current' : ''}`} style={zigzag(li % ZIGZAG.length)}>
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
              <div className="path-step" style={zigzag(unit.lessons.length % ZIGZAG.length)}>
                <button
                  className={`node checkpoint ${reviewDone ? 'done' : unitDone ? 'current' : 'locked'}`}
                  disabled={!unitDone}
                  onClick={() => navigate(`/unit-review/${unit.id}`)}
                  aria-label={`Unit review${reviewDone ? ' (completed)' : unitDone ? '' : ' (locked)'}`}
                >
                  <Icon name={reviewDone ? 'check' : unitDone ? 'target' : 'lock'} size={28} />
                </button>
                <div className="node-label">
                  <strong>Unit review</strong>
                  <span className="muted small">Mixed practice of the whole unit</span>
                </div>
              </div>
              {unit.reading && (
                <div className="path-step" style={zigzag((unit.lessons.length + 1) % ZIGZAG.length)}>
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
              {podcastAfter.get(unit.id) && (() => {
                const ep = podcastAfter.get(unit.id)!
                const heard = heardPodcasts.includes(ep.id)
                return (
                  <div className="path-step" style={zigzag((unit.lessons.length + (unit.reading ? 2 : 1)) % ZIGZAG.length)}>
                    <button
                      className={`node podcast ${heard ? 'done' : unitDone ? 'current' : 'locked'}`}
                      disabled={!unitDone}
                      onClick={() => navigate(`/podcasts/${ep.id}`)}
                      aria-label={`Podcast: ${ep.title}`}
                      data-testid="path-podcast"
                    >
                      <Icon name={heard ? 'check' : unitDone ? 'headphones' : 'lock'} size={28} />
                    </button>
                    <div className="node-label">
                      <strong>Podcast</strong>
                      <span className="muted small">{ep.title}</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          </section>
        )
      })}

      {nextSection ? (
        <section className={`section-next ${sectionDone ? 'ready' : ''}`}>
          <span className="eyebrow">
            Up next · Section {nextSection.index + 1} · {nextSection.level}
          </span>
          <strong>{nextSection.title}</strong>
          <span className="muted small">{nextSection.blurb}</span>
          <button className={`btn ${sectionDone ? 'btn-primary' : ''}`} onClick={() => showSection(nextSection.index)}>
            {sectionDone ? `Start Section ${nextSection.index + 1}` : `Preview Section ${nextSection.index + 1}`} <Icon name="play" size={14} />
          </button>
        </section>
      ) : (
        <section className="coming-soon muted">
          More {course.standard} units are on the way. Keep your reviews up while you wait — that’s where long-term memory is built.
        </section>
      )}
    </div>
  )
}

/** The big header for the section on screen: where you are in the course and how far through it. */
function SectionBanner({ course, section, total, completed, current }: { course: Course; section: Section; total: number; completed: string[]; current: boolean }) {
  const { done, total: lessons } = sectionProgress(section, completed)
  const finished = done === lessons
  return (
    <section className={`section-banner lang-${course.lang}`}>
      <div className="row tight section-banner-top">
        <span className="eyebrow">
          Section {section.index + 1} of {total} · {levelLabel(course, section.level)}
        </span>
        <Link to="/sections" className="section-all">
          <Icon name="layers" size={14} /> All sections
        </Link>
      </div>
      <h2>{section.title}</h2>
      <p>{section.blurb}</p>
      <div className="section-progress">
        <div className="progress thin">
          <div style={{ width: `${(done / lessons) * 100}%` }} />
        </div>
        <span className="small">{finished ? 'Complete ✓' : `${done} / ${lessons} lessons${current ? '' : ' · not started'}`}</span>
      </div>
    </section>
  )
}
