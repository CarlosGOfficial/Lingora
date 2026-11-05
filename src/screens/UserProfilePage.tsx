import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { NameTag } from '../components/NameTag'
import { COURSES } from '../content'
import { dayKey } from '../lib/date'
import { onlineText, timeAgo } from '../lib/time'
import { BIO_MAX, type PublicProfile } from '../social/profile'
import { refreshFriends } from '../social/useFriends'
import { useAppLinks } from '../social/apps'
import { Avatar } from '../components/chat/ChatPanel'
import { api } from '../sync/api'

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

  const joined = p.joinedAt ? new Date(p.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : null
  const look = p.banter
  return (
    <div className="stack profile-view">
      {back}
      {look && (
        <div className="banter-banner" style={'image' in look.banner ? { backgroundImage: `url(${look.banner.image})` } : { background: look.banner.css }}>
          <span className="banter-banner-tag">Banter profile</span>
        </div>
      )}
      <section className={`profile-card ${look ? 'with-banner' : ''}`} style={look ? { ['--profile-accent' as string]: look.accent, ...(look.card ? { backgroundImage: look.card } : {}) } : undefined}>
        <Avatar person={p} online={p.online} size="big" />
        <div className="grow person-text">
          <span className="row tight">
            <NameTag name={p.username} nameColor={p.nameColor} title={p.title} />
            {p.isAdmin && <span className="admin-badge">ADMIN</span>}
          </span>
          <span className={`small ${p.online ? 'c-success' : 'muted'}`}>{p.online ? onlineText(p, 'Online now') : p.lastSeen ? `Last online ${timeAgo(p.lastSeen)}` : 'Offline'}</span>
          {look?.status && <span className="small banter-status">{look.status.emoji} {look.status.text}</span>}
          <span className="small muted">
            {look?.pronouns && `${look.pronouns} · `}
            {joined && `Joined ${joined} · `}
            {p.friends} {p.friends === 1 ? 'friend' : 'friends'}
          </span>
        </div>
        <BanterLink username={p.username} on={!!look} />
      </section>
      <Actions p={p} reload={load} />
      <Bio p={p} onSaved={load} />

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
      <div className="row">{body}</div>
      {error && <p className="error small">{error}</p>}
    </>
  )
}

/** Your bio is editable here (and in Wordle Unlimited — it's the same one). */
function Bio({ p, onSaved }: { p: PublicProfile; onSaved: () => Promise<void> }) {
  const self = p.relation === 'self'
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(p.bio ?? '')
  const [error, setError] = useState('')
  if (editing)
    return (
      <form
        className="stack-sm"
        onSubmit={async (e) => {
          e.preventDefault()
          try {
            await api.saveBio(text)
            setEditing(false)
            await onSaved()
          } catch (err) {
            setError((err as Error).message)
          }
        }}
      >
        <textarea className="text-input" rows={3} maxLength={BIO_MAX} value={text} onChange={(e) => setText(e.target.value)} placeholder="Say something about yourself — what you’re learning, why…" autoFocus />
        <div className="row">
          <span className="small muted grow">
            {text.length}/{BIO_MAX} · shared with Wordle Unlimited
          </span>
          <button type="button" className="btn btn-ghost small" onClick={() => setEditing(false)}>
            Cancel
          </button>
          <button className="btn btn-primary small">
            <Icon name="check" size={16} /> Save
          </button>
        </div>
        {error && <p className="error small">{error}</p>}
      </form>
    )
  if (!p.bio && !self) return null
  return (
    <div className="bio-row">
      <p className={p.bio ? '' : 'muted'}>{p.bio || 'Add a short bio so friends know what you’re learning.'}</p>
      {self && (
        <button
          className="icon-btn small"
          aria-label="Edit bio"
          onClick={() => {
            setText(p.bio ?? '')
            setEditing(true)
          }}
        >
          <Icon name="pencil" size={14} />
        </button>
      )}
    </div>
  )
}

/** Their profile in Banter, where it can be customized (banner, status, colours). */
function BanterLink({ username, on }: { username: string; on: boolean }) {
  const links = useAppLinks()
  if (!links?.banterUrl || !on) return null
  return (
    <a className="btn btn-ghost small" href={`${links.banterUrl}/u/${encodeURIComponent(username)}`} target="_blank" rel="noopener noreferrer">
      View on Banter <Icon name="external" size={13} />
    </a>
  )
}
