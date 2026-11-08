import { useEffect, useState } from 'react'
import { api } from '../sync/api'

/* Cross-app events (server/ops.ts): goals in Wordle, Lingora and Banter, one reward. */

type Cross = {
  id: number; name: string; emoji: string; description: string; startsAt: string; endsAt: string; live: boolean
  goals: { metric: string; label: string; app: 'wordle' | 'lingora' | 'banter'; target: number; done: number }[]
  reward: { coins: number; itemName: string | null }; complete: boolean; claimed: boolean
}
const APP_ICON = { wordle: '🟩', lingora: '📚', banter: '💬' }
const left = (iso: string) => {
  const s = Math.max(0, (Date.parse(iso) - Date.now()) / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600)
  return d ? `${d}d ${h}h` : `${h}h ${Math.floor((s % 3600) / 60)}m`
}

export function CrossEvents() {
  const [events, setEvents] = useState<Cross[]>([])
  const [note, setNote] = useState<string | null>(null)
  const load = () => api.crossEvents().then(setEvents, () => {})
  useEffect(() => { load() }, [])
  if (!events.length) return null
  const claim = (id: number) => api.claimCrossEvent(id).then((r) => { setNote(`Reward claimed: ${[r.coins ? `${r.coins} coins` : '', r.item ?? ''].filter(Boolean).join(' + ')}`); load() }, (e) => setNote(e.message))
  return (
    <div className="stack-sm" data-testid="cross-events">
      {note && <div className="cta-card calm" role="status">{note}</div>}
      {events.map((e) => {
        const started = Date.parse(e.startsAt) <= Date.now()
        const reward = [e.reward.coins ? `${e.reward.coins} coins` : '', e.reward.itemName ?? ''].filter(Boolean).join(' + ')
        return (
          <div key={e.id} className="cross-event">
            <div className="row">
              <span className="cross-emoji">{e.emoji}</span>
              <div className="grow">
                <span className="cross-kicker">Event across the apps</span>
                <strong className="cross-name">{e.name}</strong>
                <span className="muted small">{started ? `Ends in ${left(e.endsAt)}` : `Starts in ${left(e.startsAt)}`}{reward && ` · 🎁 ${reward}`}</span>
              </div>
              {e.complete && !e.claimed && <button className="btn btn-primary" onClick={() => claim(e.id)} data-testid="cross-claim">Claim reward</button>}
              {e.claimed && <span className="pill">✓ Done</span>}
            </div>
            {e.description && <p className="small">{e.description}</p>}
            <ul className="cross-goals">
              {e.goals.map((g) => (
                <li key={g.metric} data-testid="cross-goal">
                  <div className="row"><span className="grow small">{APP_ICON[g.app]} {g.label} ({g.target})</span><strong className="small">{g.done}/{g.target}</strong></div>
                  <div className="cross-bar"><span style={{ width: `${Math.round((g.done / g.target) * 100)}%` }} /></div>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
