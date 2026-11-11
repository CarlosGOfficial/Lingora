import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { useAppLinks } from '../social/apps'
import { useStore } from '../store/useStore'
import { api } from '../sync/api'

/*
 * Your crew (server/ops.ts crewView): your Wordle Unlimited clan, with this week's score
 * from Wordle, Lingora and Banter, crew wars, and the crew's own study room.
 */

type Brief = { id: number; name: string; tag: string; emoji: string; color: string }
export type Crew = Brief & {
  total: number; parts: { wordle: number; lingora: number; banter: number }; myRole: string; wars: boolean; banner: boolean
  banterInvite: string | null; groupId: number | null; studyRoomId: number | null
  members: { id: string; name: string; avatar: string | null; role: string; wordle: number; lingora: number; banter: number; total: number }[]
  war: { opponent: Brief; mine: number; theirs: number; endsAt: string } | null
  lastWar: { opponent: Brief; mine: number; theirs: number; won: boolean | null } | null
}
const APPS = [['lingora', 'Lingora', '#7c3aed'], ['wordle', 'Wordle', '#6aaa64'], ['banter', 'Banter', '#0d9488']] as const

export function CrewPage() {
  const { account } = useStore()
  const links = useAppLinks()
  const navigate = useNavigate()
  const [c, setC] = useState<Crew | null | undefined>(undefined)
  const [error, setError] = useState('')
  useEffect(() => { if (account) api.crew().then(setC, (e) => setError(e.message)) }, [account])
  if (!account) return <div className="stack"><PageHeader icon="users" title="Crew" /><div className="cta-card calm">Sign in to see your crew.</div></div>
  if (c === undefined) return <div className="stack"><p className="muted">Loading…</p></div>
  if (c === null) {
    return (
      <div className="stack" data-testid="crew-page">
        <PageHeader icon="users" title="Crew" subtitle="Your Wordle Unlimited clan, in Lingora and Banter too." />
        <div className="cta-card calm">You’re not in a crew yet. A crew is your Wordle Unlimited clan: join or make one there.
          {links?.wordleUrl && <div><a className="btn small" href={`${links.wordleUrl}/clans`} target="_blank" rel="noreferrer">Find a clan</a></div>}
        </div>
      </div>
    )
  }
  const boss = c.myRole === 'owner' || c.myRole === 'officer'
  const sum = c.parts.wordle + c.parts.lingora + c.parts.banter
  const days = c.war ? Math.max(0, Math.ceil((Date.parse(c.war.endsAt) - Date.now()) / 86_400_000)) : 0
  const study = () => api.crewStudy().then((r) => navigate(`/study/${r.id}`), (e) => setError(e.message))
  const toggle = () => api.crewWars(!c.wars).then(setC, (e) => setError(e.message))
  return (
    <div className="stack" data-testid="crew-page">
      <header className="crew-head" style={{ ['--crew' as string]: c.color }}>
        <span className="crew-emoji">{c.emoji}</span>
        <div className="grow person-text">
          <span className="small muted">⚔️ Crew</span>
          <h2><span style={{ color: c.color }}>[{c.tag}]</span> {c.name}</h2>
          {c.banner && <span className="pill" data-testid="crew-banner">🏆 Won last week’s war</span>}
        </div>
      </header>
      {error && <div className="cta-card calm" role="alert">{error}</div>}
      <div className="row wrap">
        <button className="btn btn-primary" onClick={study} data-testid="crew-study"><Icon name="book" size={16} /> Crew study room</button>
        {c.groupId && <Link to={`/friends/group/${c.groupId}`} className="btn"><Icon name="chat" size={16} /> Crew chat</Link>}
        {c.banterInvite && links?.banterUrl && <a className="btn" href={`${links.banterUrl}/invite/${c.banterInvite}`} target="_blank" rel="noreferrer">💬 Crew’s Banter server</a>}
        {links?.wordleUrl && <a className="btn btn-ghost" href={`${links.wordleUrl}/clan/${c.id}`} target="_blank" rel="noreferrer">Clan page in Wordle</a>}
      </div>
      <section className="card stack-sm">
        <div className="crew-total"><b>{c.total}</b> <span className="muted small">points this week</span></div>
        <p className="small muted">Lingora XP, Wordle XP and chatting in your crew’s Banter server all count (4 points a message, up to 25 a day each).</p>
        <div className="crew-split">{sum > 0 && APPS.map(([k, , color]) => <div key={k} style={{ width: `${(c.parts[k] / sum) * 100}%`, background: color }} />)}</div>
        <div className="row wrap small">{APPS.map(([k, label, color]) => <span key={k} className="row tight"><span className="dot" style={{ background: color }} /><b>{c.parts[k]}</b> {label}</span>)}</div>
      </section>
      <section className="card stack-sm" data-testid="crew-war">
        {c.war ? (
          <>
            <div className="row"><strong className="grow">⚔️ vs {c.war.opponent.emoji} [{c.war.opponent.tag}] {c.war.opponent.name}</strong><span className="small muted">{days} days left</span></div>
            <div className="crew-vs"><b style={{ color: c.color }}>{c.war.mine}</b>
              <div className="crew-split grow"><div style={{ width: `${c.war.mine + c.war.theirs ? (c.war.mine / (c.war.mine + c.war.theirs)) * 100 : 50}%`, background: c.color }} /><div className="grow" style={{ background: c.war.opponent.color }} /></div>
              <b style={{ color: c.war.opponent.color }}>{c.war.theirs}</b></div>
          </>
        ) : <p className="small muted">{c.wars ? 'Crew wars are on: you’ll be paired with a crew next Monday.' : 'Crew wars are off.'}</p>}
        {c.lastWar && <p className="small muted">Last week: {c.lastWar.won == null ? `a draw with ${c.lastWar.opponent.name}` : c.lastWar.won ? `won against ${c.lastWar.opponent.name}` : `lost to ${c.lastWar.opponent.name}`}, {c.lastWar.mine} to {c.lastWar.theirs}.</p>}
        {boss && <div><button className="btn small" onClick={toggle} data-testid="crew-wars-toggle">{c.wars ? 'Leave crew wars' : 'Join crew wars'}</button></div>}
      </section>
      <section className="stack-sm">
        <h3>Members this week</h3>
        <table className="crew-table" data-testid="crew-members">
          <thead><tr><th>Member</th>{APPS.map(([k, label, color]) => <th key={k} style={{ color }}>{label}</th>)}<th>Total</th></tr></thead>
          <tbody>{c.members.map((m) => (
            <tr key={m.id}><td><Link to={`/u/${m.id}`}>{m.name}</Link>{m.role === 'owner' ? ' 👑' : m.role === 'officer' ? ' 🛡️' : ''}</td>{APPS.map(([k]) => <td key={k}>{m[k]}</td>)}<td><b>{m.total}</b></td></tr>
          ))}</tbody>
        </table>
      </section>
    </div>
  )
}
