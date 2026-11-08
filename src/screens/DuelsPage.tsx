import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { COURSES } from '../content'
import type { LangCode } from '../content/types'
import type { DuelQuestion, DuelTier } from '../engine/duel'
import { dayKey } from '../lib/date'
import { useStore } from '../store/useStore'
import { api } from '../sync/api'
import type { Friend } from '../sync/types'

/*
 * Live duels (server/duels.ts): /duels is the lobby (find a random opponent, challenge a
 * friend, invites, recent duels, the ladder); /duels/:id is the match itself.
 */

type Summary = {
  id: number; lang: LangCode; tier: DuelTier; ranked: boolean; status: string; them: { id: string; name: string }; invitedByMe: boolean;
  won?: boolean | null; delta?: number | null; at: string
}
type Lobby = { duels: Summary[]; ratings: Partial<Record<LangCode, { rating: number; wins: number; losses: number; draws: number }>>; queued: LangCode | null }
type Duel = {
  id: number; lang: LangCode; ranked: boolean; status: string; me: { id: string; name: string }; them: { id: string; name: string }; invitedByMe: boolean
  startsAt: number | null; seconds: number; serverNow: number; questions: DuelQuestion[]
  answers: { idx: number; optionId: string; correct: boolean; answer: string }[]
  them_progress: { answered: number; right: number }
  result: { winner: string | null; delta: number | null; answers: string[]; theirs: { idx: number; optionId: string; correct: boolean }[] } | null
}

const TIER_LABEL: Record<DuelTier, string> = { starter: 'Starter words', core: 'Core words', all: 'All words' }

export function DuelsPage() {
  const navigate = useNavigate()
  const { activeLang, languages, account } = useStore()
  const [lobby, setLobby] = useState<Lobby | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [lang, setLang] = useState<LangCode>(activeLang)
  const [tier, setTier] = useState<DuelTier>('core')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const load = () => api.duels().then(setLobby, (e) => setError(e.message))
  useEffect(() => {
    if (!account) return
    load()
    api.friends(dayKey()).then((f) => setFriends(f.friends), () => {})
    const id = setInterval(load, 10_000)
    return () => clearInterval(id)
  }, [account])
  // Waiting for a random opponent: ask every 2 seconds (that also keeps our place in the queue).
  useEffect(() => {
    if (!searching) return
    let live = true
    const tick = () => api.duelQueue(lang).then((r) => { if (live && r.id) navigate(`/duels/${r.id}`) }, (e) => { setError(e.message); setSearching(false) })
    tick()
    const id = setInterval(tick, 2000)
    return () => { live = false; clearInterval(id) }
  }, [searching, lang])
  const stopSearching = () => { setSearching(false); api.leaveDuelQueue().catch(() => {}) }
  useEffect(() => () => { api.leaveDuelQueue().catch(() => {}) }, [])

  if (!account) return <div className="stack"><PageHeader icon="bolt" title="Duels" subtitle="Race a friend or another learner through 10 quick questions." /><div className="cta-card calm">Sign in to duel: results and ratings are saved to your account.</div></div>
  const invites = lobby?.duels.filter((d) => d.status === 'pending') ?? []
  const live = lobby?.duels.filter((d) => d.status === 'active') ?? []
  const recent = lobby?.duels.filter((d) => d.status === 'done') ?? []
  const rating = lobby?.ratings[lang]
  const challenge = async (friend: Friend) => {
    try { const { id } = await api.challengeDuel(friend.id, lang, tier); navigate(`/duels/${id}`) } catch (e) { setError((e as Error).message) }
  }

  return (
    <div className="stack" data-testid="duels-page">
      <PageHeader icon="bolt" title="Duels" subtitle="Race a friend or another learner through the same 10 questions. Most right wins; on a tie, the faster one." />
      {error && <div className="cta-card calm" role="alert">{error}</div>}
      {languages.length > 1 && (
        <div className="tabs" role="tablist">
          {languages.map((l) => (
            <button key={l} role="tab" aria-selected={lang === l} className={`tab-btn ${lang === l ? 'active' : ''}`} onClick={() => { stopSearching(); setLang(l) }}>{COURSES[l].name}</button>
          ))}
        </div>
      )}

      {[...invites, ...live].map((d) => (
        <div key={d.id} className="duel-row highlight" data-testid="duel-invite">
          <Icon name="bolt" size={20} />
          <span className="grow">
            {d.status === 'active' ? <>Your duel with <b>{d.them.name}</b> is on!</> : d.invitedByMe ? <>Waiting for <b>{d.them.name}</b> to accept…</> : <><b>{d.them.name}</b> challenged you ({COURSES[d.lang].name})</>}
          </span>
          {d.status === 'active' || !d.invitedByMe ? (
            <>
              {d.status === 'pending' && <button className="btn small btn-ghost" onClick={() => api.declineDuel(d.id).then(load)}>Decline</button>}
              <button className="btn small btn-primary" onClick={() => (d.status === 'pending' ? api.acceptDuel(d.id) : Promise.resolve()).then(() => navigate(`/duels/${d.id}`), (e) => setError(e.message))} data-testid="duel-go">
                {d.status === 'pending' ? 'Accept' : 'Play'}
              </button>
            </>
          ) : <button className="btn small btn-ghost" onClick={() => api.declineDuel(d.id).then(load)}>Cancel</button>}
        </div>
      ))}

      <div className="duel-hero">
        <div>
          <strong className="duel-hero-title">Ranked · {COURSES[lang].name}</strong>
          <span className="muted small">{rating ? `Rating ${rating.rating} · ${rating.wins}W ${rating.losses}L${rating.draws ? ` ${rating.draws}D` : ''}` : 'Rating 1000 · no ranked duels yet'}</span>
        </div>
        {searching ? (
          <button className="btn" onClick={stopSearching} data-testid="duel-cancel-search"><span className="pulse-dot" /> Finding an opponent… Cancel</button>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={() => { setError(null); setSearching(true) }} data-testid="duel-find"><Icon name="bolt" size={18} /> Find an opponent</button>
        )}
      </div>

      <section className="stack-sm">
        <div className="row">
          <h3 className="grow">Challenge a friend</h3>
          <div className="seg" role="radiogroup" aria-label="Words">
            {(['starter', 'core', 'all'] as const).map((t) => (
              <button key={t} role="radio" aria-checked={tier === t} className={`seg-btn ${tier === t ? 'active' : ''}`} onClick={() => setTier(t)}>{TIER_LABEL[t]}</button>
            ))}
          </div>
        </div>
        {!friends.length ? <p className="muted small">Add friends to challenge them. <Link to="/friends">Find friends</Link></p> : (
          <ul className="duel-friends">
            {friends.map((f) => (
              <li key={f.id}>
                <span className="grow">{f.username}{f.online && <span className="online-dot" title="Online" />}</span>
                <button className="btn small" onClick={() => challenge(f)} data-testid="duel-challenge">Challenge</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recent.length > 0 && (
        <section className="stack-sm">
          <h3>Recent</h3>
          <ul className="duel-friends">
            {recent.map((d) => (
              <li key={d.id}>
                <span className={`duel-result ${d.won ? 'win' : d.won === false ? 'loss' : 'draw'}`}>{d.won ? 'Won' : d.won === false ? 'Lost' : 'Draw'}</span>
                <span className="grow">vs {d.them.name} · {COURSES[d.lang].name}{d.ranked && d.delta != null ? ` · ${d.delta >= 0 ? '+' : ''}${d.delta}` : ''}</span>
                <Link className="btn small btn-ghost" to={`/duels/${d.id}`}>See</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Ladder lang={lang} />
    </div>
  )
}

function Ladder({ lang }: { lang: LangCode }) {
  const [rows, setRows] = useState<{ id: string; name: string; rating: number; wins: number; losses: number }[] | null>(null)
  const { account } = useStore()
  useEffect(() => { setRows(null); api.duelLadder(lang).then(setRows, () => setRows([])) }, [lang])
  if (!rows?.length) return null
  return (
    <section className="stack-sm" data-testid="duel-ladder">
      <h3>Ladder · {COURSES[lang].name}</h3>
      <ol className="duel-friends">
        {rows.map((r, i) => (
          <li key={r.id} className={r.id === account?.id ? 'me' : ''}>
            <span className="duel-rank">{['🥇', '🥈', '🥉'][i] ?? i + 1}</span>
            <span className="grow">{r.name}</span>
            <span className="muted small">{r.wins}W {r.losses}L</span>
            <strong>{r.rating}</strong>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** /duels/:id: countdown, the questions, both players' progress, and the result. */
export function DuelPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [duel, setDuel] = useState<Duel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<{ optionId: string; answer: string } | null>(null)
  const skew = useRef(0) // server clock minus ours
  const [now, setNow] = useState(Date.now())
  const load = () => api.duel(Number(id)).then((d) => { skew.current = d.serverNow - Date.now(); setDuel(d) }, (e) => setError(e.message))
  useEffect(() => { load() }, [id])
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    const p = setInterval(() => { if (duel?.status !== 'done') load() }, 1500)
    return () => { clearInterval(t); clearInterval(p) }
  }, [id, duel?.status])

  if (error) return <div className="stack"><div className="cta-card calm">{error}</div><Link to="/duels" className="btn">Back to duels</Link></div>
  if (!duel) return <div className="stack"><p className="muted">Loading…</p></div>
  const serverNow = now + skew.current
  const course = COURSES[duel.lang]
  const pending = duel.status === 'pending'
  const ended = duel.status !== 'active' && duel.status !== 'pending'
  const countdown = duel.startsAt ? Math.ceil((duel.startsAt - serverNow) / 1000) : 0
  const left = duel.startsAt ? Math.max(0, Math.ceil((duel.startsAt + duel.seconds * 1000 - serverNow) / 1000)) : duel.seconds
  const index = duel.answers.length
  const q = duel.questions[index]
  const myRight = duel.answers.filter((a) => a.correct).length

  const answer = async (optionId: string) => {
    if (busy || !q) return
    setBusy(true)
    try {
      const r = await api.answerDuel(duel.id, index, optionId)
      setFlash({ optionId, answer: r.answer })
      setTimeout(() => { setFlash(null); setDuel(r.view); setBusy(false) }, 650)
    } catch (e) { setError((e as Error).message); setBusy(false) }
  }

  // Right and wrong show for you as you go, and for them once it's over.
  const marks = (me: boolean) => (me ? duel.answers : duel.result?.theirs ?? null)
  const bar = (label: string, answered: number, right: number, me: boolean) => (
    <div className={`duel-bar ${me ? 'me' : ''}`}>
      <span className="duel-bar-name">{label}</span>
      <div className="duel-track">{Array.from({ length: 10 }, (_, i) => {
        const m = marks(me)?.find((a) => a.idx === i)
        return <span key={i} className={m ? (m.correct ? 'ok' : 'no') : i < answered ? 'done' : ''} />
      })}</div>
      <strong>{right}</strong>
    </div>
  )

  return (
    <div className="stack duel-page" data-testid="duel-page">
      <div className="row">
        <Link to="/duels" className="btn small btn-ghost"><Icon name="back" size={16} /> Duels</Link>
        <span className="grow muted small">{course.name}{duel.ranked ? ' · Ranked' : ' · Friendly'}</span>
        {duel.status === 'active' && countdown <= 0 && <span className={`pill ${left <= 15 ? 'danger' : ''}`} data-testid="duel-clock">{left}s</span>}
      </div>
      {bar(duel.me.name, duel.answers.length, myRight, true)}
      {bar(duel.them.name, duel.them_progress.answered, duel.them_progress.right, false)}

      {pending && (
        <div className="cta-card calm" data-testid="duel-waiting">
          {duel.invitedByMe ? <>Waiting for <b>{duel.them.name}</b> to accept. They’ve been sent a notification.</> : <>
            <b>{duel.them.name}</b> challenged you.
            <div className="row"><button className="btn btn-primary" onClick={() => api.acceptDuel(duel.id).then(setDuel, (e) => setError(e.message))}>Accept</button>
              <button className="btn btn-ghost" onClick={() => api.declineDuel(duel.id).then(() => navigate('/duels'))}>Decline</button></div>
          </>}
        </div>
      )}
      {duel.status === 'active' && countdown > 0 && <div className="duel-countdown" data-testid="duel-countdown">{countdown}</div>}
      {duel.status === 'active' && countdown <= 0 && q && (
        <div className="duel-q" data-testid="duel-question">
          <span className="muted small">Question {index + 1} of 10 · {q.kind === 'meaning' ? 'What does this mean?' : 'How do you say this?'}</span>
          <div className="duel-prompt" lang={q.kind === 'meaning' ? course.bcp47 : undefined}>{q.prompt}{q.sub && <span className="duel-sub">{q.sub}</span>}</div>
          <div className="options options-grid">
            {q.options.map((o) => {
              const state = flash ? (o.id === flash.answer ? 'is-correct' : o.id === flash.optionId ? 'is-wrong' : '') : ''
              return (
                <button key={o.id} className={`option ${state}`} disabled={busy} onClick={() => answer(o.id)} lang={q.kind === 'target' ? course.bcp47 : undefined} data-testid="duel-option">
                  {o.text}{o.sub && <span className="duel-sub">{o.sub}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {duel.status === 'active' && !q && <div className="cta-card calm">Done! Waiting for {duel.them.name} to finish…</div>}
      {ended && duel.result && (
        <div className="duel-end" data-testid="duel-result">
          <div className="duel-end-title">{duel.result.winner === duel.me.id ? '🏆 You won!' : duel.result.winner ? `${duel.them.name} won` : 'A draw!'}</div>
          <p className="muted">{myRight} – {duel.result.theirs.filter((a) => a.correct).length}
            {duel.result.winner && myRight === duel.result.theirs.filter((a) => a.correct).length ? (duel.result.winner === duel.me.id ? ' · you were faster' : ' · they were faster') : ''}{duel.ranked && duel.result.delta != null ? ` · rating ${duel.result.delta >= 0 ? '+' : ''}${duel.result.delta}` : ''}</p>
          <p className="small muted">{duel.result.winner === duel.me.id ? '+20 coins' : duel.result.winner ? '+5 coins for playing' : '+10 coins'}</p>
          <ol className="duel-review">
            {duel.questions.map((qq, i) => {
              const mine = duel.answers.find((a) => a.idx === i)
              const right = qq.options.find((o) => o.id === duel.result!.answers[i])
              return (
                <li key={i} className={mine?.correct ? 'ok' : 'no'}>
                  <span lang={qq.kind === 'meaning' ? course.bcp47 : undefined}>{qq.prompt}</span> → <b lang={qq.kind === 'target' ? course.bcp47 : undefined}>{right?.text}</b>
                </li>
              )
            })}
          </ol>
          <div className="row"><Link to="/duels" className="btn btn-primary">Another duel</Link></div>
        </div>
      )}
      {ended && !duel.result && <div className="cta-card calm">This duel was {duel.status}.</div>}
    </div>
  )
}
