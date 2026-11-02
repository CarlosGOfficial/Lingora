import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CompleteScreen } from '../components/CompleteScreen'
import { Icon } from '../components/Icon'
import { XP } from '../config'
import { COURSES } from '../content'
import { learnerContext, scenarios } from '../chat/context'
import type { ChatLine, ChatReply, ChatScenario, ChatTurn } from '../chat/types'
import { listen, recognitionErrorMessage, recognitionSupported, speak, ttsSupported, type Listening } from '../lib/speech'
import { useStore } from '../store/useStore'
import { ApiError, api } from '../sync/api'

type Line = { role: 'assistant'; line: ChatLine } | { role: 'user'; text: string; feedback?: ChatReply['feedback'] }

const MAX_TURNS = 18

/** Role-play with an AI partner who sticks to the words and grammar you've studied. */
export function ConversationPage() {
  const navigate = useNavigate()
  const { activeLang, progress, account, settings, recordSession, streak } = useStore()
  const course = COURSES[activeLang]
  const completed = progress[activeLang].completedLessons
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [scenario, setScenario] = useState<ChatScenario | null>(null)
  const [done, setDone] = useState<{ xp: number; streakBefore: number } | null>(null)

  useEffect(() => {
    api.chatStatus().then((r) => setEnabled(r.enabled), () => setEnabled(false))
  }, [])

  if (done)
    return <CompleteScreen title="Conversation complete!" xp={done.xp} streakBefore={done.streakBefore} onContinue={() => navigate('/practice')} />

  if (scenario)
    return (
      <ChatView
        key={scenario.id}
        scenario={scenario}
        onExit={() => setScenario(null)}
        onFinish={(sent, goalMet) => {
          const xp = sent < 2 ? 0 : XP.practiceBase + Math.min(XP.chatMaxMessages, sent) * XP.chatPerMessage + (goalMet ? XP.chatGoalBonus : 0)
          if (!xp) return navigate('/practice')
          const before = streak.current
          recordSession({ lang: activeLang, xp, ratings: {} })
          setDone({ xp, streakBefore: before })
        }}
      />
    )

  const blocked =
    enabled === false
      ? 'Conversation practice isn’t available yet — check back soon.'
      : !account
        ? 'sign-in'
        : !completed.length
          ? 'Finish your first lesson so your partner knows which words to use.'
          : null

  return (
    <div className="session">
      <header className="session-top">
        <button className="icon-btn" aria-label="Back" onClick={() => navigate('/practice')}>
          <Icon name="x" />
        </button>
        <strong className="grow">Conversation</strong>
      </header>
      <main className="session-body chat-setup stack">
        <div>
          <h2 className="ex-title">Choose a conversation</h2>
          <p className="muted">
            Your partner speaks {course.name} using only words and grammar from lessons you’ve finished, and gently corrects you as you go.
            {settings.speaking && recognitionSupported() ? ' Type or tap the mic to answer.' : ' Type your answers.'}
          </p>
        </div>
        {blocked === 'sign-in' ? (
          <div className="cta-card calm">
            Sign in to chat — it keeps the AI partner for real learners. <Link to="/profile">Sign in on your profile</Link>
          </div>
        ) : blocked ? (
          <div className="cta-card calm">{blocked}</div>
        ) : (
          <div className="scenario-list stagger">
            {scenarios(course, completed).map((s) => (
              <button key={s.id} className="scenario-card" onClick={() => setScenario(s)} disabled={enabled === null}>
                <Icon name={s.id === 'free' ? 'chat' : 'target'} size={22} />
                <span className="grow">
                  <strong>{s.goal}</strong>
                  <span className="muted small">{s.title}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function ChatView({ scenario, onExit, onFinish }: { scenario: ChatScenario; onExit: () => void; onFinish: (sent: number, goalMet: boolean) => void }) {
  const { activeLang, progress, settings } = useStore()
  const course = COURSES[activeLang]
  const [lines, setLines] = useState<Line[]>([])
  const [suggestions, setSuggestions] = useState<ChatLine[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [goalMet, setGoalMet] = useState(false)
  const [showReading, setShowReading] = useState(course.lang !== 'pt' && settings.showReading)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [listening, setListening] = useState(false)
  const mic = useRef<Listening | null>(null)
  const end = useRef<HTMLDivElement>(null)
  const ctx = useRef(learnerContext(course, progress[activeLang].completedLessons, scenario))
  const sent = lines.filter((l) => l.role === 'user').length
  const canSpeak = settings.speaking && recognitionSupported()

  const ask = async (history: Line[]) => {
    setBusy(true)
    setError('')
    const messages: ChatTurn[] = history.map((l) => (l.role === 'user' ? { role: 'user', text: l.text } : { role: 'assistant', text: l.line.target }))
    try {
      const r = await api.chat({ ...ctx.current, messages })
      const next = [...history]
      const last = next[next.length - 1]
      if (last?.role === 'user' && r.feedback.verdict !== 'none') next[next.length - 1] = { ...last, feedback: r.feedback }
      next.push({ role: 'assistant', line: r.reply })
      setLines(next)
      setSuggestions(r.suggestions)
      if (r.goalMet) setGoalMet(true)
      if (settings.listening && ttsSupported()) speak(r.reply.target, course.bcp47, settings.speechRate)
    } catch (e) {
      setLines(history)
      setError(e instanceof ApiError ? e.message : 'Your partner didn’t answer. Try again.')
    } finally {
      setBusy(false)
    }
  }

  // The partner opens the conversation (once, even when effects run twice in dev).
  const opened = useRef(false)
  useEffect(() => {
    if (!opened.current) void ask([])
    opened.current = true
    return () => {
      mic.current?.stop()
      window.speechSynthesis?.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [lines, busy, error])

  const send = (text = draft) => {
    const t = text.trim().slice(0, 400)
    if (!t || busy) return
    setDraft('')
    setSuggestions([])
    const history: Line[] = [...lines, { role: 'user', text: t }]
    setLines(history)
    void ask(history)
  }

  const record = async () => {
    if (listening) return mic.current?.stop()
    window.speechSynthesis?.cancel()
    setError('')
    setListening(true)
    mic.current = listen(course.bcp47, setDraft)
    try {
      const alts = await mic.current.result
      if (alts[0]) setDraft(alts[0])
      else setError(recognitionErrorMessage('no-speech'))
    } catch (e) {
      setError(recognitionErrorMessage((e as Error).message))
    } finally {
      setListening(false)
    }
  }

  const over = sent >= MAX_TURNS

  return (
    <div className="session chat">
      <header className="session-top">
        <button className="icon-btn" aria-label="Back to conversations" onClick={() => (sent === 0 || confirm('Leave this conversation? It won’t earn XP.')) && onExit()}>
          <Icon name="x" />
        </button>
        <div className="grow chat-title">
          <strong>{scenario.goal}</strong>
          <span className="muted small">{goalMet ? '✓ Goal reached — keep chatting or finish' : scenario.title}</span>
        </div>
        {course.lang !== 'pt' && (
          <button className={`chip-toggle ${showReading ? 'on' : ''}`} onClick={() => setShowReading(!showReading)} aria-pressed={showReading}>
            {course.readingLabel ?? 'Reading'}
          </button>
        )}
        <button className="btn btn-primary small" onClick={() => onFinish(sent, goalMet)} disabled={busy}>
          Finish
        </button>
      </header>

      <main className="session-body chat-log" aria-live="polite">
        {lines.map((l, i) =>
          l.role === 'assistant' ? (
            <div key={i} className="bubble-row them">
              <div className="bubble them">
                <div className="bubble-target" lang={course.bcp47}>
                  {l.line.target}
                </div>
                {showReading && l.line.reading && <div className="bubble-reading">{l.line.reading}</div>}
                {revealed.has(i) ? (
                  <div className="bubble-translation">{l.line.translation}</div>
                ) : (
                  <button className="link-btn small" onClick={() => setRevealed(new Set(revealed).add(i))}>
                    Translate
                  </button>
                )}
              </div>
              {ttsSupported() && (
                <button className="audio-btn" aria-label="Play" onClick={() => speak(l.line.target, course.bcp47, settings.speechRate)}>
                  <Icon name="volume" size={18} />
                </button>
              )}
            </div>
          ) : (
            <div key={i} className="bubble-row me">
              <div className="bubble me" lang={course.bcp47}>
                {l.text}
              </div>
              {l.feedback && l.feedback.verdict !== 'none' && (
                <div className={`chat-feedback ${l.feedback.verdict}`}>
                  <Icon name={l.feedback.verdict === 'great' ? 'check' : 'star'} size={14} />
                  <span>
                    {l.feedback.verdict === 'great' ? 'Natural!' : l.feedback.verdict === 'ok' ? 'Nearly:' : 'Try:'}{' '}
                    {l.feedback.corrected && <strong lang={course.bcp47}>{l.feedback.corrected}</strong>}
                    {l.feedback.note && <span className="muted"> — {l.feedback.note}</span>}
                  </span>
                </div>
              )}
            </div>
          ),
        )}
        {busy && (
          <div className="bubble-row them">
            <div className="bubble them typing" aria-label="Your partner is typing">
              <span className="listening-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>
        )}
        {error && (
          <div className="speak-result off" role="alert">
            {error}{' '}
            {!busy && (lines.length === 0 || lines[lines.length - 1].role === 'user') && (
              <button className="link-btn" onClick={() => void ask(lines)}>
                Try again
              </button>
            )}
          </div>
        )}
        <div ref={end} />
      </main>

      <footer className="chat-compose">
        {over ? (
          <p className="muted small center">Great conversation! Tap Finish to collect your XP.</p>
        ) : (
          <>
            {suggestions.length > 0 && !busy && (
              <div className="chat-suggestions" aria-label="Ideas for what to say">
                {suggestions.map((s, i) => (
                  <button key={i} className="suggestion" onClick={() => setDraft(s.target)} title={s.translation}>
                    <span lang={course.bcp47}>{s.target}</span>
                    <span className="muted small">{s.translation}</span>
                  </button>
                ))}
              </div>
            )}
            <form
              className="chat-input"
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
            >
              {canSpeak && (
                <button type="button" className={`icon-btn mic-mini ${listening ? 'is-live' : ''}`} onClick={record} aria-label={listening ? 'Stop listening' : 'Speak'}>
                  <Icon name="mic" size={20} />
                </button>
              )}
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={listening ? 'Listening…' : `Reply in ${course.name}…`}
                lang={course.bcp47}
                maxLength={400}
                autoComplete="off"
                aria-label="Your reply"
              />
              <button type="submit" className="btn btn-primary icon-only" disabled={busy || !draft.trim()} aria-label="Send">
                <Icon name="send" size={18} />
              </button>
            </form>
          </>
        )}
      </footer>
    </div>
  )
}
