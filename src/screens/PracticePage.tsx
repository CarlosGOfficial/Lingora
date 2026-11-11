import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { COURSES, isUnitComplete } from '../content'
import { VoiceNotice, useVoiceAvailable } from '../components/VoiceNotice'
import { recognitionSupported } from '../lib/speech'
import { useStore } from '../store/useStore'
import { api } from '../sync/api'

const MODES: { mode: string; title: string; desc: string; icon: IconName }[] = [
  { mode: 'speaking', title: 'Speaking · Shadowing', desc: 'Hear it, say it, get a pronunciation match score.', icon: 'mic' },
  { mode: 'listening', title: 'Listening · Dictation', desc: 'Train your ear — type and pick what you hear.', icon: 'headphones' },
  { mode: 'weak', title: 'Weak words', desc: 'Drill the items with the lowest memory stability.', icon: 'target' },
  { mode: 'writing', title: 'Writing · Stroke order', desc: 'Trace characters stroke by stroke, in the right order and direction.', icon: 'pencil' },
]

export function PracticePage() {
  const { activeLang, progress, account } = useStore()
  const course = COURSES[activeLang]
  const prog = progress[activeLang]
  const known = Object.keys(prog.cards).length
  const enough = known >= 4
  const canChat = prog.completedLessons.length > 0
  // Admin-only for now: the server decides who sees it.
  const [chatAllowed, setChatAllowed] = useState(false)
  useEffect(() => {
    if (!account) return setChatAllowed(false)
    let live = true
    api.chatStatus().then((r) => live && setChatAllowed(r.enabled), () => {})
    return () => {
      live = false
    }
  }, [account])
  const voice = useVoiceAvailable(course.bcp47)

  return (
    <div className="stack">
      <PageHeader icon="mic" title="Practice" subtitle="Focused drills on words you’ve already learned. Practice also updates your review schedule." />
      {!enough && <div className="cta-card calm">Complete your first lesson to unlock practice.</div>}

      <div className="mode-grid stagger">
        {chatAllowed && (
          <Link to={canChat ? '/conversation' : '#'} className={`mode-card featured ${canChat ? '' : 'disabled'}`} aria-disabled={!canChat}>
            <span className="mode-icon">
              <Icon name="chat" size={24} />
            </span>
            <strong>Conversation · AI partner</strong>
            <span className="muted small">Role-play real situations by typing or speaking, using only what you’ve learned.</span>
          </Link>
        )}
        <Link to="/decks" className="mode-card" data-testid="decks-card">
          <span className="mode-icon">
            <Icon name="layers" size={24} />
          </span>
          <strong>Community decks</strong>
          <span className="muted small">Flashcard decks made by learners, or your own. Follow one and its cards join your reviews.</span>
        </Link>
        <Link to="/duels" className="mode-card" data-testid="duels-card">
          <span className="mode-icon">
            <Icon name="bolt" size={24} />
          </span>
          <strong>Duels</strong>
          <span className="muted small">Race a friend or another learner through 10 quick questions. Ranked ladder, coins for playing.</span>
        </Link>
        <Link to="/study" className="mode-card" data-testid="study-card">
          <span className="mode-icon">
            <Icon name="book" size={24} />
          </span>
          <strong>Study rooms</strong>
          <span className="muted small">Study with friends on a shared focus timer, with a room chat and a Banter call.</span>
        </Link>
        {course.lang !== 'pt' && (
          <Link to="/characters" className="mode-card" data-testid="characters-card">
            <span className="mode-icon">
              <Icon name="book" size={24} />
            </span>
            <strong>{course.lang === 'zh' ? 'Hanzi explorer' : 'Kanji explorer'}</strong>
            <span className="muted small">Every character in your course: radicals, parts, stroke order and the words you know.</span>
          </Link>
        )}
        <Link to="/trainer" className="mode-card" data-testid="trainer-card">
          <span className="mode-icon">
            <Icon name="pencil" size={24} />
          </span>
          <strong>{course.lang === 'zh' ? 'Measure words' : 'Verb trainer'}</strong>
          <span className="muted small">{course.lang === 'pt' ? 'Conjugate every tense, from falo to falaria. Tables and drills.' : course.lang === 'ja' ? 'Verb and adjective forms: ます, ない, た, て and more.' : '一本书, 两只猫: which measure word goes with which noun.'}</span>
        </Link>
        <Link to="/mistakes" className="mode-card" data-testid="mistakes-card">
          <span className="mode-icon">
            <Icon name="flag" size={24} />
          </span>
          <strong>Mistakes notebook</strong>
          <span className="muted small">The words you’ve forgotten most. See them, then drill them.</span>
        </Link>
        {MODES.map((m) => {
          if (m.mode === 'writing' && course.lang === 'pt') return null
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
