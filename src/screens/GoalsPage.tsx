import { SeasonLink } from './SeasonPage'
import { CrossEvents } from '../components/CrossEvents'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { CHALLENGE_HOURS, CHALLENGE_PRIZE, DIVISIONS, DIVISION_ICONS, LEAGUE_MOVES, LEAGUE_PRIZES, type GoalsView } from '../content/goals'
import { useFriends } from '../social/useFriends'
import { syncNow } from '../sync/sync'
import { api } from '../sync/api'
import { useStore } from '../store/useStore'
import { Coins } from './ShopPage'

/** Quests, your weekly league, XP challenges with friends, and your badges. */
export function GoalsPage() {
  const account = useStore((s) => s.account)
  const friends = useFriends().data?.friends ?? []
  const [g, setG] = useState<GoalsView | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [pick, setPick] = useState({ to: '', hours: 72 })
  const load = useCallback(() => {
    // Sync first so today's progress is counted.
    syncNow().finally(() => api.goals().then(setG, (e: Error) => setErr(e.message)))
  }, [])
  useEffect(() => { if (account) load() }, [account, load])
  const act = (p: Promise<unknown>, ok?: string) => p.then(() => { if (ok) setMsg(ok); load(); void syncNow() }, (e: Error) => setMsg(e.message))

  if (!account) return <div className="stack"><PageHeader icon="target" title="Goals" subtitle="Quests, leagues, challenges and badges." /><div className="cta-card calm"><Link to="/profile">Sign in</Link> to get daily quests, join a weekly league and challenge friends.</div></div>
  if (!g) return <div className="stack"><PageHeader icon="target" title="Goals" subtitle="Quests, leagues, challenges and badges." /><p className="muted">{err ?? 'Loading…'}</p></div>
  const unlocked = g.achievements.filter((a) => a.unlockedAt).length
  const league = g.league
  const daysLeft = league ? Math.max(0, Math.ceil((Date.parse(league.endsAt) - Date.now()) / 86_400_000)) : 0
  return (
    <div className="stack" data-testid="goals-page">
      <PageHeader icon="target" title="Goals" subtitle="Quests, your weekly league, XP challenges and badges. Every reward goes into the coins you share with Wordle Unlimited." />
      <SeasonLink />
      <CrossEvents />
      {msg && <div className="cta-card calm" role="status" onClick={() => setMsg(null)}>{msg}</div>}

      <section className="card">
        <h2>🎯 Today’s quests</h2>
        <div className="goal-list">
          {g.quests.map((q) => {
            const done = q.progress >= q.target
            return (
              <div key={q.id} className={`goal-row ${q.claimed ? 'claimed' : ''}`} data-testid="lingora-quest">
                <div className="grow">
                  <strong>{q.text}</strong>
                  <div className="bar"><div style={{ width: `${(q.progress / q.target) * 100}%` }} /></div>
                  <span className="muted small">{q.progress} / {q.target}</span>
                </div>
                {q.claimed ? <Icon name="check" /> : (
                  <button className="btn btn-primary small" disabled={!done} onClick={() => act(api.claimQuest(q.id).then((r) => setMsg(`+${r.coins} coins!`)))} data-testid="lingora-quest-claim"><Coins value={q.coins} size={14} /></button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="card" data-testid="league">
        <h2>{league ? DIVISION_ICONS[league.division] : '🏅'} {league ? `${DIVISIONS[league.division]} league` : 'Weekly league'}</h2>
        {league?.last && (
          <p className="muted small">Last week: #{league.last.place} in {DIVISIONS[league.last.division]} · {league.last.moved === 'up' ? 'promoted ⬆️' : league.last.moved === 'down' ? 'moved down ⬇️' : 'stayed'}</p>
        )}
        {!league?.rows.length ? <p className="muted">Earn some XP this week to join a league of up to 20 learners.</p> : (
          <>
            <p className="muted small">Top {LEAGUE_MOVES} move up, bottom {LEAGUE_MOVES} move down. Prizes: {LEAGUE_PRIZES.join(' / ')} coins for the top 3. {daysLeft} day{daysLeft === 1 ? '' : 's'} left.</p>
            <ol className="league-list">
              {league.rows.map((r, i) => (
                <li key={r.userId} className={`${r.me ? 'me' : ''} ${i < LEAGUE_MOVES && league.division < DIVISIONS.length - 1 ? 'up' : ''} ${league.rows.length > LEAGUE_MOVES * 2 && i >= league.rows.length - LEAGUE_MOVES ? 'down' : ''}`}>
                  <span className="place">{i + 1}</span>
                  <span className="grow">{r.name}{r.friend && ' 👋'}</span>
                  <strong>{r.xp} XP</strong>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      <section className="card">
        <h2>⚔️ XP challenges</h2>
        <p className="muted small">Most XP in the time wins {CHALLENGE_PRIZE} coins (a draw splits it). You can also start one from a Banter chat.</p>
        {friends.length > 0 && (
          <div className="row wrap">
            <select value={pick.to} onChange={(e) => setPick({ ...pick, to: e.target.value })} data-testid="challenge-friend">
              <option value="">Pick a friend…</option>
              {friends.map((f) => <option key={f.id} value={f.id}>{f.username}</option>)}
            </select>
            <select value={pick.hours} onChange={(e) => setPick({ ...pick, hours: Number(e.target.value) })}>
              {CHALLENGE_HOURS.map((h) => <option key={h} value={h}>{h === 24 ? '24 hours' : h === 72 ? '3 days' : '1 week'}</option>)}
            </select>
            <button className="btn btn-primary small" disabled={!pick.to} onClick={() => act(api.challenge(pick.to, pick.hours), 'Challenge sent!')} data-testid="challenge-send">Challenge</button>
          </div>
        )}
        <div className="goal-list">
          {g.challenges.map((c) => {
            const me = c.mine ? c.from : c.to, them = c.mine ? c.to : c.from
            const mineXp = c.mine ? c.fromXp : c.toXp, theirXp = c.mine ? c.toXp : c.fromXp
            return (
              <div key={c.id} className="goal-row" data-testid="challenge">
                <div className="grow">
                  <strong>You vs {them.name}</strong> <span className="muted small">· {c.hours === 24 ? '24 hours' : c.hours === 72 ? '3 days' : '1 week'}</span>
                  {c.status === 'pending' && <div className="muted small">{c.mine ? 'Waiting for them to accept' : `${them.name} challenged you!`}</div>}
                  {(c.status === 'active' || c.status === 'done') && <div className="small">{mineXp} XP vs {theirXp} XP{c.status === 'active' && c.endsAt && ` · ends ${new Date(c.endsAt).toLocaleString()}`}</div>}
                  {c.status === 'done' && <div className="small"><strong>{c.winner === me.id ? '🏆 You won!' : c.winner ? `${them.name} won` : 'A draw'}</strong></div>}
                  {c.status === 'declined' && <div className="muted small">Declined</div>}
                </div>
                {c.status === 'pending' && !c.mine && (
                  <span className="row">
                    <button className="btn btn-primary small" onClick={() => act(api.answerChallenge(c.id, 'accept'), 'Challenge on!')} data-testid="challenge-accept">Accept</button>
                    <button className="btn ghost small" onClick={() => act(api.answerChallenge(c.id, 'decline'))}>Decline</button>
                  </span>
                )}
              </div>
            )
          })}
          {!g.challenges.length && <p className="muted small">No challenges yet.</p>}
        </div>
      </section>

      <section className="card">
        <h2>🏅 Badges <span className="muted small">{unlocked} / {g.achievements.length}</span></h2>
        <div className="badge-grid">
          {g.achievements.map((a) => (
            <div key={a.id} className={`badge-tile ${a.unlockedAt ? 'on' : ''}`} title={a.description} data-testid="badge">
              <span className="badge-icon">{a.icon}</span>
              <strong>{a.name}</strong>
              <span className="muted small">{a.description}</span>
              <span className="small">{a.unlockedAt ? '✓ Unlocked' : <Coins value={a.coins} size={12} />}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
