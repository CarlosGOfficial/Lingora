import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AuthForm, type AuthMode } from '../../components/AuthForm'
import { Icon, type IconName } from '../../components/Icon'
import { APP_NAME } from '../../config'
import { COURSES, LANG_CODES, allLessons } from '../../content'
import { useStore } from '../../store/useStore'
import { api } from '../../sync/api'

/** What visitors see before signing in: the landing page and the log-in / sign-up page. */
export function PublicSite() {
  const location = useLocation()
  return (
    <Routes>
      <Route index element={<Landing />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      {/* Deep links (a profile, a lesson…) ask you to log in, then continue there. */}
      <Route path="*" element={<Navigate to="/login" replace state={{ from: location.pathname + location.search }} />} />
    </Routes>
  )
}

function Brand() {
  return (
    <Link to="/" className="brand site-brand">
      <span className="brand-mark">L</span>
      <span>
        {APP_NAME.slice(0, 3)}
        <span className="hero-gradient">{APP_NAME.slice(3)}</span>
      </span>
    </Link>
  )
}

function SiteNav() {
  return (
    <header className="site-nav">
      <Brand />
      <nav className="site-links">
        <a href="#courses">Courses</a>
        <a href="#method">How it works</a>
        <a href="#together">Friends</a>
      </nav>
      <div className="row tight">
        <Link to="/login" className="btn btn-ghost">
          Log in
        </Link>
        <Link to="/signup" className="btn btn-primary">
          Get started
        </Link>
      </div>
    </header>
  )
}

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'layers', title: 'Spaced repetition', text: 'FSRS brings every word back right before you’d forget it, so reviews stay short and stick.' },
  { icon: 'mic', title: 'Speaking with feedback', text: 'Shadow a native model and see which syllables and tones landed — live, as you speak.' },
  { icon: 'headphones', title: 'Listening & dictation', text: 'Train your ear with audio-first drills and type what you hear.' },
  { icon: 'book', title: 'Graded stories', text: 'Short readers built only from words you’ve met: real input you can actually follow.' },
  { icon: 'target', title: 'Active recall', text: 'Build sentences, fill gaps, match pairs and type answers instead of just recognising them.' },
  { icon: 'star', title: 'Grammar that explains', text: 'Every lesson has notes with patterns and examples, collected in a guidebook per unit.' },
]

function courseFacts(code: (typeof LANG_CODES)[number]) {
  const c = COURSES[code]
  const levels = [...new Set(c.units.map((u) => u.level))]
  return { c, lessons: allLessons(c).length, range: levels.length > 1 ? `${levels[0]} – ${levels[levels.length - 1]}` : levels[0] }
}

function Landing() {
  const totalLessons = LANG_CODES.reduce((n, l) => n + allLessons(COURSES[l]).length, 0)
  return (
    <div className="site">
      <SiteNav />

      <section className="site-hero">
        <div className="hero-copy">
          <span className="pill">Chinese · Japanese · Brazilian Portuguese</span>
          <h1>
            Learn a language the way <span className="hero-gradient">memory actually works</span>.
          </h1>
          <p className="lead">
            Bite-sized lessons that follow real proficiency standards — HSK, JLPT and CEFR — with speaking, listening, reading and typing practice, scheduled by
            spaced repetition.
          </p>
          <div className="row">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Start learning — it’s free
            </Link>
            <Link to="/login" className="btn btn-lg">
              I have an account
            </Link>
          </div>
          <p className="small muted">Already play Wordle Unlimited? Use the same account.</p>
        </div>
        <HeroDemo />
      </section>

      <section className="site-strip">
        <div>
          <strong>{totalLessons}+</strong>
          <span>lessons</span>
        </div>
        <div>
          <strong>3</strong>
          <span>official standards</span>
        </div>
        <div>
          <strong>4</strong>
          <span>skills every lesson</span>
        </div>
        <div>
          <strong>5 min</strong>
          <span>a day is enough</span>
        </div>
      </section>

      <section id="courses" className="site-section">
        <h2>Pick your course</h2>
        <p className="muted">Each course is mapped to an official framework, so you always know your level.</p>
        <div className="course-cards">
          {LANG_CODES.map((code) => {
            const { c, lessons, range } = courseFacts(code)
            return (
              <Link key={code} to="/signup" className={`course-card lang-${code}`}>
                <span className="lang-badge" lang={c.bcp47}>
                  {c.badge}
                </span>
                <strong>{c.name}</strong>
                <span className="muted" lang={c.bcp47}>
                  {c.nativeName}
                </span>
                <span className="course-meta">
                  <span className="pill">{c.standard}</span>
                  <span className="small muted">
                    {range} · {lessons} lessons
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <section id="method" className="site-section">
        <h2>Built on how people really learn</h2>
        <p className="muted">No endless multiple choice. Every lesson makes you produce the language — and comes back at the right time.</p>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature">
              <span className="mode-icon">
                <Icon name={f.icon} size={22} />
              </span>
              <strong>{f.title}</strong>
              <span className="muted small">{f.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="together" className="site-section together">
        <div>
          <h2>Keep each other going</h2>
          <ul className="check-list">
            <li>
              <Icon name="flame" size={18} filled className="c-flame" /> Daily streaks with freezes for busy days
            </li>
            <li>
              <Icon name="users" size={18} /> Weekly XP leaderboard with your friends
            </li>
            <li>
              <Icon name="chat" size={18} /> Chats and group chats — shared with Wordle Unlimited
            </li>
            <li>
              <Icon name="bag" size={18} /> Earn coins for themes, titles and name colours
            </li>
          </ul>
        </div>
        <div className="mini-board" aria-hidden="true">
          {[
            ['Maya', 'ja', 340, 18],
            ['You', 'zh', 295, 12],
            ['Leo', 'pt', 210, 5],
          ].map(([name, lang, xp, streak], i) => (
            <div key={name as string} className={`mini-row ${name === 'You' ? 'me' : ''}`}>
              <span className="rank">{i + 1}</span>
              <span className="avatar avatar-sm">{(name as string)[0]}</span>
              <span className="grow">
                <strong>{name}</strong> <span className="small muted">· {COURSES[lang as 'zh'].name}</span>
              </span>
              <span className="small">
                <Icon name="flame" size={14} filled className="c-flame" /> {streak}
              </span>
              <span className="lb-xp">{xp} XP</span>
            </div>
          ))}
        </div>
      </section>

      <section className="site-cta">
        <h2>Your first lesson takes five minutes.</h2>
        <Link to="/signup" className="btn btn-primary btn-lg">
          Create your free account
        </Link>
      </section>

      <footer className="site-footer small muted">
        <Brand />
        <span>
          Courses follow HSK 3.0, JLPT and CEFR. Accounts are shared with Wordle Unlimited. © {new Date().getFullYear()} {APP_NAME}
        </span>
      </footer>
    </div>
  )
}

/** A little animated lesson card for the hero. */
function HeroDemo() {
  const [picked, setPicked] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setPicked((p) => !p), 2600)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="hero-demo" aria-hidden="true">
      <div className="demo-card">
        <div className="progress thin">
          <div style={{ width: picked ? '72%' : '60%' }} />
        </div>
        <span className="small muted">Select the meaning</span>
        <div className="demo-word" lang="zh-CN">
          你好
        </div>
        <div className="small muted">nǐ hǎo</div>
        <div className="demo-options">
          {['Thank you', 'Hello', 'Goodbye', 'Sorry'].map((o) => (
            <span key={o} className={`demo-option ${picked && o === 'Hello' ? 'right' : ''}`}>
              {o}
            </span>
          ))}
        </div>
      </div>
      <span className="demo-chip chip-streak">
        <Icon name="flame" size={16} filled /> 12 day streak
      </span>
      <span className={`demo-chip chip-xp ${picked ? 'pop' : ''}`}>
        <Icon name="bolt" size={16} filled /> +15 XP
      </span>
      <span className="demo-chip chip-speak">
        <Icon name="mic" size={16} /> 92% pronunciation
      </span>
    </div>
  )
}

function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const hasLocalProgress = useStore((s) => s.onboarded)
  const setGuest = useStore((s) => s.setGuest)
  const [server, setServer] = useState<'checking' | 'ready' | 'unavailable'>('checking')

  useEffect(() => {
    api.health().then(
      (h) => setServer(h.db ? 'ready' : 'unavailable'),
      () => setServer('unavailable'),
    )
  }, [])

  return (
    <div className="site auth-site">
      <header className="site-nav">
        <Brand />
      </header>
      <div className="auth-card">
        <h1>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">
          {mode === 'signup' ? 'Save your progress, keep your streak on every device and learn with friends.' : 'Log in to pick up where you left off.'}
        </p>
        {hasLocalProgress && <div className="notice compact small">Progress you made on this device will be added to your account.</div>}
        {server === 'unavailable' ? (
          <div className="stack-sm">
            <div className="cta-card calm">Accounts aren’t available right now. You can still learn — progress will be saved on this device only.</div>
            <button
              className="btn btn-primary btn-lg block"
              onClick={() => {
                setGuest(true)
                navigate('/', { replace: true })
              }}
            >
              Use Lingora on this device
            </button>
          </div>
        ) : (
          <AuthForm mode={mode} onModeChange={(m) => navigate(m === 'signup' ? '/signup' : '/login', { replace: true, state: location.state })} onDone={() => navigate(from ?? '/', { replace: true })} />
        )}
      </div>
    </div>
  )
}
