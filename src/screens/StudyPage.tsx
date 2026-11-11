import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { dayKey } from '../lib/date'
import { useAppLinks } from '../social/apps'
import { useStore } from '../store/useStore'
import { api } from '../sync/api'
import type { Friend } from '../sync/types'

/*
 * Study rooms (server/study.ts): /study lists your rooms and friends' open ones; /study/:id
 * is the room: a shared focus timer, everyone's progress since joining, the room's group
 * chat and a Banter call.
 */

type RoomRow = { id: number; code: string; name: string; online: number; friend?: string }
type Room = {
  id: number; code: string; name: string; owner: boolean; groupId: number | null; serverNow: number
  timer: { focus: number; rest: number; startedAt: number } | null
  members: { id: string; name: string; online: boolean; xp: number; reviews: number; me: boolean }[]
}
const TIMERS: [number, number][] = [[25, 5], [50, 10], [15, 3]]

/** Where a shared Pomodoro is now (the same sums as Banter's call timer). */
export function phaseOf(t: { focus: number; rest: number; startedAt: number }, now: number) {
  const elapsed = Math.max(0, (now - t.startedAt) / 1000), cycle = (t.focus + t.rest) * 60
  const round = Math.floor(elapsed / cycle) + 1, inCycle = elapsed % cycle
  return inCycle < t.focus * 60
    ? { phase: 'focus' as const, left: Math.ceil(t.focus * 60 - inCycle), total: t.focus * 60, round }
    : { phase: 'rest' as const, left: Math.ceil(cycle - inCycle), total: t.rest * 60, round }
}
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function StudyPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { account } = useStore()
  const [data, setData] = useState<{ mine: RoomRow[]; friends: RoomRow[] } | null>(null)
  const [name, setName] = useState('')
  const [timer, setTimer] = useState(0)
  const [code, setCode] = useState(params.get('join') ?? '')
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!account) return
    const load = () => api.studyRooms().then(setData, (e) => setError(e.message))
    load()
    const id = setInterval(load, 15_000)
    return () => clearInterval(id)
  }, [account])
  const join = (c: string) => api.joinStudy(c.trim()).then((r) => navigate(`/study/${r.id}`), (e) => setError(e.message))
  const create = () => api.createStudy(name, TIMERS[timer][0], TIMERS[timer][1]).then((r) => navigate(`/study/${r.id}`), (e) => setError(e.message))

  if (!account) return <div className="stack"><PageHeader icon="book" title="Study rooms" subtitle="Study together on a shared focus timer." /><div className="cta-card calm">Sign in to study with friends.</div></div>
  const row = (r: RoomRow, action: React.ReactNode) => (
    <li key={r.id} data-testid="study-room-row">
      <span className="grow"><b>{r.name}</b>{r.friend && <span className="muted small"> · {r.friend} is here</span>}</span>
      <span className="muted small">{r.online} here</span>
      {action}
    </li>
  )
  return (
    <div className="stack" data-testid="study-page">
      <PageHeader icon="book" title="Study rooms" subtitle="Study together on a shared focus timer, see everyone’s progress, and chat or call between sessions." />
      {error && <div className="cta-card calm" role="alert">{error}</div>}
      <Link to="/crew" className="btn small" data-testid="crew-link">⚔️ Your crew &amp; its study room</Link>
      {!!data?.friends.length && (
        <section className="stack-sm"><h3>Friends studying now</h3>
          <ul className="duel-friends">{data.friends.map((r) => row(r, <button className="btn small btn-primary" onClick={() => join(r.code)}>Join</button>))}</ul>
        </section>
      )}
      {!!data?.mine.length && (
        <section className="stack-sm"><h3>Your rooms</h3>
          <ul className="duel-friends">{data.mine.map((r) => row(r, <Link className="btn small" to={`/study/${r.id}`}>Open</Link>))}</ul>
        </section>
      )}
      <section className="duel-hero">
        <div className="stack-sm grow">
          <strong className="duel-hero-title">New study room</strong>
          <input className="text-input" value={name} maxLength={40} placeholder="Name, e.g. Evening kanji" onChange={(e) => setName(e.target.value)} data-testid="study-name" />
          <div className="seg" role="radiogroup" aria-label="Timer">
            {TIMERS.map(([f, r], i) => <button key={f} role="radio" aria-checked={timer === i} className={timer === i ? 'active' : ''} onClick={() => setTimer(i)}>{f} / {r} min</button>)}
          </div>
        </div>
        <button className="btn btn-primary btn-lg" onClick={create} data-testid="study-create"><Icon name="plus" size={18} /> Create</button>
      </section>
      <form className="row" onSubmit={(e) => { e.preventDefault(); if (code.trim()) join(code) }}>
        <input className="text-input grow" value={code} maxLength={6} placeholder="Have a code? e.g. K7Q2XM" onChange={(e) => setCode(e.target.value.toUpperCase())} data-testid="study-code" />
        <button className="btn" disabled={!code.trim()}>Join</button>
      </form>
    </div>
  )
}

export function StudyRoomPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const links = useAppLinks()
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [inviting, setInviting] = useState(false)
  const [now, setNow] = useState(Date.now())
  const skew = useRef(0)
  const load = () => api.studyRoom(Number(id)).then((r) => { skew.current = r.serverNow - Date.now(); setRoom(r) }, (e) => setError(e.message))
  useEffect(() => {
    load()
    const p = setInterval(load, 5000), t = setInterval(() => setNow(Date.now()), 1000)
    return () => { clearInterval(p); clearInterval(t) }
  }, [id])
  if (error) return <div className="stack"><div className="cta-card calm">{error}</div><Link to="/study" className="btn">Study rooms</Link></div>
  if (!room) return <div className="stack"><p className="muted">Loading…</p></div>
  const phase = room.timer ? phaseOf(room.timer, now + skew.current) : null
  const timer = (action: 'start' | 'stop', f?: number, r?: number) => api.studyTimer(room.id, action, f, r).then(setRoom, (e) => setError(e.message))
  const invite = (f: Friend) => api.inviteStudy(room.id, f.id).then(() => setInviting(false), (e) => setError(e.message))

  return (
    <div className="stack" data-testid="study-room">
      <div className="row">
        <Link to="/study" className="btn small btn-ghost"><Icon name="back" size={16} /> Study rooms</Link>
        <span className="grow" />
        <button className="btn small" onClick={() => navigator.clipboard?.writeText(room.code)} title="Copy the code">Code <b>{room.code}</b> <Icon name="copy" size={14} /></button>
      </div>
      <h2>{room.name}</h2>
      <div className={`study-timer ${phase?.phase ?? 'idle'}`} data-testid="study-timer">
        {phase ? (
          <>
            <div className="study-ring">
              <svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" className="track" /><circle cx="18" cy="18" r="16" className="fill" strokeDasharray={`${(1 - phase.left / phase.total) * 100.5} 100.5`} /></svg>
              <span>{clock(phase.left)}</span>
            </div>
            <div className="grow">
              <strong>{phase.phase === 'focus' ? 'Focus' : 'Break'}</strong>
              <span className="muted small"> · round {phase.round} · {room.timer!.focus}/{room.timer!.rest} min</span>
              <p className="small muted">{phase.phase === 'focus' ? 'Study now: lessons, reviews or practice. Progress shows below.' : 'Take a breather, or say hi in the chat.'}</p>
            </div>
            <button className="btn small btn-ghost" onClick={() => timer('stop')}>Stop</button>
          </>
        ) : (
          <>
            <span className="grow"><strong>Start a focus session</strong><span className="muted small"> for everyone in the room</span></span>
            {TIMERS.map(([f, r]) => <button key={f} className="btn small" onClick={() => timer('start', f, r)} data-testid="study-start">{f}/{r}</button>)}
          </>
        )}
      </div>
      <div className="row">
        {phase?.phase === 'focus' && <Link to="/review" className="btn btn-primary"><Icon name="layers" size={16} /> Review</Link>}
        {phase?.phase === 'focus' && <Link to="/" className="btn"><Icon name="book" size={16} /> Next lesson</Link>}
        {room.groupId && <Link to={`/friends/group/${room.groupId}`} className="btn"><Icon name="chat" size={16} /> Room chat</Link>}
        {room.groupId && links?.banterUrl && <a className="btn" href={`${links.banterUrl}/chats/group/${room.groupId}`} target="_blank" rel="noreferrer"><Icon name="headphones" size={16} /> Call in Banter</a>}
        <button className="btn" onClick={() => { setInviting(!inviting); if (!friends.length) api.friends(dayKey()).then((f) => setFriends(f.friends), () => {}) }}><Icon name="userPlus" size={16} /> Invite</button>
      </div>
      {inviting && (
        <ul className="duel-friends">
          {friends.filter((f) => !room.members.some((m) => m.id === f.id)).map((f) => (
            <li key={f.id}><span className="grow">{f.username}</span><button className="btn small" onClick={() => invite(f)}>Invite</button></li>
          ))}
          {!friends.length && <li className="muted small">No friends to invite yet.</li>}
        </ul>
      )}
      <section className="stack-sm">
        <h3>In the room</h3>
        <ul className="duel-friends" data-testid="study-members">
          {room.members.map((m) => (
            <li key={m.id} className={m.me ? 'me' : ''}>
              <span className="grow">{m.name}{m.online && <span className="online-dot" title="Here now" />}</span>
              <span className="pill">⚡ {m.xp} XP</span>
              <span className="pill">🃏 {m.reviews}</span>
            </li>
          ))}
        </ul>
        <p className="small muted">XP and cards reviewed since joining the room.</p>
      </section>
      <div><button className="btn small btn-ghost" onClick={() => api.leaveStudy(room.id).then(() => navigate('/study'))}>{room.owner ? 'Delete the room' : 'Leave the room'}</button></div>
    </div>
  )
}
