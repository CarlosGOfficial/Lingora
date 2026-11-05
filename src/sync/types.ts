/** Wire types shared by the client and the API server. */
import type { LangCode } from '../content/types'
import type { Rating, SrsCard } from '../lib/fsrs'
import type { DailyClaim, Purchase } from '../shop/wallet'
import type { ChatPerson } from '../social/chat'
import type { CustomTheme } from '../theme/themes'

export interface ReviewEvent {
  id: string
  itemId: string
  lang: LangCode
  rating: Rating
  at: number
}

export interface XpEvent {
  id: string
  lang: LangCode
  xp: number
  day: string
  at: number
}

export interface CompletionEvent {
  refId: string
  lang: LangCode
  kind: 'lesson' | 'reading'
  at: number
}

/** One-time upload of progress made before signing in. */
export interface CardImport {
  itemId: string
  lang: LangCode
  state: SrsCard
}

export interface Outbox {
  reviews: ReviewEvent[]
  xp: XpEvent[]
  completions: CompletionEvent[]
  imports: CardImport[]
  purchases: Purchase[]
  claims: DailyClaim[]
}

/** Settings that follow the account (last write wins). */
export interface Prefs {
  activeLang?: LangCode
  languages?: LangCode[]
  dailyGoal?: number
  settings?: Record<string, unknown>
  appearance?: Record<string, unknown>
}

/** A Lingora account is a Wordle Unlimited account: same username and password. */
export interface Account {
  id: string
  username: string
  prefs: Prefs
  /** Wordle Unlimited's 4-digit sign-in PIN (works in Lingora too). */
  pin?: string | null
  /** False for PIN-only accounts (they can add a password in Wordle Unlimited or Banter). */
  hasPassword?: boolean
}

export interface SyncRequest {
  outbox: Outbox
  prefs: Prefs
}

export interface Snapshot {
  account: Account
  reviews: ReviewEvent[]
  imports: CardImport[]
  xp: { lang: LangCode; day: string; xp: number }[]
  completions: CompletionEvent[]
  purchases: Purchase[]
  claims: DailyClaim[]
}

export interface LeaderboardRow {
  id: string
  username: string
  weeklyXp: number
  streak: number
  lang: LangCode
  me: boolean
  title: string | null
  nameColor: string | null
}

/* Friends are shared with Wordle Unlimited (its friendships and direct_messages tables). */

export type FriendCard = ChatPerson

export interface Friend extends FriendCard {
  online: boolean
  /** Which apps they have open right now. */
  openIn?: ('lingora' | 'banter' | 'wordle')[]
  lastSeen: string | null
  unread: number
  /** Has opened Lingora (only they appear on the leaderboard). */
  onLingora: boolean
}

export interface FriendRequest extends FriendCard {
  requestId: number
}

export interface FriendsData {
  leaderboard: LeaderboardRow[]
  friends: Friend[]
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
}

export interface SavedTheme {
  id: string
  name: string
  theme: CustomTheme
  updatedAt: string
}

export const emptyOutbox = (): Outbox => ({ reviews: [], xp: [], completions: [], imports: [], purchases: [], claims: [] })
