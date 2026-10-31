import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { NameTag } from '../components/NameTag'
import { PageHeader } from '../components/PageHeader'
import { COURSES } from '../content'
import type { LangCode } from '../content/types'
import { dayKey } from '../lib/date'
import { cosmeticsOf } from '../shop/catalog'
import { simulatedStats } from '../social/friends'
import { liveStreak, useStore, weeklyXp } from '../store/useStore'
import { api } from '../sync/api'
import { syncNow } from '../sync/sync'

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
  removable: boolean
}

export function FriendsPage() {
  const account = useStore((s) => s.account)
  return account ? <OnlineFriends /> : <LocalFriends />
}

/** Signed in: real friends from the server, including accepted Wordle Unlimited friends. */
function OnlineFriends() {
  const username = useStore((s) => s.account?.username ?? '')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      await syncNow()
      const data = await api.friends(dayKey())
      setRows(
        data.map((r) => ({
          ...r,
          key: r.username,
          name: r.username,
          note: r.via === 'wordle' && !r.me ? 'Wordle friend' : undefined,
          removable: !r.me && r.via === 'lingora',
        })),
      )
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <FriendsLayout
      share={{ label: 'Your username', value: username }}
      placeholder="Add a friend by username"
      rows={rows ?? []}
      loading={rows === null && !error}
      loadError={error}
      onAdd={async (name) => {
        await api.addFriend(name)
        await load()
      }}
      onRemove={async (name) => {
        await api.removeFriend(name)
        await load()
      }}
      footer={
        <p className="small muted">
          Friends see each other’s weekly XP, streak and course. Your accepted friends from Wordle Unlimited appear here automatically once they’ve opened
          Lingora (manage those in Wordle).
        </p>
      }
    />
  )
}

/** Signed out: friends stored on this device with simulated activity. */
function LocalFriends() {
  const { friendCode, friends, addFriend, removeFriend, addSampleFriends, name, xpByDay, streak, activeLang, appearance } = useStore()
  const today = dayKey()
  const mine = cosmeticsOf(appearance.equipped)
  const rows: Row[] = [
    { key: friendCode, name, weeklyXp: weeklyXp(xpByDay), streak: liveStreak(streak), lang: activeLang, me: true, removable: false, ...mine },
    ...friends.map((f) => ({ key: f.code, name: f.name, ...simulatedStats(f, today), me: false, removable: true, note: f.sample ? 'sample' : undefined })),
  ].sort((a, b) => b.weeklyXp - a.weeklyXp)

  return (
    <FriendsLayout
      share={{ label: 'Your friend code', value: friendCode }}
      placeholder="Add a friend: LIN-XXXX"
      rows={rows}
      onAdd={async (code) => {
        const err = addFriend(code)
        if (err) throw new Error(err)
      }}
      onRemove={async (code) => removeFriend(code)}
      empty={
        friends.length === 0 && (
          <div className="empty">
            <p className="muted">Learning with friends keeps you more consistent. Share your code or add theirs.</p>
            <button className="btn" onClick={addSampleFriends}>
              Add sample friends
            </button>
          </div>
        )
      }
      footer={
        <p className="small muted">
          You’re offline-only: friends here are simulated on this device. <Link to="/profile">Sign in</Link> to add real friends.
        </p>
      }
    />
  )
}

interface LayoutProps {
  share: { label: string; value: string }
  placeholder: string
  rows: Row[]
  loading?: boolean
  loadError?: string | null
  onAdd(value: string): Promise<void>
  onRemove(key: string): Promise<void>
  empty?: React.ReactNode
  footer: React.ReactNode
}

function FriendsLayout({ share, placeholder, rows, loading, loadError, onAdd, onRemove, empty, footer }: LayoutProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  return (
    <div className="stack">
      <PageHeader icon="users" title="Friends" subtitle="Learn together — see who’s on a streak this week." />

      <div className="cta-card">
        <div>
          <div className="muted small">{share.label}</div>
          <div className="friend-code">{share.value}</div>
        </div>
        <button
          className="btn"
          onClick={() => {
            navigator.clipboard?.writeText(share.value).then(() => {
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            })
          }}
        >
          <Icon name="copy" size={16} /> {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <form
        className="row"
        onSubmit={async (e) => {
          e.preventDefault()
          try {
            await onAdd(value.trim())
            setValue('')
            setError(null)
          } catch (err) {
            setError((err as Error).message)
          }
        }}
      >
        <input className="text-input grow" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} />
        <button className="btn btn-primary" disabled={!value.trim()}>
          <Icon name="plus" size={16} /> Add
        </button>
      </form>
      {error && <p className="error small">{error}</p>}

      <section>
        <h2>This week’s leaderboard</h2>
        {loading && <p className="muted">Loading…</p>}
        {loadError && <p className="error small">{loadError}</p>}
        {rows.length > 0 && (
          <ol className="leaderboard stagger">
            {rows.map((r, i) => (
              <li key={r.key} className={r.me ? 'me' : ''}>
                <span className="rank">{i + 1}</span>
                <span className="avatar">{r.name[0]?.toUpperCase()}</span>
                <span className="grow">
                  <NameTag name={r.me ? `${r.name} (you)` : r.name} nameColor={r.nameColor} title={r.title} />
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
                {r.removable && (
                  <button
                    className="icon-btn small"
                    aria-label={`Remove ${r.name}`}
                    onClick={() => {
                      if (confirm(`Remove ${r.name} from your friends?`)) void onRemove(r.key).catch((e) => setError((e as Error).message))
                    }}
                  >
                    <Icon name="x" size={14} />
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
        {empty}
      </section>

      {footer}
    </div>
  )
}
