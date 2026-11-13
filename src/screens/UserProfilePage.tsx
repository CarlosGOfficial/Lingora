import { ReportDialog } from '../components/ReportDialog'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { COURSES } from '../content'
import { dayKey } from '../lib/date'
import { type PublicProfile } from '../social/profile'
import { refreshFriends } from '../social/useFriends'
import { api } from '../sync/api'
import { TrophyCase } from '../components/TrophyCase'
import { ProfileCard } from '../components/ProfileCard'

/** Someone's public profile (opened from leaderboards, friend lists and chats). */
export function UserProfilePage() {
  const { key = '' } = useParams()
  const navigate = useNavigate()
  const [p, setP] = useState<PublicProfile | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setP(await api.profile(key, dayKey()))
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }, [key])
  useEffect(() => {
    setP(null)
    void load()
  }, [load])

  const back = (
    <button className="btn btn-ghost small back-link" onClick={() => (history.length > 1 ? navigate(-1) : navigate('/friends'))}>
      <Icon name="back" size={16} /> Back
    </button>
  )
  if (error) return <div className="stack">{back}<p className="error">{error}</p></div>
  if (!p) return <div className="stack">{back}<p className="muted">Loading…</p></div>

  return (
    <div className="stack profile-view">
      {back}
      <ProfileCard key={p.id} profileKey={p.id} app="lingora" />
      <Actions p={p} reload={load} />

      {p.lingora ? (
        <>
          <section className="dash">
            <Stat tone="accent" label="Level" value={p.lingora.level} />
            <Stat tone="xp" label="Total XP" value={p.lingora.totalXp.toLocaleString()} />
            <Stat tone="flame" label={`Streak · best ${p.lingora.bestStreak}`} value={p.lingora.streak} />
            <Stat tone="accent" label="Lessons" value={p.lingora.lessons} />
            <Stat tone="xp" label="Words" value={p.lingora.words} />
            <Stat tone="flame" label="Active days" value={p.lingora.activeDays} />
          </section>
          <section className="stack-sm">
            <h2>Courses</h2>
            {p.lingora.courses.length === 0 && <p className="small muted">Hasn’t finished a lesson yet.</p>}
            {p.lingora.courses.map((c) => {
              const course = COURSES[c.lang]
              return (
                <div key={c.lang} className="person-row">
                  <span className={`lang-badge small lang-${c.lang}`} lang={course.bcp47}>
                    {course.badge}
                  </span>
                  <span className="grow person-text">
                    <span>
                      <strong>{course.name}</strong>
                      {c.level && <span className="muted small"> · {c.level}</span>}
                      {p.lingora!.activeLang === c.lang && <span className="pill small-pill">Learning now</span>}
                    </span>
                    <span className="progress thin">
                      <div style={{ width: `${(c.lessons / c.totalLessons) * 100}%` }} />
                    </span>
                    <span className="small muted">
                      {c.lessons}/{c.totalLessons} lessons · {c.xp.toLocaleString()} XP
                    </span>
                  </span>
                </div>
              )
            })}
          </section>
        </>
      ) : (
        <div className="cta-card calm">{p.relation === 'self' ? 'Finish a lesson to start your Lingora stats.' : `${p.username} hasn’t started Lingora yet.`}</div>
      )}

      <TrophyCase userId={p.id} />

      {p.wordle && (
        <p className="small muted wordle-line">
          🟩 Wordle Unlimited: {p.wordle.roundsWon.toLocaleString()} {p.wordle.roundsWon === 1 ? 'win' : 'wins'} · best win streak {p.wordle.bestWinStreak}
        </p>
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone: 'accent' | 'xp' | 'flame' }) {
  return (
    <div className={`stat-tile tone-${tone}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  )
}

/** Add / accept / message / remove, depending on how you know them. */
function Actions({ p, reload }: { p: PublicProfile; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState('')
  const [reporting, setReporting] = useState(false)
  const run = (fn: () => Promise<unknown>) => async () => {
    setBusy(true)
    try {
      await fn()
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
    await Promise.all([reload(), refreshFriends()])
    setBusy(false)
  }
  let body: React.ReactNode
  const canBlock = p.relation !== 'self' && p.relation !== 'guest'
  const reportButton = canBlock && (
    <button className="btn btn-ghost small" onClick={() => setReporting(true)}>
      <Icon name="flag" size={16} /> Report
    </button>
  )
  const blockButton = canBlock && (
    <button
      className="btn btn-ghost small"
      disabled={busy}
      onClick={() => window.confirm(`Block ${p.username}? They can’t send you friend requests or messages in Lingora, Banter or Wordle, and you’ll stop being friends.`) && run(() => api.block(p.id))()}
    >
      <Icon name="x" size={16} /> Block
    </button>
  )
  if (p.blockedByMe) {
    return (
      <>
        <div className="row">
          <span className="small muted grow">You blocked {p.username}.</span>
          <button className="btn btn-ghost small" disabled={busy} onClick={run(() => api.unblock(p.id))}>
            Unblock
          </button>
        </div>
        {error && <p className="error small">{error}</p>}
      </>
    )
  }
  switch (p.relation) {
    case 'self':
      body = (
        <Link to="/profile" className="btn small">
          <Icon name="user" size={16} /> Your settings
        </Link>
      )
      break
    case 'friend':
      body = (
        <>
          <Link to={`/friends/chat/${p.id}`} className="btn btn-primary small">
            <Icon name="chat" size={16} /> Message
          </Link>
          {confirm ? (
            <button className="btn btn-danger small" disabled={busy} autoFocus onBlur={() => setConfirm(false)} onClick={run(() => api.removeFriend(p.id))}>
              Remove friend?
            </button>
          ) : (
            <button className="btn btn-ghost small" onClick={() => setConfirm(true)}>
              <Icon name="userMinus" size={16} /> Remove
            </button>
          )}
        </>
      )
      break
    case 'incoming':
      body = (
        <>
          <span className="small muted grow">{p.username} wants to be friends</span>
          <button className="btn btn-primary small" disabled={busy} onClick={run(() => api.respondRequest(p.requestId!, 'accept'))}>
            <Icon name="check" size={16} /> Accept
          </button>
          <button className="btn btn-ghost small" disabled={busy} onClick={run(() => api.respondRequest(p.requestId!, 'decline'))}>
            Decline
          </button>
        </>
      )
      break
    case 'outgoing':
      body = (
        <>
          <span className="small muted grow">Friend request sent</span>
          <button className="btn btn-ghost small" disabled={busy} onClick={run(() => api.respondRequest(p.requestId!, 'cancel'))}>
            Cancel request
          </button>
        </>
      )
      break
    case 'none':
      body = (
        <button className="btn btn-primary small" disabled={busy} onClick={run(() => api.requestFriend(p.username))}>
          <Icon name="userPlus" size={16} /> Add friend
        </button>
      )
      break
    default:
      body = (
        <Link to="/profile" className="btn small">
          Sign in to add friends
        </Link>
      )
  }
  return (
    <>
      <div className="row">
        {body}
        {reportButton}
        {blockButton}
      </div>
      {error && <p className="error small">{error}</p>}
      {reporting && <ReportDialog target={{ kind: 'user', userId: p.id, name: p.username }} onClose={() => setReporting(false)} />}
    </>
  )
}


