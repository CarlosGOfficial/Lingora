import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { NameTag } from '../components/NameTag'
import { PageHeader } from '../components/PageHeader'
import { ProfileLink } from '../components/ProfileLink'
import { COURSES } from '../content'
import type { LangCode } from '../content/types'
import { dayKey } from '../lib/date'
import { onlineText, timeAgo } from '../lib/time'
import { cosmeticsOf } from '../shop/catalog'
import { messagePreview } from '../social/chat'
import { simulatedStats } from '../social/friends'
import { GroupAvatar } from './FriendChatPage'
import { refreshFriends, useFriends } from '../social/useFriends'
import { liveStreak, useStore, weeklyXp } from '../store/useStore'
import { api } from '../sync/api'
import type { Friend, FriendRequest } from '../sync/types'

interface Row {
  key: string
  name: string
  weeklyXp: number
  streak: number
  lang: LangCode
  me: boolean
  note?: string
  title?: string | null
  nameColor?: string | null
  /** Real accounts link to their profile. */
  profileId?: string
  onRemove?: () => void
}

export function FriendsPage() {
  const account = useStore((s) => s.account)
  return account ? <OnlineFriends /> : <LocalFriends />
}

/** Signed in: the friends list shared with Wordle Unlimited — requests, online status, chats. */
function OnlineFriends() {
  const username = useStore((s) => s.account?.username ?? '')
  const meId = useStore((s) => s.account?.id ?? '')
  const { data, groups, error } = useFriends()
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)

  const act = async (fn: () => Promise<unknown>, done?: string) => {
    try {
      await fn()
      setNotice(done ? { ok: true, text: done } : null)
    } catch (e) {
      setNotice({ ok: false, text: (e as Error).message })
    }
    await refreshFriends()
  }

  return (
    <div className="stack">
      <PageHeader icon="users" title="Friends" subtitle="Learn together. Your friends are shared with Wordle Unlimited." />
      <ShareCard label="Your username" value={username} />

      <AddForm
        placeholder="Add a friend by username"
        button="Send request"
        onAdd={async (name) => {
          const r = await api.requestFriend(name)
          setNotice({ ok: true, text: r.status === 'accepted' ? `You and ${r.name} are now friends!` : `Friend request sent to ${r.name}.` })
          await refreshFriends()
        }}
      />
      {notice && <p className={`small ${notice.ok ? 'c-success' : 'error'}`}>{notice.text}</p>}

      {!!data?.incoming.length && (
        <section className="stack-sm">
          <h2>Friend requests</h2>
          {data.incoming.map((r) => (
            <PersonRow key={r.requestId} person={r} sub="wants to be friends" highlight>
              <button className="btn btn-primary small" onClick={() => act(() => api.respondRequest(r.requestId, 'accept'), `You and ${r.username} are now friends!`)}>
                <Icon name="check" size={16} /> Accept
              </button>
              <button className="icon-btn small" aria-label={`Decline ${r.username}`} onClick={() => act(() => api.respondRequest(r.requestId, 'decline'))}>
                <Icon name="x" size={16} />
              </button>
            </PersonRow>
          ))}
        </section>
      )}

      <section>
        <h2>This week’s leaderboard</h2>
        {!data && !error && <p className="muted">Loading…</p>}
        {error && <p className="error small">{error}</p>}
        {data && (
          <Leaderboard
            rows={data.leaderboard.map((r) => ({ ...r, key: r.id, name: r.username, profileId: r.id }))}
          />
        )}
        {data && data.friends.length === 0 && (
          <div className="empty">
            <p className="muted">Learning with friends keeps you consistent. Add someone by their username — Wordle Unlimited usernames work too.</p>
          </div>
        )}
      </section>

      {!!data?.friends.length && (
        <section className="stack-sm">
          <h2>
            Your friends <span className="muted small">· {data.friends.filter((f) => f.online).length} online</span>
          </h2>
          {data.friends.map((f) => (
            <FriendRow key={f.id} friend={f} onRemove={() => act(() => api.removeFriend(f.id))} />
          ))}
        </section>
      )}

      {data && (
        <section className="stack-sm">
          <div className="row">
            <h2 className="grow">Group chats</h2>
            {data.friends.length > 0 && (
              <Link to="/friends/groups/new" className="btn small">
                <Icon name="plus" size={16} /> New group
              </Link>
            )}
          </div>
          {!groups?.length && <p className="small muted">{data.friends.length ? 'Start a group chat with a few friends.' : 'Add friends to start a group chat.'}</p>}
          {groups?.map((g) => (
            <Link key={g.id} to={`/friends/group/${g.id}`} className="person-row link-row">
              <GroupAvatar group={g} meId={meId} />
              <span className="grow person-text">
                <span>
                  <strong>{g.name}</strong> <span className="muted small">{g.members.length}</span>
                </span>
                <span className="small muted ellipsis">
                  {g.lastMessage
                    ? `${g.lastMessage.fromName ? g.lastMessage.fromName + ': ' : ''}${g.lastMessage.content ? messagePreview(g.lastMessage.content) : 'Message deleted'}`
                    : 'No messages yet'}
                </span>
              </span>
              <span className="group-side">
                {g.lastMessage && <span className="small muted">{timeAgo(g.lastMessage.at)}</span>}
                {g.unread > 0 && <span className="badge">{g.unread}</span>}
              </span>
            </Link>
          ))}
        </section>
      )}

      {!!data?.outgoing.length && (
        <section className="stack-sm">
          <h2>Sent requests</h2>
          {data.outgoing.map((r) => (
            <PersonRow key={r.requestId} person={r} sub="waiting for them to accept" dashed>
              <button className="btn btn-ghost small" onClick={() => act(() => api.respondRequest(r.requestId, 'cancel'))}>
                Cancel
              </button>
            </PersonRow>
          ))}
        </section>
      )}

      <p className="small muted">
        Friends see each other’s weekly XP, streak and course once they’ve opened Lingora. Requests, friends, chats and groups sync with Wordle Unlimited.
      </p>
    </div>
  )
}

function Avatar({ name, online }: { name: string; online?: boolean }) {
  return (
    <span className="avatar">
      {name[0]?.toUpperCase()}
      {online !== undefined && <i className={`presence ${online ? 'on' : ''}`} aria-label={online ? 'Online' : 'Offline'} />}
    </span>
  )
}

function PersonRow({ person, sub, children, highlight, dashed }: { person: FriendRequest; sub: ReactNode; children: ReactNode; highlight?: boolean; dashed?: boolean }) {
  return (
    <div className={`person-row ${highlight ? 'highlight' : ''} ${dashed ? 'dashed' : ''}`}>
      <Avatar name={person.username} />
      <span className="grow person-text">
        <ProfileLink id={person.id}>
          <NameTag name={person.username} nameColor={person.nameColor} title={person.title} />
        </ProfileLink>
        <span className="muted small">{sub}</span>
      </span>
      {children}
    </div>
  )
}

function FriendRow({ friend: f, onRemove }: { friend: Friend; onRemove: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const status = f.online ? onlineText(f) : f.lastSeen ? `Last online ${timeAgo(f.lastSeen)}` : 'Offline'
  return (
    <div className="person-row">
      <Avatar name={f.username} online={f.online} />
      <span className="grow person-text">
        <ProfileLink id={f.id}>
          <NameTag name={f.username} nameColor={f.nameColor} title={f.title} />
        </ProfileLink>
        <span className={`small ${f.online ? 'c-success' : 'muted'}`}>
          {status}
          {!f.onLingora && <span className="muted"> · not on Lingora yet</span>}
        </span>
      </span>
      <Link to={`/friends/chat/${f.id}`} className="icon-btn small with-badge" aria-label={`Message ${f.username}`}>
        <Icon name="chat" size={18} />
        {f.unread > 0 && <span className="badge">{f.unread}</span>}
      </Link>
      {confirming ? (
        <button className="btn btn-danger small" onClick={onRemove} onBlur={() => setConfirming(false)} autoFocus>
          Remove?
        </button>
      ) : (
        <button className="icon-btn small" aria-label={`Remove ${f.username}`} onClick={() => setConfirming(true)}>
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  )
}

/** Signed out: friends stored on this device with simulated activity. */
function LocalFriends() {
  const { friendCode, friends, addFriend, removeFriend, addSampleFriends, name, xpByDay, streak, activeLang, appearance } = useStore()
  const today = dayKey()
  const mine = cosmeticsOf(appearance.equipped)
  const rows: Row[] = [
    { key: friendCode, name, weeklyXp: weeklyXp(xpByDay), streak: liveStreak(streak), lang: activeLang, me: true, ...mine },
    ...friends.map((f) => ({
      key: f.code,
      name: f.name,
      ...simulatedStats(f, today),
      me: false,
      note: f.sample ? 'sample' : undefined,
      onRemove: () => confirm(`Remove ${f.name} from your friends?`) && removeFriend(f.code),
    })),
  ].sort((a, b) => b.weeklyXp - a.weeklyXp)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="stack">
      <PageHeader icon="users" title="Friends" subtitle="Learn together — see who’s on a streak this week." />
      <ShareCard label="Your friend code" value={friendCode} />
      <AddForm
        placeholder="Add a friend: LIN-XXXX"
        button="Add"
        onAdd={async (code) => {
          const err = addFriend(code)
          setError(err)
          if (err) throw new Error(err)
        }}
      />
      {error && <p className="error small">{error}</p>}
      <section>
        <h2>This week’s leaderboard</h2>
        <Leaderboard rows={rows} />
        {friends.length === 0 && (
          <div className="empty">
            <p className="muted">Learning with friends keeps you more consistent. Share your code or add theirs.</p>
            <button className="btn" onClick={addSampleFriends}>
              Add sample friends
            </button>
          </div>
        )}
      </section>
      <p className="small muted">
        You’re offline-only: friends here are simulated on this device. <Link to="/profile">Sign in</Link> to add real friends — including your Wordle Unlimited
        friends.
      </p>
    </div>
  )
}

function ShareCard({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="cta-card">
      <div>
        <div className="muted small">{label}</div>
        <div className="friend-code">{value}</div>
      </div>
      <button
        className="btn"
        onClick={() => {
          navigator.clipboard?.writeText(value).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          })
        }}
      >
        <Icon name="copy" size={16} /> {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

function AddForm({ placeholder, button, onAdd }: { placeholder: string; button: string; onAdd(value: string): Promise<void> }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <>
      <form
        className="row"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          try {
            await onAdd(value.trim())
            setValue('')
            setError(null)
          } catch (err) {
            setError((err as Error).message)
          } finally {
            setBusy(false)
          }
        }}
      >
        <input className="text-input grow" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} autoComplete="off" />
        <button className="btn btn-primary" disabled={!value.trim() || busy}>
          <Icon name="plus" size={16} /> {button}
        </button>
      </form>
      {error && <p className="error small">{error}</p>}
    </>
  )
}

function Leaderboard({ rows }: { rows: Row[] }) {
  if (!rows.length) return null
  return (
    <ol className="leaderboard stagger">
      {rows.map((r, i) => (
        <li key={r.key} className={r.me ? 'me' : ''}>
          <span className="rank">{i + 1}</span>
          <Avatar name={r.name} />
          <span className="grow">
            <ProfileLink id={r.profileId}>
              <NameTag name={r.me ? `${r.name} (you)` : r.name} nameColor={r.nameColor} title={r.title} />
            </ProfileLink>
            <span className="muted small">
              {' '}
              · learning {COURSES[r.lang].name}
              {r.note && ` · ${r.note}`}
            </span>
          </span>
          <span className="topstat flame-on" title="Streak">
            <Icon name="flame" filled size={16} /> {r.streak}
          </span>
          <span className="lb-xp">{r.weeklyXp} XP</span>
          {r.onRemove && (
            <button className="icon-btn small" aria-label={`Remove ${r.name}`} onClick={r.onRemove}>
              <Icon name="x" size={14} />
            </button>
          )}
        </li>
      ))}
    </ol>
  )
}
