import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../sync/api'
import { useStore } from '../store/useStore'
import { timeAgo } from '../lib/time'
import { Icon } from './Icon'

/*
 * The activity hub (server/ops.ts): one inbox for Lingora, Banter and Wordle Unlimited, and
 * what friends have been up to. Links into the other apps open signed in (lib/crossAppLinks.ts).
 */

type HubLink = { href: string; app: 'wordle' | 'banter' | 'lingora'; here: boolean }
type InboxItem = { id: number; kind: string; title: string; body: string; count: number; at: string; read: boolean; link: HubLink | null }
type Activity = { id: number; kind: string; data: Record<string, any>; at: string; user: { id: string; name: string; avatar: string | null } }

const KINDS: [string, string][] = [
  ['wordle.daily', 'My Wordle Daily results'],
  ['wordle.level', 'Wordle level-ups'],
  ['wordle.streak', 'Wordle win streaks'],
  ['wordle.clan', 'Joining Wordle clans'],
  ['lingora.lesson', 'Lessons and stories I finish'],
  ['lingora.level', 'Lingora level-ups'],
]
const LANG: Record<string, string> = { zh: 'Chinese', ja: 'Japanese', pt: 'Portuguese' }
const BADGE: Record<string, string> = { wordle: '🟩', banter: '💬', lingora: '📘' }

function describe(a: Activity, wordle: string | null): { text: string; href: string | null; here: boolean; grid?: string[] } {
  const d = a.data
  const w = (path: string) => ({ href: wordle ? `${wordle}${path}` : null, here: false })
  switch (a.kind) {
    case 'wordle.daily': return { text: `played Wordle Daily #${d.number}: ${d.score}/6`, ...w('/daily'), grid: d.rows }
    case 'wordle.level': return { text: `reached level ${d.level} in Wordle`, ...w(`/u/${a.user.id}`) }
    case 'wordle.streak': return { text: `won ${d.streak} Wordle rounds in a row`, ...w(`/u/${a.user.id}`) }
    case 'wordle.clan': return { text: `joined the Wordle clan [${d.tag}] ${d.name}`, ...w(`/clan/${d.id}`) }
    case 'lingora.lesson': return { text: `finished “${d.title}” in ${LANG[d.lang] ?? d.lang}`, href: `/u/${a.user.id}`, here: true }
    case 'lingora.level': return { text: `reached level ${d.level} in Lingora`, href: `/u/${a.user.id}`, here: true }
    default: return { text: a.kind, href: null, here: true }
  }
}

function Row({ href, here, onOpen, children }: { href: string | null; here: boolean; onOpen: () => void; children: React.ReactNode }) {
  if (href && here) return <Link className="hub-row" to={href} onClick={onOpen} data-testid="hub-row">{children}</Link>
  if (href) return <a className="hub-row" href={href} target="_blank" rel="noopener" onClick={onOpen} data-testid="hub-row">{children}</a>
  return <button type="button" className="hub-row" onClick={onOpen} data-testid="hub-row">{children}</button>
}

export function HubBell() {
  const signedIn = useStore((s) => !!s.account)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'inbox' | 'friends' | 'sharing'>('inbox')
  const [inbox, setInbox] = useState<{ items: InboxItem[]; unread: number } | null>(null)
  const [feed, setFeed] = useState<Activity[] | null>(null)
  const [hidden, setHidden] = useState<string[] | null>(null)
  const [wordleUrl, setWordleUrl] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const loadInbox = () => api.hubInbox().then(setInbox).catch(() => {})
  useEffect(() => {
    if (!signedIn) return
    void loadInbox()
    const id = setInterval(loadInbox, 60_000)
    return () => clearInterval(id)
  }, [signedIn])
  useEffect(() => {
    if (!open) return
    if (tab === 'friends') {
      api.hubFeed().then(setFeed).catch(() => setFeed([]))
      fetch('/api/ops/apps').then((r) => r.json()).then((x) => setWordleUrl(x?.wordle ?? null)).catch(() => {})
    }
    if (tab === 'sharing') api.hubSharing().then((r) => setHidden(r.hidden)).catch(() => setHidden([]))
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open, tab])

  if (!signedIn) return null
  const unread = inbox?.unread ?? 0
  const markRead = (ids?: number[]) => api.hubRead(ids).then(loadInbox).catch(() => {})
  const toggleKind = (k: string, show: boolean) => {
    const next = show ? (hidden ?? []).filter((x) => x !== k) : [...(hidden ?? []), k]
    setHidden(next)
    api.hubSetSharing(next).then((r) => setHidden(r.hidden)).catch(() => {})
  }

  return (
    <div className="menu-wrap" ref={ref}>
      <button className="icon-btn hub-bell" aria-label="Notifications and friends' activity" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)} data-testid="hub-bell">
        <Icon name="bell" size={20} />
        {unread > 0 && <span className="hub-count" data-testid="hub-unread">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className="menu hub-menu" role="dialog" aria-label="Notifications" data-testid="hub-panel">
          {tab === 'sharing' ? (
            <div className="stack-sm hub-sharing">
              <strong>What friends see</strong>
              <p className="small muted">Your friends see these in their activity feed. Turning one off also removes what’s already there.</p>
              {KINDS.map(([k, label]) => (
                <label key={k} className="row hub-toggle">
                  <span className="grow">{label}</span>
                  <input type="checkbox" checked={!(hidden ?? []).includes(k)} disabled={!hidden} onChange={(e) => toggleKind(k, e.target.checked)} />
                </label>
              ))}
              <button className="btn small" onClick={() => setTab('friends')}>Done</button>
            </div>
          ) : (
            <>
              <div className="row hub-tabs">
                {(['inbox', 'friends'] as const).map((x) => (
                  <button key={x} className={`tab-btn ${tab === x ? 'active' : ''}`} onClick={() => setTab(x)} data-testid={`hub-tab-${x}`}>
                    {x === 'inbox' ? 'Notifications' : 'Friends'}
                  </button>
                ))}
                <span className="grow" />
                {tab === 'inbox' && unread > 0 && <button className="btn btn-ghost small" onClick={() => markRead()}>Mark all read</button>}
                {tab === 'friends' && <button className="btn btn-ghost small" onClick={() => setTab('sharing')}>Sharing</button>}
              </div>
              <div className="hub-list">
                {tab === 'inbox' ? (
                  !inbox?.items.length ? <p className="small muted hub-empty">Nothing yet. Messages, invites and news from Lingora, Banter and Wordle land here.</p> : inbox.items.map((i) => (
                    <Row key={i.id} href={i.link?.href ?? null} here={!!i.link?.here} onOpen={() => { if (!i.read) void markRead([i.id]); setOpen(false) }}>
                      <span aria-hidden>{BADGE[i.link?.app ?? 'lingora']}</span>
                      <span className={`hub-text ${i.read ? 'read' : ''}`}>
                        <strong>{i.title}{i.count > 1 ? ` (${i.count})` : ''}</strong>
                        {i.body && <span className="small muted">{i.body}</span>}
                      </span>
                      <span className="small muted">{timeAgo(i.at)}</span>
                    </Row>
                  ))
                ) : !feed ? <p className="small muted hub-empty">…</p> : !feed.length ? <p className="small muted hub-empty">Nothing from your friends this week yet.</p> : feed.map((a) => {
                  const d = describe(a, wordleUrl)
                  return (
                    <Row key={a.id} href={d.href} here={d.here} onOpen={() => setOpen(false)}>
                      <span aria-hidden>{BADGE[a.kind.split('.')[0]]}</span>
                      <span className="hub-text">
                        <span><strong>{a.user.name}</strong> {d.text}</span>
                        {d.grid && <span className="hub-grid">{d.grid.slice(0, 6).map((r: string, i: number) => <span key={i}>{r.split('').map((c, j) => <i key={j} className={`t-${c}`} />)}</span>)}</span>}
                      </span>
                      <span className="small muted">{timeAgo(a.at)}</span>
                    </Row>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
