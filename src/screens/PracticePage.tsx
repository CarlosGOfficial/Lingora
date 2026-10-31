import { Link } from 'react-router-dom'
import { Icon, type IconName } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { COURSES, isUnitComplete } from '../content'
import { VoiceNotice, useVoiceAvailable } from '../components/VoiceNotice'
import { recognitionSupported } from '../lib/speech'
import { useStore } from '../store/useStore'

const MODES: { mode: string; title: string; desc: string; icon: IconName }[] = [
  { mode: 'speaking', title: 'Speaking · Shadowing', desc: 'Hear it, say it, get a pronunciation match score.', icon: 'mic' },
  { mode: 'listening', title: 'Listening · Dictation', desc: 'Train your ear — type and pick what you hear.', icon: 'headphones' },
  { mode: 'weak', title: 'Weak words', desc: 'Drill the items with the lowest memory stability.', icon: 'target' },
]

export function PracticePage() {
  const { activeLang, progress } = useStore()
  const course = COURSES[activeLang]
  const prog = progress[activeLang]
  const known = Object.keys(prog.cards).length
  const enough = known >= 4
  const voice = useVoiceAvailable(course.bcp47)

  return (
    <div className="stack">
      <PageHeader icon="mic" title="Practice" subtitle="Focused drills on words you’ve already learned. Practice also updates your review schedule." />
      {!enough && <div className="cta-card calm">Complete your first lesson to unlock practice.</div>}

      <div className="mode-grid stagger">
        {MODES.map((m) => {
          const ok = enough && (m.mode !== 'listening' || voice)
          return (
            <Link key={m.mode} to={ok ? `/practice/${m.mode}` : '#'} className={`mode-card ${ok ? '' : 'disabled'}`} aria-disabled={!ok}>
              <span className="mode-icon">
              <Icon name={m.icon} size={24} />
            </span>
              <strong>{m.title}</strong>
              <span className="muted small">{m.desc}</span>
            </Link>
          )
        })}
      </div>

      <VoiceNotice course={course} />
      {!recognitionSupported() && <p className="small muted">Speech recognition isn’t available here — speaking drills will use self-assessment.</p>}

      <h2>Stories</h2>
      <p className="muted">Graded readers built only from words you’ve met — comprehensible input with audio.</p>
      <div className="story-list stagger">
        {course.units.map((u) =>
          u.reading ? (
            <Link
              key={u.reading.id}
              to={isUnitComplete(u, prog.completedLessons) ? `/reading/${u.reading.id}` : '#'}
              className={`story-card ${isUnitComplete(u, prog.completedLessons) ? '' : 'disabled'}`}
            >
              <Icon name={isUnitComplete(u, prog.completedLessons) ? 'book' : 'lock'} size={24} />
              <div className="grow">
                <strong lang={course.bcp47}>{u.reading.title}</strong>
                <div className="muted small">
                  {u.level} · {u.title}
                </div>
              </div>
              {prog.completedReadings.includes(u.reading.id) && <Icon name="check" className="c-success" />}
            </Link>
          ) : null,
        )}
      </div>
    </div>
  )
}
