import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import {
  MAX_MESSAGE,
  QUICK_REACTIONS,
  chatImageUrl,
  gifId,
  giphyPreviewUrl,
  giphyUrl,
  imageId,
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
import { ProfileLink } from '../ProfileLink'

// Pieces shared by friend chats and group chats (a port of Wordle Unlimited's ChatParts).

export type Member = ChatPerson & { online?: boolean; lastReadId?: number }

export function Avatar({ person, online, size = 'md' }: { person?: Pick<ChatPerson, 'username'> | null; online?: boolean; size?: 'xs' | 'sm' | 'md' }) {
  return (
    <span className={`avatar avatar-${size}`}>
      {person?.username[0]?.toUpperCase() ?? '?'}
      {online !== undefined && <i className={`presence ${online ? 'on' : ''}`} aria-label={online ? 'Online' : 'Offline'} />}
    </span>
  )
}

/** Text with web links made clickable. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer nofollow">
            {p}
          </a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
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

/** Cards from Wordle Unlimited (game and party invites, clips) can only be opened there. */
function WordleCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="wordle-card">
      <strong>
        {icon} {title}
      </strong>
      <span className="muted small">{text}</span>
    </div>
  )
}

export function MessageBody({ content, mine, sender, onMediaLoad }: { content: string; mine: boolean; sender: string; onMediaLoad?: () => void }) {
  const img = imageId(content)
  const gif = gifId(content)
  const clip = sharedClip(content)
  const code = inviteCode(content)
  const party = partyCode(content)
  if (img) return <MediaMessage src={chatImageUrl(img)} alt="Photo" onLoad={onMediaLoad} />
  if (gif) return <MediaMessage src={giphyUrl(gif)} alt="GIF" onLoad={onMediaLoad} giphy />
  if (clip) return <WordleCard icon="🎬" title={clip.title} text={`${mine ? 'You' : sender} shared a clip — watch it in Wordle Unlimited.`} />
  if (party) return <WordleCard icon="🍿" title="Watch party" text={`${mine ? 'You' : sender} started a watch party — join in Wordle Unlimited.`} />
  if (code) return <WordleCard icon="🎮" title="Game invite" text={`${mine ? 'You' : sender} invited ${mine ? 'them' : 'you'} to game ${code} — join in Wordle Unlimited.`} />
  return (
    <div className={`bubble ${mine ? 'me' : 'them'}`}>
      <Linkified text={content.trimStart()} />
    </div>
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

function MessageMenu({ menu, onClose, onReact, onReply, onEdit, onDelete }: {
  menu: MenuState
  onClose: () => void
  onReact: (emoji: string) => void
  onReply: () => void
  onEdit: () => void
  onDelete: () => void
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
  const [menu, setMenu] = useState<MenuState | null>(null)
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
                    {m.deleted ? <div className="bubble deleted">Message deleted</div> : <MessageBody content={m.content} mine={m.mine} sender={name} onMediaLoad={mediaLoaded} />}
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
