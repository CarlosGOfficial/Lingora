import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_NAME, DAILY_GOALS } from '../config'
import { COURSES, LANG_CODES } from '../content'
import type { LangCode } from '../content/types'
import { useStore } from '../store/useStore'
import { logOut } from '../sync/sync'

/** First-time setup after signing up (or opening Lingora with a Wordle account): course and daily goal. */
export function Onboarding() {
  const onboard = useStore((s) => s.onboard)
  const account = useStore((s) => s.account)
  const [step, setStep] = useState(0)
  const [lang, setLang] = useState<LangCode | null>(null)
  const [goal, setGoal] = useState(20)
  const navigate = useNavigate()
  const name = account?.username ?? ''

  return (
    <div className="onboarding">
      <div className="onboarding-card">
        <div className="brand big">
          <span className="brand-mark">L</span>
          <span>
            {APP_NAME.slice(0, 3)}
            <span className="hero-gradient">{APP_NAME.slice(3)}</span>
          </span>
        </div>
        <div className="setup-steps" aria-label={`Step ${step + 1} of 2`}>
          <span className={step >= 0 ? 'on' : ''} />
          <span className={step >= 1 ? 'on' : ''} />
        </div>

        {step === 0 && (
          <>
            <h1>{name ? `Welcome, ${name}!` : 'Welcome!'}</h1>
            <p className="muted">What do you want to learn first? You can add the other courses any time.</p>
            <div className="lang-cards">
              {LANG_CODES.map((code) => {
                const c = COURSES[code]
                return (
                  <button key={code} className={`lang-card lang-${code} ${lang === code ? 'active' : ''}`} onClick={() => setLang(code)} aria-pressed={lang === code}>
                    <span className="lang-badge" lang={c.bcp47}>
                      {c.badge}
                    </span>
                    <span className="lang-card-text">
                      <strong>{c.name}</strong>
                      <span lang={c.bcp47} className="muted">
                        {c.nativeName}
                      </span>
                    </span>
                    <span className="pill">{c.standard}</span>
                  </button>
                )
              })}
            </div>
            <button className="btn btn-primary btn-lg block" disabled={!lang} onClick={() => setStep(1)}>
              Continue
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h1>Pick a daily goal</h1>
            <p className="muted">Small and steady beats cramming. You can change this any time.</p>
            <div className="goal-list">
              {DAILY_GOALS.map((g) => (
                <button key={g.xp} className={`goal-option ${goal === g.xp ? 'active' : ''}`} onClick={() => setGoal(g.xp)} aria-pressed={goal === g.xp}>
                  <strong>{g.label}</strong>
                  <span className="muted">
                    {g.xp} XP / day · ~{Math.round(g.xp / 2)} min
                  </span>
                </button>
              ))}
            </div>
            <div className="row">
              <button className="btn btn-ghost" onClick={() => setStep(0)}>
                Back
              </button>
              <span className="grow" />
            </div>
            {/* New to it, or already know some (the placement test)? */}
            <div className="onboard-choice">
              <button className="btn btn-primary btn-lg block" data-testid="onboard-start" onClick={() => lang && onboard(name, lang, goal)}>
                I'm new: start my first lesson
              </button>
              <button
                className="btn btn-lg block"
                data-testid="onboard-placement"
                onClick={() => {
                  if (!lang) return
                  navigate('/placement')
                  onboard(name, lang, goal)
                }}
              >
                I already know some: find my level
              </button>
            </div>
          </>
        )}

        {account && (
          <p className="small muted center-text setup-foot">
            Signed in as <strong>{account.username}</strong> ·{' '}
            <button className="link-btn" onClick={() => void logOut()}>
              Not you?
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
