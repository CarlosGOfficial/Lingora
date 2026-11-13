import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { CompleteScreen } from '../components/CompleteScreen'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { toast } from '../components/Toaster'
import type { Course } from '../content/types'
import { COURSES, allItems } from '../content'
import { buildDict, segment, type Dict, type LookupLang } from '../lib/lookup'
import { ttsSupported } from '../lib/speech'
import { PODCAST_XP, courseEpisode, finishedUnits, type Episode, type EpisodeLine } from '../podcast/episode'
import { doneEpisodes, markDone, saveEpisodes, savedEpisode, savedEpisodes } from '../podcast/store'
import { premadeEpisodes } from '../podcast/premade'
import { useStore } from '../store/useStore'
import { api } from '../sync/api'

/*
 * Listening podcasts (src/podcast/episode.ts): episodes for the units you've finished.
 * Course episodes are always there; Claude-written ones come from the server and are kept
 * on this device so they play offline too.
 */

function useEpisodes() {
  const activeLang = useStore((s) => s.activeLang)
  const completed = useStore((s) => s.progress[s.activeLang].completedLessons)
  const signedIn = useStore((s) => !!s.account)
  const course = COURSES[activeLang]
  const units = finishedUnits(course, completed)
  const last = units[units.length - 1]
  // Premade episodes for the units you've finished (newest first), then each unit's own sentences.
  const courseEps = useMemo(() => {
    const done = new Set(units.map((u) => u.id))
    const pre = premadeEpisodes(course.lang).filter((e) => done.has(e.unitId)).reverse()
    return [...pre, ...units.slice().reverse().map((u) => courseEpisode(course, u)).filter((e): e is Episode => !!e)]
  }, [course, units.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const [server, setServer] = useState<Episode[]>(() => savedEpisodes().filter((e) => e.lang === activeLang))
  const [canMake, setCanMake] = useState(false)
  useEffect(() => {
    if (!signedIn || !last) return
    let live = true
    api.podcasts(activeLang, last.id).then(
      (r) => {
        if (!live) return
        saveEpisodes(r.episodes)
        setServer(savedEpisodes().filter((e) => e.lang === activeLang))
        setCanMake(r.canMake)
      },
      () => {}, // offline: the saved ones
    )
    return () => {
      live = false
    }
  }, [activeLang, last?.id, signedIn]) // eslint-disable-line react-hooks/exhaustive-deps
  return { course, last, courseEps, server, setServer, canMake }
}

const fmtLen = (e: Episode) => {
  const chars = e.lines.reduce((n, l) => n + l.target.length, 0)
  // Roughly: 4 CJK characters or 14 Latin characters a second at a learner's speed.
  const secs = e.lang === 'pt' ? chars / 14 : chars / 4
  return `${Math.max(1, Math.round((secs + e.lines.length * 0.6) / 60))} min`
}

export function PodcastsPage() {
  const { course, last, courseEps, server, setServer, canMake } = useEpisodes()
  const done = doneEpisodes()
  const [making, setMaking] = useState(false)
  const make = async () => {
    if (!last) return
    setMaking(true)
    try {
      const ep = await api.makePodcast(course.lang, last.id)
      saveEpisodes([ep])
      setServer(savedEpisodes().filter((e) => e.lang === course.lang))
    } catch (e) {
      toast({ title: 'No new episode', description: (e as Error).message })
    } finally {
      setMaking(false)
    }
  }
  const card = (e: Episode) => (
    <Link key={e.id} to={`/podcasts/${e.id}`} className="podcast-card" data-testid="podcast-card">
      <span className={`podcast-art lang-${e.lang}`}>
        <Icon name="headphones" size={22} />
      </span>
      <span className="grow">
        <strong>{e.title}</strong>
        <span className="small muted">{e.summary}</span>
        <span className="podcast-meta small">
          {fmtLen(e)} · {e.lines.length} lines · {Math.round(e.known * 100)}% known{e.source === 'ai' ? ' · new' : ''}
          {done.includes(e.id) && (
            <span className="c-good">
              {' '}
              · <Icon name="check" size={12} /> heard
            </span>
          )}
        </span>
      </span>
      <Icon name="play" size={18} />
    </Link>
  )
  return (
    <div className="stack">
      <PageHeader icon="headphones" title="Podcasts" subtitle="Two voices, words you know. Tap any word for its meaning, then answer three questions." />
      {!ttsSupported() && <div className="cta-card calm">Your browser can’t speak aloud, so episodes play as a transcript only.</div>}
      {!last ? (
        <div className="cta-card calm">Finish your first unit to unlock podcasts.</div>
      ) : (
        <>
          {(server.length > 0 || canMake) && (
            <section className="stack-sm">
              <div className="row podcast-bar">
                <h2 className="section-title">Fresh episodes</h2>
                {canMake && (
                  <button className="btn btn-sm" onClick={make} disabled={making} data-testid="podcast-make">
                    <Icon name="plus" size={14} /> {making ? 'Writing…' : 'New episode'}
                  </button>
                )}
              </div>
              {server.length ? <div className="podcast-list stagger">{server.map(card)}</div> : <p className="small muted">No fresh episodes for {last.title} yet. Make the first one!</p>}
            </section>
          )}
          <section className="stack-sm">
            <h2 className="section-title">From your course</h2>
            <div className="podcast-list stagger">{courseEps.map(card)}</div>
          </section>
        </>
      )}
    </div>
  )
}

/* ---------- Player ---------- */

function voicesFor(lang: string): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return []
  const prefix = lang.toLowerCase().split('-')[0]
  return window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(prefix))
}

/** Plays lines one after another with two voices (or one voice at two pitches). */
function usePlayer(lines: EpisodeLine[], bcp47: string) {
  const [at, setAt] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(0.9)
  const [heardAll, setHeardAll] = useState(false)
  const token = useRef(0)
  const stop = () => {
    token.current++
    if (ttsSupported()) window.speechSynthesis.cancel()
    setPlaying(false)
  }
  const playFrom = (i: number) => {
    if (!ttsSupported()) return
    const my = ++token.current
    window.speechSynthesis.cancel()
    const voices = voicesFor(bcp47)
    const step = (k: number) => {
      if (token.current !== my) return
      if (k >= lines.length) {
        setPlaying(false)
        setHeardAll(true)
        return
      }
      setAt(k)
      const u = new SpeechSynthesisUtterance(lines[k].target)
      u.lang = bcp47
      u.rate = rate
      const v = voices[lines[k].speaker % Math.max(1, voices.length)]
      if (v) u.voice = v
      // One voice only? Tell the speakers apart by pitch.
      if (voices.length < 2) u.pitch = lines[k].speaker ? 1.25 : 0.85
      u.onend = () => setTimeout(() => step(k + 1), 350)
      u.onerror = () => token.current === my && setPlaying(false)
      window.speechSynthesis.speak(u)
    }
    setPlaying(true)
    step(i)
  }
  useEffect(() => stop, []) // stop speaking on leave
  return { at, setAt, playing, playFrom, stop, rate, setRate, heardAll, setHeardAll }
}

function dictFor(course: Course): Dict {
  const words = allItems(course).filter((i) => i.kind === 'word').map((i): [string, string, string, string] => [i.target, i.reading ?? '', i.meaning, i.id])
  return buildDict({ v: 1, lang: course.lang as LookupLang, words, chars: {} })
}

function Line({ line, active, showEn, dict, onTap }: { line: EpisodeLine; active: boolean; showEn: boolean; dict: Dict; onTap: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [word, setWord] = useState<{ text: string; reading: string; meaning: string } | null>(null)
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [active])
  const tokens = useMemo(() => segment(line.target, dict), [line.target, dict])
  return (
    <div ref={ref} className={`podcast-line speaker-${line.speaker} ${active ? 'active' : ''}`} data-testid="podcast-line" onClick={onTap}>
      <span className="podcast-who">{line.speaker ? 'B' : 'A'}</span>
      <div className="grow">
        <div className="podcast-target">
          {tokens.map((t, i) =>
            t.entry ? (
              <button
                key={i}
                className="podcast-word"
                data-testid="podcast-word"
                onClick={(e) => {
                  e.stopPropagation()
                  setWord(word?.text === t.entry!.text ? null : { text: t.entry!.text, reading: t.entry!.reading, meaning: t.entry!.meaning })
                }}
              >
                {t.text}
              </button>
            ) : (
              <span key={i}>{t.text}</span>
            ),
          )}
        </div>
        {word && (
          <div className="podcast-gloss small" data-testid="podcast-gloss">
            <strong>{word.text}</strong> {word.reading && <span className="muted">{word.reading}</span>} — {word.meaning}
          </div>
        )}
        {line.reading && showEn && <div className="small muted">{line.reading}</div>}
        {showEn && <div className="small muted">{line.translation}</div>}
      </div>
    </div>
  )
}

export function PodcastPlayer() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const activeLang = useStore((s) => s.activeLang)
  const completed = useStore((s) => s.progress[s.activeLang].completedLessons)
  const recordSession = useStore((s) => s.recordSession)
  const streakBefore = useStore((s) => s.streak.current)
  const course = COURSES[activeLang]
  const episode = useMemo(() => {
    if (id.startsWith('pre-')) {
      const ep = premadeEpisodes(course.lang).find((e) => e.id === id)
      return ep && finishedUnits(course, completed).some((u) => u.id === ep.unitId) ? ep : null
    }
    if (id.startsWith('course-')) {
      const unit = finishedUnits(course, completed).find((u) => `course-${u.id}` === id)
      return unit ? courseEpisode(course, unit) : null
    }
    return savedEpisode(id)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  const dict = useMemo(() => dictFor(course), [course])
  const player = usePlayer(episode?.lines ?? [], course.bcp47)
  const [showEn, setShowEn] = useState(false)
  const [stage, setStage] = useState<'listen' | 'quiz' | 'done'>('listen')
  const [answers, setAnswers] = useState<number[]>([])
  const [started] = useState(Date.now())
  const [xp, setXp] = useState(0)

  if (!episode || episode.lang !== activeLang) return <Navigate to="/podcasts" replace />

  if (stage === 'done')
    return (
      <CompleteScreen
        title="Episode finished!"
        xp={xp}
        baseLabel="Podcast"
        accuracy={answers.filter((a, i) => a === episode.questions[i].answer).length / episode.questions.length}
        durationMs={Date.now() - started}
        streakBefore={streakBefore}
        onContinue={() => navigate('/podcasts', { replace: true })}
      />
    )

  if (stage === 'quiz') {
    const qi = answers.length
    const q = episode.questions[Math.min(qi, episode.questions.length - 1)]
    const answered = qi >= episode.questions.length
    const finish = () => {
      const right = answers.filter((a, i) => a === episode.questions[i].answer).length
      const total = PODCAST_XP + right * 2
      setXp(total)
      recordSession({ lang: activeLang, xp: total, ratings: {} })
      markDone(episode.id)
      setStage('done')
    }
    return (
      <div className="session">
        <main className="session-body podcast-quiz" data-testid="podcast-quiz">
          <span className="eyebrow">
            Question {Math.min(qi + 1, 3)} of {episode.questions.length}
          </span>
          {!answered ? (
            <>
              <h2>{q.q}</h2>
              <div className="options options-list">
                {q.options.map((o, i) => (
                  <button key={i} className="option" data-testid="podcast-option" onClick={() => setAnswers([...answers, i])}>
                    <span className="option-key">{i + 1}</span>
                    <span className="option-text">{o}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2>
                {answers.filter((a, i) => a === episode.questions[i].answer).length} of {episode.questions.length} right
              </h2>
              <ul className="podcast-review">
                {episode.questions.map((qq, i) => (
                  <li key={i} className={answers[i] === qq.answer ? 'c-good' : 'c-bad'}>
                    <Icon name={answers[i] === qq.answer ? 'check' : 'x'} size={14} /> {qq.q} <strong>{qq.options[qq.answer]}</strong>
                  </li>
                ))}
              </ul>
              <button className="btn btn-primary btn-lg" onClick={finish} data-testid="podcast-finish">
                Finish
              </button>
            </>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="session podcast-player">
      <header className="podcast-head">
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/podcasts')} aria-label="Back">
          <Icon name="back" size={20} />
        </button>
        <div className="grow">
          <strong>{episode.title}</strong>
          <span className="small muted">{episode.summary}</span>
        </div>
      </header>
      <main className="podcast-transcript">
        {episode.lines.map((l, i) => (
          <Line key={i} line={l} active={i === player.at} showEn={showEn} dict={dict} onTap={() => player.playFrom(i)} />
        ))}
      </main>
      <footer className="podcast-controls">
        <div className="podcast-progress">
          <div style={{ width: `${((player.at + 1) / episode.lines.length) * 100}%` }} />
        </div>
        <div className="row podcast-bar">
          <div className="row">
            <button className="btn btn-primary btn-icon-lg" data-testid="podcast-play" disabled={!ttsSupported()} onClick={() => (player.playing ? player.stop() : player.playFrom(player.at < 0 || player.at >= episode.lines.length - 1 ? 0 : player.at))} aria-label={player.playing ? 'Pause' : 'Play'}>
              <Icon name={player.playing ? 'pause' : 'play'} size={20} />
            </button>
            <select className="podcast-speed" value={player.rate} onChange={(e) => player.setRate(Number(e.target.value))} aria-label="Speed">
              <option value={0.7}>0.7×</option>
              <option value={0.9}>0.9×</option>
              <option value={1.1}>1.1×</option>
            </select>
            <label className="small row">
              <input type="checkbox" checked={showEn} onChange={(e) => setShowEn(e.target.checked)} /> Translation
            </label>
          </div>
          <button
            className={`btn ${player.heardAll ? 'btn-primary' : ''}`}
            data-testid="podcast-to-quiz"
            onClick={() => {
              player.stop()
              setStage('quiz')
            }}
          >
            Questions <Icon name="play" size={12} />
          </button>
        </div>
      </footer>
    </div>
  )
}
