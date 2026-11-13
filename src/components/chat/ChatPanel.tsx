import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import {
  MAX_MESSAGE,
  QUICK_REACTIONS,
  chatImageUrl,
  gifId,
  giphyPreviewUrl,
  giphyUrl,
  imageId,
  isPoll,
  voiceNote,
  sharedFile,
  sticker,
  challengeCard, recapCard,
  dailyResult,
  fileSize,
  inviteCode,
  isEmoji,
  isPlainText,
  messagePreview,
  partyCode,
  sharedClip,
  type ChatBody,
  type ChatKind,
  type ChatMessage,
  type ChatPerson,
  type GifResult,
} from '../../social/chat'
import { EMOJI_CATEGORIES } from '../../social/emoji'
import { uploadChatImage } from '../../social/upload'
import { useGifFavorites, type Chat } from '../../social/useChat'
import { Link } from 'react-router-dom'
import { api } from '../../sync/api'
import { Icon } from '../Icon'
import { ReportDialog, type ReportTarget } from '../ReportDialog'
import { ProfileLink } from '../ProfileLink'
import { Formatted, mentions } from './Formatted'
import { useAppLinks } from '../../social/apps'
import { useStore } from '../../store/useStore'

// Pieces shared by friend chats and group chats (a port of Wordle Unlimited's ChatParts).

export type Member = ChatPerson & { online?: boolean; lastReadId?: number }

/** 'October 2026' (or '2026' for a year in review). */
const recapLabel = (period: string) => new Date(Date.UTC(Number(period.slice(0, 4)), period.length > 4 ? Number(period.slice(5, 7)) - 1 : 0, 1))
  .toLocaleDateString(undefined, period.length > 4 ? { month: 'long', year: 'numeric', timeZone: 'UTC' } : { year: 'numeric', timeZone: 'UTC' })

export function Avatar({ person, online, size = 'md' }: { person?: Pick<ChatPerson, 'username' | 'avatar'> | null; online?: boolean; size?: 'xs' | 'sm' | 'md' | 'big' }) {
  const [broken, setBroken] = useState(false)
  const pic = person?.avatar && !broken ? person.avatar : null
  return (
    <span className={`avatar avatar-${size} ${size === 'big' ? 'big' : ''} ${pic ? 'has-pic' : ''}`}>
      {pic ? <img src={pic} alt="" onError={() => setBroken(true)} /> : person?.username[0]?.toUpperCase() ?? '?'}
      {online !== undefined && <i className={`presence ${online ? 'on' : ''}`} aria-label={online ? 'Online' : 'Offline'} />}
    </span>
  )
}

/** A picture or GIF in a chat; tap to see it big. */
function MediaMessage({ src, alt, onLoad, giphy }: { src: string; alt: string; onLoad?: () => void; giphy?: boolean }) {
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  if (failed) return <div className="bubble them muted-bubble">{alt} isn’t available</div>
  return (
    <>
      <button type="button" className="media-msg" onClick={() => setOpen(true)}>
        <img src={src} alt={alt} loading="lazy" onLoad={onLoad} onError={() => setFailed(true)} />
      </button>
      {open && (
        <div className="lightbox" role="dialog" aria-label={alt} onClick={() => setOpen(false)}>
          <img src={src} alt={alt} />
          {giphy ? (
            <span className="lightbox-note">via GIPHY</span>
          ) : (
            <a className="lightbox-note" href={src} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <Icon name="download" size={14} /> Open original
            </a>
          )}
        </div>
      )}
    </>
  )
}

/** Cards from Wordle Unlimited (game and party invites, clips) open there. */
function WordleCard({ icon, title, text, href, action }: { icon: string; title: string; text: string; href?: string; action?: string }) {
  return (
    <div className="wordle-card">
      <strong>
        {icon} {title}
      </strong>
      <span className="muted small">{text}</span>
      {href && (
        <a className="btn btn-primary small app-card-btn" href={href} target="_blank" rel="noopener noreferrer">
          {action ?? 'Open'} <Icon name="external" size={14} />
        </a>
      )}
    </div>
  )
}

type BanterInvite = { name: string; color: string; emoji: string | null; icon: string | null; banner: string | null; members: number; joined: boolean; url: string }

/** A Banter server invite link: the server's name, icon and size, and a button to join it in Banter. */
function BanterInviteCard({ code, mine, sender }: { code: string; mine: boolean; sender: string }) {
  const [inv, setInv] = useState<BanterInvite | null | undefined>(undefined)
  useEffect(() => {
    let live = true
    fetch(`/api/banter/invites/${encodeURIComponent(code)}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => live && setInv(v))
      .catch(() => live && setInv(null))
    return () => { live = false }
  }, [code])
  return (
    <div className="banter-card">
      {inv?.banner && <img className="banter-card-banner" src={inv.banner} alt="" />}
      <div className="banter-card-body">
        <span className="banter-card-label">{mine ? 'You sent a Banter server invite' : `${sender} invited you to a Banter server`}</span>
        {inv === undefined ? <span className="muted small">Loading…</span> : !inv ? <span className="muted small">That invite has expired.</span> : (
          <>
            <div className="banter-card-head">
              {inv.icon ? <img className="banter-card-icon" src={inv.icon} alt="" /> : (
                <span className="banter-card-icon" style={{ background: inv.color }}>{inv.emoji ?? inv.name.slice(0, 1).toUpperCase()}</span>
              )}
              <span className="banter-card-name">
                <strong>{inv.name}</strong>
                <span className="muted small">{inv.members} {inv.members === 1 ? 'member' : 'members'}</span>
              </span>
            </div>
            <a className="btn btn-primary small app-card-btn" href={inv.url} target="_blank" rel="noopener noreferrer">
              {inv.joined ? 'Open in Banter' : 'Join on Banter'} <Icon name="external" size={14} />
            </a>
          </>
        )}
      </div>
    </div>
  )
}

/** Banter invite codes in a message (links to the Banter site's /invite/<code>). */
function banterInvites(text: string, banterUrl: string | undefined): string[] {
  if (!banterUrl) return []
  let origin = ''
  try { origin = new URL(banterUrl).origin } catch { return [] }
  const out: string[] = []
  for (const m of text.matchAll(/https?:\/\/[^\s/]+\/invite\/([A-Za-z0-9]{4,16})\b/g)) {
    try { if (new URL(m[0]).origin === origin && !out.includes(m[1])) out.push(m[1]) } catch { /* not a link */ }
  }
  return out
}

export function MessageBody({ content, mine, sender, me, onMediaLoad }: { content: string; mine: boolean; sender: string; me?: string | null; onMediaLoad?: () => void }) {
  const links = useAppLinks()
  const img = imageId(content)
  const gif = gifId(content)
  const clip = sharedClip(content)
  const code = inviteCode(content)
  const party = partyCode(content)
  if (img) return <MediaMessage src={chatImageUrl(img)} alt="Photo" onLoad={onMediaLoad} />
  const voice = voiceNote(content)
  if (voice) {
    // Voice messages are great for language practice: replay as often as you like.
    return (
      <div className="voice-card">
        <strong>🎤 Voice message</strong>
        <audio controls preload="metadata" src={`/api/voice-notes/${voice.id}`} />
      </div>
    )
  }
  const file = sharedFile(content)
  if (file) {
    return (
      <a className="file-card" href={`/api/files/${file.id}`} download={file.name} data-testid="file-card">
        <span className="file-icon">📎</span>
        <span><strong>{file.name}</strong><small>{fileSize(file.bytes)} · Download</small></span>
      </a>
    )
  }
  const recap = recapCard(content)
  if (recap) return <WordleCard icon="📊" title={`${recapLabel(recap.period)} recap`} text={`🟩 ${recap.wins} Wordle wins · 📚 ${recap.xp} XP · 💬 ${recap.messages} messages`} href={`/recap/${recap.period}`} action="See yours" />
  const challenge = challengeCard(content)
  if (challenge) {
    const href = links?.wordleUrl ? `${links.wordleUrl}/challenge/${challenge.id}` : undefined
    if (challenge.result) {
      const rows = challenge.result.rows.map((r) => r.split('').map((c) => (c === 'G' ? '🟩' : c === 'Y' ? '🟨' : '⬛')).join('')).join('\n')
      return <WordleCard icon="🧩" title={`Wordle challenge · ${challenge.result.score}/6`} text={rows} href={href} action="See how everyone did" />
    }
    return <WordleCard icon="🧩" title="A Wordle word challenge" text={`${mine ? 'You' : sender} set a word to guess.`} href={href} action="Guess it in Wordle" />
  }
  const daily = dailyResult(content)
  if (daily) {
    const rows = daily.rows.map((r) => r.split('').map((c) => (c === 'G' ? '🟩' : c === 'Y' ? '🟨' : '⬛')).join('')).join('\n')
    return <WordleCard icon="📅" title={`Wordle Daily #${daily.number} · ${daily.score}/6`} text={rows} href={links?.wordleUrl ? `${links.wordleUrl}/daily` : undefined} action="Play today's" />
  }
  const st = sticker(content)
  if (st) return <img className="sticker" src={chatImageUrl(st.image)} alt={st.name} title={st.name} onLoad={onMediaLoad} data-testid="sticker" />
  if (isPoll(content)) {
    return (
      <WordleCard icon="📊" title="Poll" text={`${mine ? 'You' : sender} started a poll. Vote in Banter.`} href={links?.banterUrl ? `${links.banterUrl}/chats` : undefined} action="Open Banter" />
    )
  }
  if (gif) return <MediaMessage src={giphyUrl(gif)} alt="GIF" onLoad={onMediaLoad} giphy />
  const w = links?.wordleUrl
  if (clip) return <WordleCard icon="🎬" title={clip.title} text={`${mine ? 'You' : sender} shared a clip from Wordle Unlimited.`} href={w} action="Watch in Wordle" />
  if (party) return <WordleCard icon="🍿" title="Watch party" text={`${mine ? 'You' : sender} started a watch party in Wordle Unlimited.`} href={w && `${w}/party/${party}`} action="Join the party" />
  if (code) return <WordleCard icon="🎮" title="Game invite" text={`${mine ? 'You' : sender} invited ${mine ? 'them' : 'you'} to game ${code}.`} href={w && `${w}/room/${code}`} action="Join the game" />
  const text = content.trimStart()
  const invites = banterInvites(text, links?.banterUrl)
  // Just an invite link: show only the card.
  if (invites.length === 1 && text.replace(/https?:\/\/\S+\/invite\/[A-Za-z0-9]{4,16}/, '').trim() === '') return <BanterInviteCard code={invites[0]} mine={mine} sender={sender} />
  const jumbo = text.length <= 27 && /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|\p{Emoji_Modifier}|\u200d|\ufe0f|\s)+$/u.test(text) && /\p{Extended_Pictographic}/u.test(text)
  return (
    <>
      <div className={`bubble ${mine ? 'me' : 'them'} ${jumbo ? 'jumbo' : ''} ${!mine && mentions(text, me ?? null) ? 'mentioned' : ''}`}>
        <Formatted text={text} me={me ?? null} banter={links?.banterUrl} />
      </div>
      {invites.slice(0, 2).map((c) => <BanterInviteCard key={c} code={c} mine={mine} sender={sender} />)}
    </>
  )
}

/* ---------- Pickers ---------- */

function PickerShell({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="picker">
      <div className="picker-head">
        <span>{title}</span>
        <button type="button" className="icon-btn small" onClick={onClose} aria-label="Close">
          <Icon name="x" size={14} />
        </button>
      </div>
      <div className="picker-body">{children}</div>
      {footer}
    </div>
  )
}

/** GIPHY search (needs GIPHY_API_KEY on the server); GIF files can always be sent as pictures. */
function GifPicker({ onPick, onUploadFile, onClose }: { onPick: (id: string) => void; onUploadFile: () => void; onClose: () => void }) {
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  const [data, setData] = useState<{ enabled: boolean; results: GifResult[] } | null>(null)
  const [error, setError] = useState('')
  const favs = useGifFavorites()

  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 400)
    return () => clearTimeout(t)
  }, [text])
  useEffect(() => {
    let live = true
    setData(null)
    api.gifs(q).then(
      (d) => live && (setData(d), setError('')),
      (e) => live && setError((e as Error).message),
    )
    return () => {
      live = false
    }
  }, [q])

  const tile = (id: string, preview: string) => (
    <div key={id} className="gif-tile">
      <button type="button" onClick={() => onPick(id)}>
        <img src={preview} alt="GIF" loading="lazy" />
      </button>
      <button type="button" className={`gif-star ${favs.isFavorite(id) ? 'on' : ''}`} onClick={() => favs.toggle(id)} aria-label={favs.isFavorite(id) ? 'Unstar' : 'Star'}>
        <Icon name="star" size={13} filled={favs.isFavorite(id)} />
      </button>
    </div>
  )
  const off = data && !data.enabled
  return (
    <PickerShell
      title="GIFs"
      onClose={onClose}
      footer={
        !off && (
          <div className="picker-foot">
            <button type="button" className="link-btn small" onClick={onUploadFile}>
              Send a GIF file instead
            </button>
            <strong>Powered by GIPHY</strong>
          </div>
        )
      }
    >
      {off ? (
        <div className="stack-sm small muted">
          <p>GIF search isn’t set up on this server — you can still send a GIF file.</p>
          <button type="button" className="btn btn-primary small" onClick={onUploadFile}>
            Choose a GIF file
          </button>
        </div>
      ) : (
        <>
          <input autoFocus className="text-input small-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search GIFs" />
          {!q && (
            <>
              <div className="picker-label">★ Favorites</div>
              {favs.favorites.length ? (
                <div className="gif-grid">{favs.favorites.map((f) => tile(f.id, giphyPreviewUrl(f.id)))}</div>
              ) : (
                <p className="small muted">Star a GIF to keep it here.</p>
              )}
              <div className="picker-label">Trending</div>
            </>
          )}
          {!data && !error && <p className="small muted">Loading…</p>}
          {error && <p className="small error">{error}</p>}
          <div className="gif-grid">{data?.results.map((g) => tile(g.id, g.preview))}</div>
          {data?.enabled && data.results.length === 0 && <p className="small muted">No GIFs found.</p>}
        </>
      )}
    </PickerShell>
  )
}

function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [cat, setCat] = useState(0)
  const [typed, setTyped] = useState('')
  const ok = isEmoji(typed.trim())
  return (
    <div className="emoji-picker">
      <div className="emoji-tabs">
        {EMOJI_CATEGORIES.map((c, i) => (
          <button type="button" key={c.name} title={c.name} className={i === cat ? 'on' : ''} onClick={() => setCat(i)}>
            {c.icon}
          </button>
        ))}
      </div>
      <div className="emoji-grid">
        {EMOJI_CATEGORIES[cat].emoji.map((e) => (
          <button type="button" key={e} onClick={() => onPick(e)}>
            {e}
          </button>
        ))}
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          if (ok) onPick(typed.trim())
        }}
      >
        <input className="text-input small-input grow" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Any emoji" />
        <button className="btn btn-primary small" disabled={!ok}>
          React
        </button>
      </form>
    </div>
  )
}

/* ---------- The message menu (right-click, or hold on a phone) ---------- */

type MenuState = { msg: ChatMessage; x: number; y: number; emoji?: boolean }

function MessageMenu({ menu, onClose, onReact, onReply, onEdit, onDelete, onReport }: {
  menu: MenuState
  onClose: () => void
  onReact: (emoji: string) => void
  onReply: () => void
  onEdit: () => void
  onDelete: () => void
  onReport?: () => void
}) {
  const [showEmoji, setShowEmoji] = useState(!!menu.emoji)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pos, setPos] = useState({ left: menu.x, top: menu.y })
  const box = useRef<HTMLDivElement>(null)
  const favs = useGifFavorites()
  const m = menu.msg
  const text = isPlainText(m.content)
  const img = imageId(m.content)
  const gif = gifId(m.content)

  // Keep the menu on screen.
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setPos({
      left: Math.max(8, Math.min(menu.x, window.innerWidth - r.width - 8)),
      top: menu.y + r.height + 8 > window.innerHeight ? Math.max(8, menu.y - r.height) : menu.y,
    })
  }, [menu.x, menu.y, showEmoji])

  // Close on a click outside (listening from the next tick, so the right-click or long
  // press that opened the menu doesn't also close it) or Escape.
  useEffect(() => {
    const down = (e: PointerEvent) => !box.current?.contains(e.target as Node) && onClose()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const t = setTimeout(() => document.addEventListener('pointerdown', down), 250)
    document.addEventListener('keydown', key)
    return () => {
      clearTimeout(t)
      document.removeEventListener('pointerdown', down)
      document.removeEventListener('keydown', key)
    }
  }, [onClose])

  const act = (fn: () => void) => () => {
    fn()
    onClose()
  }
  return (
    <div ref={box} className="msg-menu" style={pos} role="menu">
      {showEmoji ? (
        <EmojiPicker onPick={(e) => act(() => onReact(e))()} />
      ) : (
        <>
          <div className="quick-reactions">
            {QUICK_REACTIONS.map((e) => (
              <button type="button" key={e} className={m.reactions.some((r) => r.emoji === e && r.mine) ? 'on' : ''} onClick={act(() => onReact(e))}>
                {e}
              </button>
            ))}
            <button type="button" className="more" onClick={() => setShowEmoji(true)} aria-label="More emoji">
              <Icon name="smile" size={18} />
            </button>
          </div>
          <button type="button" className="menu-item" onClick={act(onReply)}>
            <Icon name="reply" size={16} /> Reply
          </button>
          {text && (
            <button type="button" className="menu-item" onClick={act(() => void navigator.clipboard?.writeText(m.content.trimStart()).catch(() => {}))}>
              <Icon name="copy" size={16} /> Copy text
            </button>
          )}
          {img && (
            <a className="menu-item" href={chatImageUrl(img)} target="_blank" rel="noopener noreferrer" onClick={onClose}>
              <Icon name="download" size={16} /> Open picture
            </a>
          )}
          {gif && (
            <button type="button" className="menu-item" onClick={act(() => void favs.toggle(gif))}>
              <Icon name="star" size={16} filled={favs.isFavorite(gif)} /> {favs.isFavorite(gif) ? 'Unstar GIF' : 'Star GIF'}
            </button>
          )}
          {!m.mine && m.from && (
            <Link className="menu-item" to={`/u/${encodeURIComponent(m.from)}`} onClick={onClose}>
              <Icon name="user" size={16} /> View profile
            </Link>
          )}
          {onReport && !m.mine && m.from && !m.deleted && (
            <button type="button" className="menu-item" onClick={act(onReport)}>
              <Icon name="flag" size={16} /> Report message
            </button>
          )}
          {m.mine && text && (
            <button type="button" className="menu-item" onClick={act(onEdit)}>
              <Icon name="pencil" size={16} /> Edit
            </button>
          )}
          {m.mine && (
            <button type="button" className="menu-item danger" onClick={() => (confirmDelete ? act(onDelete)() : setConfirmDelete(true))}>
              <Icon name="trash" size={16} /> {confirmDelete ? 'Tap again to delete' : 'Delete'}
            </button>
          )}
        </>
      )}
    </div>
  )
}

function dayLabel(d: Date): string {
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === new Date(Date.now() - 86_400_000).toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
}

/* ---------- A whole chat: messages + the message box ---------- */

export function ChatPanel({ kind, chat, meId, person, group, readers, placeholder, emptyText }: {
  kind: ChatKind
  chat: Chat
  meId: string
  /** Who sent a message. */
  person: (id: string) => Member | undefined
  /** Show senders' names and avatars. */
  group: boolean
  /** Groups: how far each member has read. */
  readers?: Member[]
  placeholder: string
  emptyText?: string
}) {
  const messages = chat.messages ?? []
  const myName = useStore((st) => st.account?.username ?? null)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [reporting, setReporting] = useState<ReportTarget | null>(null)
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [editing, setEditing] = useState<ChatMessage | null>(null)
  const [flash, setFlash] = useState<number | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const press = useRef<{ x: number; y: number; timer: number } | null>(null)
  const lastId = messages[messages.length - 1]?.id

  const nameOf = (id: string | null) => (id === null ? 'Notice' : id === meId ? 'You' : person(id)?.username ?? 'Former member')
  const lastMine = [...messages].reverse().find((m) => m.mine && !m.deleted)

  // Group read receipts: each other member sits under the newest message they've seen.
  const seenBy = new Map<number, Member[]>()
  for (const r of readers ?? []) {
    if (r.id === meId) continue
    const at = [...messages].reverse().find((m) => m.id <= (r.lastReadId ?? 0) && m.from !== null && m.from !== r.id)
    if (at) seenBy.set(at.id, [...(seenBy.get(at.id) ?? []), r])
  }
  const othersCount = (readers ?? []).filter((r) => r.id !== meId).length

  // Stick to the newest message when one arrives.
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [lastId])
  const mediaLoaded = () => {
    const el = scroller.current
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 400) bottom.current?.scrollIntoView({ block: 'end' })
  }
  const jumpTo = (id: number) => {
    const el = document.getElementById(`msg-${kind}-${id}`)
    if (!el) return chat.setError('That message is too far back to show.')
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setFlash(id)
    setTimeout(() => setFlash((f) => (f === id ? null : f)), 1500)
  }
  const openMenu = (msg: ChatMessage, x: number, y: number, emoji = false) => setMenu({ msg, x, y, emoji })
  const pressHandlers = (m: ChatMessage) => ({
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault()
      openMenu(m, e.clientX, e.clientY)
    },
    // Hold on a phone (iPhones don't send a context menu event).
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0]
      const x = t.clientX
      const y = t.clientY
      press.current = {
        x,
        y,
        timer: window.setTimeout(() => {
          openMenu(m, x, y)
          navigator.vibrate?.(12)
        }, 450),
      }
    },
    onTouchMove: (e: React.TouchEvent) => {
      const p = press.current
      const t = e.touches[0]
      if (p && Math.hypot(t.clientX - p.x, t.clientY - p.y) > 10) {
        clearTimeout(p.timer)
        press.current = null
      }
    },
    onTouchEnd: () => {
      if (press.current) clearTimeout(press.current.timer)
      press.current = null
    },
  })

  return (
    <div className="chat-panel">
      <div ref={scroller} className="chat-scroll" aria-live="polite">
        {chat.messages === null && !chat.error && <p className="muted center-text">Loading…</p>}
        {chat.messages?.length === 0 && emptyText && <p className="muted center-text">{emptyText}</p>}
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const at = new Date(m.at)
          const newDay = !prev || new Date(prev.at).toDateString() !== at.toDateString()
          const day = newDay && <div className="chat-day">{dayLabel(at)}</div>
          if (!m.from)
            return (
              <div key={m.id}>
                {day}
                <div className="chat-notice">{m.content}</div>
              </div>
            )
          // Messages from the same person within a few minutes are grouped (one name/avatar).
          const firstInRun = newDay || !prev || prev.from !== m.from || at.getTime() - new Date(prev.at).getTime() > 5 * 60_000 || !!m.replyTo
          const who = person(m.from)
          const name = nameOf(m.from)
          const time = at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
          const seen = seenBy.get(m.id)
          return (
            <div key={m.id}>
              {day}
              <div id={`msg-${kind}-${m.id}`} className={`msg-row ${m.mine ? 'me' : 'them'} ${firstInRun ? 'first' : ''} ${flash === m.id ? 'flash' : ''}`}>
                {group &&
                  !m.mine &&
                  (firstInRun ? (
                    <ProfileLink id={m.from} label={`${name}’s profile`}>
                      <Avatar person={who ?? { username: name }} online={who?.online} size="sm" />
                    </ProfileLink>
                  ) : (
                    <span className="avatar-gap" />
                  ))}
                <div className="msg-col">
                  {group && !m.mine && firstInRun && (
                    <ProfileLink id={m.from}>
                      <span className="msg-name" style={who?.nameColor ? { color: who.nameColor } : undefined}>
                        {name}
                      </span>
                    </ProfileLink>
                  )}
                  {m.replyTo && (
                    <button type="button" className="reply-quote" onClick={() => jumpTo(m.replyTo!.id)}>
                      <Icon name="reply" size={12} />
                      <strong>{nameOf(m.replyTo.from)}</strong>
                      <span>{m.replyTo.preview}</span>
                    </button>
                  )}
                  <div className="msg-body" title={time} {...(m.deleted ? {} : pressHandlers(m))}>
                    {m.deleted ? <div className="bubble deleted">Message deleted</div> : <MessageBody content={m.content} mine={m.mine} sender={name} me={myName} onMediaLoad={mediaLoaded} />}
                  </div>
                  {m.reactions.length > 0 && (
                    <div className="reaction-row">
                      {m.reactions.map((r) => (
                        <button type="button" key={r.emoji} className={`reaction-chip ${r.mine ? 'mine' : ''}`} title={r.userIds.map(nameOf).join(', ')} onClick={() => chat.react(m.id, r.emoji)}>
                          {r.emoji}
                          {r.count > 1 && <b>{r.count}</b>}
                        </button>
                      ))}
                    </div>
                  )}
                  {(m.editedAt || (kind === 'dm' && m === lastMine && m.read)) && (
                    <span className="msg-meta">
                      {[m.editedAt && !m.deleted ? 'Edited' : '', kind === 'dm' && m === lastMine && m.read ? 'Seen' : ''].filter(Boolean).join(' · ')}
                    </span>
                  )}
                  {seen && (
                    <div className="seen-by" title={`Seen by ${seen.map((p) => p.username).join(', ')}`}>
                      {seen.slice(0, 5).map((p) => (
                        <Avatar key={p.id} person={p} size="xs" />
                      ))}
                      {seen.length > 5 && <span>+{seen.length - 5}</span>}
                      {m === lastMine && (
                        <span className="msg-meta">{seen.length === othersCount && othersCount > 1 ? 'Seen by everyone' : `Seen by ${seen.map((p) => p.username).join(', ')}`}</span>
                      )}
                    </div>
                  )}
                </div>
                {/* Quick buttons on hover (computers); phones hold the message instead. */}
                {!m.deleted && (
                  <div className="msg-hover">
                    <button
                      type="button"
                      aria-label="React"
                      onClick={(e) => {
                        const r = e.currentTarget.getBoundingClientRect()
                        openMenu(m, r.left, r.bottom)
                      }}
                    >
                      <Icon name="smile" size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Reply"
                      onClick={() => {
                        setEditing(null)
                        setReplyTo(m)
                      }}
                    >
                      <Icon name="reply" size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottom} className="chat-end" />
      </div>

      {menu && (
        <MessageMenu
          key={`${menu.msg.id}-${menu.x}-${menu.y}`}
          menu={menu}
          onReport={() => setReporting({ kind, messageId: menu.msg.id })}
          onClose={() => setMenu(null)}
          onReact={(emoji) => void chat.react(menu.msg.id, emoji)}
          onReply={() => {
            setEditing(null)
            setReplyTo(menu.msg)
          }}
          onEdit={() => {
            setReplyTo(null)
            setEditing(menu.msg)
          }}
          onDelete={() => void chat.remove(menu.msg.id)}
        />
      )}
      {reporting && <ReportDialog target={reporting} onClose={() => setReporting(null)} />}

      {chat.error && (
        <p className="error small" role="alert">
          {chat.error}
        </p>
      )}
      <Composer
        placeholder={placeholder}
        pending={chat.sending}
        replyTo={replyTo && { name: nameOf(replyTo.from), preview: messagePreview(replyTo.content) }}
        editing={editing}
        onCancel={() => {
          setReplyTo(null)
          setEditing(null)
        }}
        send={async (body) => {
          const ok = await chat.send(replyTo ? { ...body, replyToId: replyTo.id } : body)
          if (ok) setReplyTo(null)
          return ok
        }}
        saveEdit={async (content) => {
          await chat.edit(editing!.id, content)
          setEditing(null)
        }}
        onError={chat.setError}
      />
    </div>
  )
}

/** Text box with buttons for pictures and GIFs. Pasting a picture sends it too. */
function Composer({ placeholder, send, pending, replyTo, editing, onCancel, saveEdit, onError }: {
  placeholder: string
  send: (body: ChatBody) => Promise<boolean>
  pending: boolean
  replyTo: { name: string; preview: string } | null
  editing: ChatMessage | null
  onCancel: () => void
  saveEdit: (content: string) => Promise<void>
  onError: (message: string) => void
}) {
  const [text, setText] = useState('')
  const [gifs, setGifs] = useState(false)
  const [uploading, setUploading] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const draft = useRef('')

  // Editing puts the message in the box (and gives back what you were typing after).
  useEffect(() => {
    if (editing) {
      draft.current = text
      setText(editing.content.trimStart())
    } else if (draft.current) {
      setText(draft.current)
      draft.current = ''
    }
    if (editing || replyTo) input.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id, replyTo?.preview])

  const sendFile = async (f: File) => {
    setUploading(true)
    try {
      const image = await uploadChatImage(f)
      if (await send({ image })) setGifs(false)
    } catch (e) {
      onError((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="composer">
      {gifs && (
        <GifPicker
          onClose={() => setGifs(false)}
          onPick={async (gif) => {
            if (await send({ gif })) setGifs(false)
          }}
          onUploadFile={() => file.current?.click()}
        />
      )}
      {replyTo && !editing && (
        <div className="compose-bar">
          <Icon name="reply" size={14} />
          <span className="grow">
            Replying to <b>{replyTo.name}</b>: {replyTo.preview}
          </span>
          <button type="button" onClick={onCancel} aria-label="Cancel reply">
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
      {editing && (
        <div className="compose-bar">
          <Icon name="pencil" size={14} />
          <span className="grow">Editing message</span>
          <button type="button" onClick={onCancel} aria-label="Cancel edit">
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
      {uploading && <div className="small muted">Sending picture…</div>}
      <form
        className="chat-input"
        onSubmit={async (e) => {
          e.preventDefault()
          const msg = text.trim()
          if (!msg) return
          if (editing) {
            await saveEdit(msg)
            setText('')
          } else if (await send({ content: msg })) setText('')
        }}
      >
        {!editing && (
          <>
            <button type="button" className="icon-btn compose-btn" disabled={uploading} onClick={() => file.current?.click()} aria-label="Send a picture">
              <Icon name="image" size={18} />
            </button>
            <button type="button" className={`icon-btn compose-btn gif-btn ${gifs ? 'on' : ''}`} onClick={() => setGifs(!gifs)} aria-label="Send a GIF">
              GIF
            </button>
          </>
        )}
        <input
          ref={input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onCancel()}
          onPaste={(e) => {
            const f = Array.from(e.clipboardData.files).find((x) => x.type.startsWith('image/'))
            if (f) {
              e.preventDefault()
              void sendFile(f)
            }
          }}
          maxLength={MAX_MESSAGE}
          placeholder={editing ? 'Edit your message' : placeholder}
          autoComplete="off"
          aria-label="Message"
        />
        <button type="submit" className="btn btn-primary icon-only" disabled={!text.trim() || pending} aria-label={editing ? 'Save' : 'Send'}>
          <Icon name={editing ? 'check' : 'send'} size={18} />
        </button>
      </form>
      <input
        ref={file}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) void sendFile(f)
        }}
      />
    </div>
  )
}
