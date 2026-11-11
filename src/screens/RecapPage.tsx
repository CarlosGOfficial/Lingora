import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { RecapStory, type Recap } from '../components/RecapStory'
import { dayKey } from '../lib/date'
import { useStore } from '../store/useStore'
import { api } from '../sync/api'
import type { Friend } from '../sync/types'

/* Your monthly recap across the three apps (server/ops.ts recapFor): /recap/YYYY-MM or /recap/YYYY. */

export function recapPeriods(now = new Date()) {
  const months = Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1 - i, 1)).toISOString().slice(0, 7))
  return [...months, String(now.getUTCFullYear() - 1)]
}
const label = (p: string) => new Date(Date.UTC(Number(p.slice(0, 4)), p.length > 4 ? Number(p.slice(5, 7)) - 1 : 0, 1))
  .toLocaleDateString(undefined, p.length > 4 ? { month: 'long', year: 'numeric', timeZone: 'UTC' } : { year: 'numeric', timeZone: 'UTC' })

export function RecapPage() {
  const { period: wanted } = useParams()
  const navigate = useNavigate()
  const { account } = useStore()
  const periods = recapPeriods()
  const period = wanted ?? periods[0]
  const [recap, setRecap] = useState<Recap | null>(null)
  const [error, setError] = useState('')
  const [friends, setFriends] = useState<Friend[] | null>(null)
  const [note, setNote] = useState('')
  useEffect(() => {
    if (!account) return
    setRecap(null)
    api.recap(period).then(setRecap, (e) => setError(e.message))
  }, [account, period])
  if (!account) return <div className="stack"><PageHeader icon="star" title="Your recap" /><div className="cta-card calm">Sign in to see your recap.</div></div>
  const send = (f: Friend) => api.sendMessage('dm', f.id, { recap: recap!.period } as never).then(() => { setFriends(null); setNote(`Sent to ${f.username}.`) }, (e) => setNote(e.message))
  return (
    <div className="stack" data-testid="recap-page">
      <PageHeader icon="star" title="Your recap" subtitle="Your month across Lingora, Wordle and Banter."
        right={<select className="text-input" value={period} onChange={(e) => navigate(`/recap/${e.target.value}`)} aria-label="Month">{periods.map((p) => <option key={p} value={p}>{label(p)}</option>)}</select>} />
      {error && <div className="cta-card calm" role="alert">{error}</div>}
      {note && <p className="small muted" role="status">{note}</p>}
      {recap ? <RecapStory key={period} recap={recap} onSend={() => api.friends(dayKey()).then((d) => setFriends(d.friends), (e) => setNote(e.message))} /> : !error && <p className="muted">Loading…</p>}
      {friends && (
        <section className="card stack-sm" data-testid="recap-picker">
          <strong>Send it to a friend</strong>
          {friends.length === 0 ? <p className="small muted">No friends yet.</p> : (
            <ul className="duel-friends">{friends.map((f) => <li key={f.id}><span className="grow">{f.username}</span><button className="btn small" onClick={() => send(f)}>Send</button></li>)}</ul>
          )}
          <div><button className="btn btn-ghost small" onClick={() => setFriends(null)}>Cancel</button></div>
        </section>
      )}
    </div>
  )
}
