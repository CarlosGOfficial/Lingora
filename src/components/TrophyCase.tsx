import { useEffect, useState } from 'react'
import { api } from '../sync/api'

/*
 * The trophy case (server/ops.ts): everything someone has earned in Lingora, Wordle and
 * Banter, plus season titles, with up to 6 pinned first. The same data shows on profiles
 * in all three apps.
 */

type Tier = 'special' | 'gold' | 'silver' | 'bronze'
type App = 'wordle' | 'lingora' | 'banter' | 'season'
export type Trophy = { id: string; app: App; key: string; name: string; icon: string; tier: Tier; detail: string; earnedAt: string }
export type TrophyCaseData = {
  trophies: Trophy[]; pinned: string[]; counts: Record<Tier, number>; mine: boolean
  stats: { wordleWins: number | null; rankedPeak: number | null; lingoraXp: number | null; lingoraStreak: number | null; banterLevel: number | null }
}

const MAX_PINS = 6
const TIERS: Tier[] = ['special', 'gold', 'silver', 'bronze']
const TIER_NAMES: Record<Tier, string> = { special: 'Special', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' }
const APPS: [App, string][] = [['lingora', 'Lingora'], ['wordle', 'Wordle'], ['banter', 'Banter'], ['season', 'Seasons']]

export function TrophyCase({ userId }: { userId: string }) {
  const [data, setData] = useState<TrophyCaseData | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [editing, setEditing] = useState<string[] | null>(null)
  const [note, setNote] = useState('')
  useEffect(() => {
    let live = true
    api.trophies(userId).then((d) => live && setData(d), () => live && setData(null))
    return () => { live = false }
  }, [userId])
  if (!data) return null

  const byId = new Map(data.trophies.map((t) => [t.id, t]))
  const pins = editing ?? data.pinned
  const selected = open ? byId.get(open) : undefined
  const tap = (id: string) => {
    if (!editing) return setOpen(open === id ? null : id)
    if (editing.includes(id)) setEditing(editing.filter((x) => x !== id))
    else if (editing.length < MAX_PINS) setEditing([...editing, id])
    else setNote(`You can pin up to ${MAX_PINS}.`)
  }
  const save = () => api.pinTrophies(editing ?? []).then((r) => { setData({ ...data, pinned: r.pinned }); setEditing(null); setNote('') }, (e) => setNote(e.message))
  const tile = (t: Trophy, big = false) => (
    <button key={t.id} type="button" className={`trophy tier-${t.tier} ${big ? 'big' : ''} ${open === t.id ? 'open' : ''} ${pins.includes(t.id) ? 'pinned' : ''}`}
      title={`${t.name}: ${t.detail}`} onClick={() => tap(t.id)} data-testid="trophy-tile">{t.icon}</button>
  )
  const s = data.stats
  const stats = ([
    ['Lingora XP', s.lingoraXp], ['days: best Lingora streak', s.lingoraStreak], ['Wordle wins', s.wordleWins], ['ranked peak', s.rankedPeak], ['best Banter server level', s.banterLevel],
  ] as [string, number | null][]).filter(([, v]) => v != null && v > 0)

  return (
    <section className="card stack-sm trophy-case" data-testid="trophy-case">
      <div className="row">
        <h2 className="grow">🏆 Trophy case</h2>
        {TIERS.map((t) => data.counts[t] > 0 && <span key={t} className={`trophy-count tier-${t}`} title={TIER_NAMES[t]}>{data.counts[t]}</span>)}
        {data.mine && data.trophies.length > 0 && (editing
          ? <button className="btn small btn-primary" onClick={save} data-testid="trophy-save">Save</button>
          : <button className="btn small" onClick={() => { setEditing(data.pinned); setOpen(null) }} data-testid="trophy-edit">Pin</button>)}
      </div>
      {!!stats.length && <div className="row wrap">{stats.map(([label, v]) => <span key={label} className="pill"><b>{v!.toLocaleString()}</b> {label}</span>)}</div>}
      {data.trophies.length === 0 ? (
        <p className="small muted">No trophies yet. They come from Lingora, Wordle and Banter.</p>
      ) : (
        <>
          {editing && <p className="small muted">Tap up to {MAX_PINS} trophies to show first, then save.</p>}
          {note && <p className="small error">{note}</p>}
          {pins.length > 0 && <div className="trophy-shelf pinned-shelf" data-testid="trophy-pinned">{pins.map((id) => byId.get(id)).filter((t): t is Trophy => !!t).map((t) => tile(t, true))}</div>}
          {APPS.map(([app, label]) => {
            const list = data.trophies.filter((t) => t.app === app).sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier))
            return list.length ? (
              <div key={app} className="stack-sm">
                <span className="small muted trophy-app">{label} · {list.length}</span>
                <div className="trophy-shelf">{list.map((t) => tile(t))}</div>
              </div>
            ) : null
          })}
          {selected && (
            <div className="row trophy-detail" data-testid="trophy-detail">
              <span className="trophy-detail-icon">{selected.icon}</span>
              <span className="grow person-text">
                <strong>{selected.name}</strong>
                <span className="small muted">{selected.detail}</span>
                <span className="small muted">{TIER_NAMES[selected.tier]} · {new Date(selected.earnedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </span>
            </div>
          )}
        </>
      )}
    </section>
  )
}
