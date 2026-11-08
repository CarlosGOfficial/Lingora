import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { useStore } from '../store/useStore'
import { api } from '../sync/api'

/* The season pass (server/ops.ts, the same in all three apps): 50 tiers, free and premium tracks. */

type Reward = { coins: number; itemId: string | null; itemName: string | null }
type Season = {
  id: number; name: string; endsAt: string; premiumPrice: number; xp: number; today: number; tier: number
  tiers: { free: Reward; premium: Reward }[]; premium: boolean; claimedFree: number[]; claimedPremium: number[]; rules: { tierXp: number; dayCap: number }
}
const left = (iso: string) => {
  const s = Math.max(0, (Date.parse(iso) - Date.now()) / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600)
  return d ? `${d}d ${h}h` : `${h}h ${Math.floor((s % 3600) / 60)}m`
}
const unclaimed = (s: Season) => Array.from({ length: s.tier }, (_, i) => i + 1)
  .reduce((n, t) => n + (s.claimedFree.includes(t) ? 0 : 1) + (s.premium && !s.claimedPremium.includes(t) ? 1 : 0), 0)

/** A link card for the Goals page. */
export function SeasonLink() {
  const [s, setS] = useState<Season | null>(null)
  useEffect(() => { api.season().then(setS, () => {}) }, [])
  if (!s) return null
  const n = unclaimed(s)
  return (
    <Link to="/season" className="season-link" data-testid="season-card">
      <span className="season-crown">👑</span>
      <span className="grow"><strong>{s.name} · Tier {s.tier}</strong>
        <span className="cross-bar"><span style={{ width: `${s.tier >= 50 ? 100 : Math.round(((s.xp % s.rules.tierXp) / s.rules.tierXp) * 100)}%` }} /></span></span>
      {n > 0 && <span className="pill">{n} to claim</span>}
    </Link>
  )
}

export function SeasonPage() {
  const { account } = useStore()
  const [s, setS] = useState<Season | null | undefined>(undefined)
  const [note, setNote] = useState<string | null>(null)
  const track = useRef<HTMLDivElement>(null)
  const load = () => api.season().then(setS, (e) => { setNote(e.message); setS(null) })
  useEffect(() => { if (account) load() }, [account])
  useEffect(() => { track.current?.querySelector(`[data-tier="${Math.max(1, s?.tier ?? 1)}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest' }) }, [s?.id])
  if (!account) return <div className="stack"><PageHeader icon="crown" title="Season pass" subtitle="Rewards for playing, learning and chatting across the apps." /><div className="cta-card calm">Sign in to earn season rewards.</div></div>
  if (s === undefined) return <div className="stack"><p className="muted">Loading…</p></div>
  if (!s) return <div className="stack"><PageHeader icon="crown" title="Season pass" subtitle="Rewards for playing, learning and chatting across the apps." /><div className="cta-card calm">No season is on right now. Check back soon!</div></div>
  const claim = (tier: number, kind: 'free' | 'premium') => api.claimSeason(tier, kind).then(load, (e) => setNote(e.message))
  const claimAll = async () => {
    for (let t = 1; t <= s.tier; t++) {
      if (!s.claimedFree.includes(t)) await api.claimSeason(t, 'free').catch(() => {})
      if (s.premium && !s.claimedPremium.includes(t)) await api.claimSeason(t, 'premium').catch(() => {})
    }
    load()
  }
  const into = s.tier >= 50 ? s.rules.tierXp : s.xp % s.rules.tierXp
  const ended = Date.parse(s.endsAt) <= Date.now()
  const cell = (r: Reward, state: 'claimed' | 'ready' | 'locked', onClaim: () => void) => (
    <div className={`season-cell ${state}`}>
      <span>{r.itemName ? `🎁 ${r.itemName}` : `🪙 ${r.coins}`}</span>
      {state === 'claimed' ? <Icon name="check" size={16} /> : state === 'ready' ? <button className="btn small btn-primary" onClick={onClaim} data-testid="season-claim">Claim</button> : <Icon name="lock" size={14} />}
    </div>
  )
  return (
    <div className="stack" data-testid="season-page">
      <PageHeader icon="crown" title={s.name} subtitle={`${ended ? 'Ended: claim what’s left' : `Ends in ${left(s.endsAt)}`} · ${s.today}/${s.rules.dayCap} season XP today`} />
      {note && <div className="cta-card calm" role="status">{note}</div>}
      <div className="season-head">
        <div className="row"><strong className="season-tier grow">Tier {s.tier} <span className="muted small">/ 50</span></strong>
          {unclaimed(s) > 0 && <button className="btn btn-primary" onClick={claimAll} data-testid="season-claim-all">Claim all ({unclaimed(s)})</button>}</div>
        <div className="cross-bar season-bar"><span style={{ width: `${Math.round((into / s.rules.tierXp) * 100)}%` }} /></div>
        <span className="muted small">{s.tier >= 50 ? 'Every tier reached!' : `${s.rules.tierXp - into} XP to the next tier`}</span>
        {!s.premium && !ended && (
          <div className="row season-premium">
            <span className="grow small">👑 Unlock the premium track: more coins every tier and a cosmetic every 5 tiers, including tiers you’ve already reached.</span>
            <button className="btn btn-primary" onClick={() => api.buySeasonPremium().then(() => { setNote('Premium unlocked! 👑'); load() }, (e) => setNote(e.message))} data-testid="season-buy">Unlock for {s.premiumPrice} coins</button>
          </div>
        )}
      </div>
      <div className="season-track" ref={track} data-testid="season-track">
        {s.tiers.map((x, i) => {
          const t = i + 1, reached = t <= s.tier
          return (
            <div key={t} data-tier={t} className={`season-col ${t === s.tier ? 'current' : ''}`}>
              <span className={`season-num ${reached ? 'reached' : ''}`}>{t}</span>
              {cell(x.free, s.claimedFree.includes(t) ? 'claimed' : reached ? 'ready' : 'locked', () => claim(t, 'free'))}
              {cell(x.premium, s.claimedPremium.includes(t) ? 'claimed' : reached && s.premium ? 'ready' : 'locked', () => claim(t, 'premium'))}
            </div>
          )
        })}
      </div>
      <p className="small muted">Top row: free. Bottom row: 👑 premium.</p>
      <section className="stack-sm">
        <h3>Earning season XP</h3>
        <ul className="small">
          <li>📚 Lingora: all the XP you earn here</li>
          <li>🟩 Wordle Unlimited: 20 XP a round won, 30 for the Daily</li>
          <li>💬 Chat: 2 XP a message in any app (up to 60 a day)</li>
          <li className="muted">Up to {s.rules.dayCap} XP a day; every {s.rules.tierXp} XP is a tier. Coins go into the wallet you share with Wordle; cosmetics show in Wordle and Banter.</li>
        </ul>
      </section>
    </div>
  )
}
