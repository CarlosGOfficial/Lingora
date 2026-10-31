import { useState } from 'react'
import { APP_NAME, DAILY_GOALS } from '../config'
import { COURSES, LANG_CODES } from '../content'
import type { LangCode } from '../content/types'
import { useStore } from '../store/useStore'

const METHODS = [
  ['Spaced repetition', 'FSRS schedules each word right before you’d forget it.'],
  ['Active recall', 'You produce answers — typing, speaking, building sentences.'],
  ['Real input', 'Graded stories at your level, read and heard.'],
  ['Shadowing', 'Hear a native model, repeat, get scored.'],
]

export function Onboarding() {
  const onboard = useStore((s) => s.onboard)
  const [step, setStep] = useState(0)
  const [lang, setLang] = useState<LangCode | null>(null)
  const [goal, setGoal] = useState(20)
  const [name, setName] = useState('')

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

        {step === 0 && (
          <>
            <h1>What do you want to learn?</h1>
            <p className="muted">Every course follows an official proficiency standard, so you always know your level.</p>
            <div className="lang-cards">
              {LANG_CODES.map((code) => {
                const c = COURSES[code]
                return (
                  <button key={code} className={`lang-card lang-${code} ${lang === code ? 'active' : ''}`} onClick={() => setLang(code)}>
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
                <button key={g.xp} className={`goal-option ${goal === g.xp ? 'active' : ''}`} onClick={() => setGoal(g.xp)}>
                  <strong>{g.label}</strong>
                  <span className="muted">{g.xp} XP / day · ~{Math.round(g.xp / 2)} min</span>
                </button>
              ))}
            </div>
            <div className="row">
              <button className="btn btn-ghost" onClick={() => setStep(0)}>
                Back
              </button>
              <button className="btn btn-primary btn-lg grow" onClick={() => setStep(2)}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (lang) onboard(name, lang, goal)
            }}
          >
            <h1>How it works</h1>
            <ul className="method-list">
              {METHODS.map(([t, d]) => (
                <li key={t}>
                  <strong>{t}</strong>
                  <span className="muted">{d}</span>
                </li>
              ))}
            </ul>
            <label className="field">
              <span>What should we call you?</span>
              <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoFocus maxLength={30} />
            </label>
            <div className="row">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="submit" className="btn btn-primary btn-lg grow">
                Start learning
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
