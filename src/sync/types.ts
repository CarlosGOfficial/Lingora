/** Wire types shared by the client and the API server. */
import type { LangCode } from '../content/types'
import type { Rating, SrsCard } from '../lib/fsrs'
import type { DailyClaim, Purchase } from '../shop/wallet'
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
  username: string
  weeklyXp: number
  streak: number
  lang: LangCode
  me: boolean
  title: string | null
  nameColor: string | null
  /** Friends from Wordle Unlimited show up too, once they use Lingora. */
  via: 'lingora' | 'wordle'
}

export interface SavedTheme {
  id: string
  name: string
  theme: CustomTheme
  updatedAt: string
}

export const emptyOutbox = (): Outbox => ({ reviews: [], xp: [], completions: [], imports: [], purchases: [], claims: [] })
