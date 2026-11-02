/**
 * Chat formats shared with Wordle Unlimited (its shared/social.ts): both apps read and
 * write the same direct_messages / group_messages rows, so these must stay in step.
 */

export const MAX_MESSAGE = 500
export const MAX_GROUP_MEMBERS = 20
export const MAX_GROUPS = 30 // groups one person can be in
export const GROUP_NAME_MAX = 40
export const QUICK_REACTIONS = ['❤️', '😂', '👍', '😮', '😢', '🔥']
export const MAX_REACTION_KINDS = 20 // different emoji on one message
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024 // after the browser shrinks it
export const MAX_GIF_BYTES = 4 * 1024 * 1024 // GIF files are sent as they are (shrinking would stop them moving)
export const DAILY_IMAGE_LIMIT = 60
export const MAX_FAVORITE_GIFS = 100
export const GIPHY_ID_RE = /^[A-Za-z0-9]{4,64}$/

// Messages can be cards instead of text:
//   INVITE:<room code>          a Wordle game invite
//   PARTY:<party code>          a Wordle watch party invite
//   CLIP:<recording id>:<title> a shared Wordle clip
//   IMG:<chat image id>         an uploaded picture (or GIF file)
//   GIF:<giphy id>              a GIF from the GIPHY search
// Typed text that starts with one of these gets a leading space, so only real cards render.
const CARD_RE = /^(INVITE|PARTY|CLIP|IMG|GIF):/
export const inviteCode = (content: string) => (content.startsWith('INVITE:') ? content.slice(7) : null)
export const partyCode = (content: string) => (content.startsWith('PARTY:') ? content.slice(6) : null)
export function sharedClip(content: string): { recordingId: string; title: string } | null {
  if (!content.startsWith('CLIP:')) return null
  const rest = content.slice(5)
  const i = rest.indexOf(':')
  return i < 0 ? { recordingId: rest, title: 'Clip' } : { recordingId: rest.slice(0, i), title: rest.slice(i + 1) || 'Clip' }
}
export const imageId = (content: string) => (content.startsWith('IMG:') ? content.slice(4) : null)
export const gifId = (content: string) => (content.startsWith('GIF:') ? content.slice(4) : null)
export const chatImageUrl = (id: string) => `/api/chat-images/${id}`
export const giphyUrl = (id: string) => `https://i.giphy.com/${id}.webp`
export const giphyPreviewUrl = (id: string) => `https://media.giphy.com/media/${id}/200w.webp`
export const asPlainText = (content: string) => (CARD_RE.test(content) ? ' ' + content : content)
/** Plain text (not a card) — the only kind that can be edited or copied. */
export const isPlainText = (content: string) => !CARD_RE.test(content)

/** One-line preview of a message (chat lists, reply quotes). */
export function messagePreview(content: string): string {
  if (inviteCode(content)) return '🎮 Game invite'
  if (partyCode(content)) return '🍿 Watch party invite'
  if (imageId(content)) return '📷 Photo'
  if (gifId(content)) return 'GIF'
  const clip = sharedClip(content)
  if (clip) return `🎬 Shared a clip: ${clip.title}`
  const text = content.trimStart()
  return text.length > 120 ? text.slice(0, 120) + '…' : text
}

// One emoji (with skin tones, flags, ZWJ sequences...), nothing else.
const HAS_EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u
const ONLY_EMOJI = /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|\p{Emoji_Modifier}|\p{Regional_Indicator}|‍|️|⃣)+$/u
export function isEmoji(s: string): boolean {
  return s.length > 0 && s.length <= 16 && HAS_EMOJI.test(s) && ONLY_EMOJI.test(s)
}

export type ChatKind = 'dm' | 'group'

export interface ChatMessage {
  id: number
  /** null = a group notice ("Sam added Alex"). */
  from: string | null
  mine: boolean
  /** "" once deleted. */
  content: string
  at: string
  editedAt: string | null
  deleted: boolean
  replyTo: { id: number; from: string | null; preview: string } | null
  reactions: { emoji: string; count: number; mine: boolean; userIds: string[] }[]
  /** DMs you sent: they've opened the chat since. */
  read?: boolean
}

/** What a chat needs to show who someone is. */
export interface ChatPerson {
  id: string
  username: string
  title: string | null
  nameColor: string | null
}

export interface GroupSummary {
  id: number
  name: string
  ownerId: string | null
  members: (ChatPerson & { online: boolean; lastReadId: number })[]
  unread: number
  lastMessage: { fromName: string | null; content: string; at: string } | null
}

/** What you can send: text, an uploaded picture, or a GIPHY GIF; optionally as a reply. */
export interface ChatBody {
  content?: string
  image?: string
  gif?: string
  replyToId?: number
}

export interface GifResult {
  id: string
  preview: string
  width: number
  height: number
}
