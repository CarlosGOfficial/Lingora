import type { LangCode } from '../content/types'
import type { ChatPerson } from './chat'

/** Bios are shared with Wordle Unlimited (users.bio), so they use its limit. */
export const BIO_MAX = 160

export type ProfileRelation = 'self' | 'friend' | 'outgoing' | 'incoming' | 'none' | 'guest'

export interface CourseProgress {
  lang: LangCode
  xp: number
  lessons: number
  totalLessons: number
  /** Level of the furthest unit they've reached, e.g. "HSK 2", "N5", "A2". */
  level: string | null
}

/** A public profile, like Wordle Unlimited's, with Lingora stats instead of game stats. */
export interface PublicProfile extends ChatPerson {
  isAdmin: boolean
  bio: string | null
  joinedAt: string | null
  online: boolean
  /** Which apps they have open right now. */
  openIn?: ('lingora' | 'banter' | 'wordle')[]
  lastSeen: string | null
  friends: number
  relation: ProfileRelation
  /** The pending request between you (to accept, decline or cancel it). */
  requestId: number | null
  /** null until they open Lingora. */
  lingora: {
    totalXp: number
    level: number
    streak: number
    bestStreak: number
    activeDays: number
    lessons: number
    words: number
    activeLang: LangCode | null
    courses: CourseProgress[]
  } | null
  /** A glance at their Wordle Unlimited record (null if they've never played). */
  wordle: { roundsWon: number; roundsPlayed: number; bestWinStreak: number } | null
}

/** New things to pop up a toast for; the server marks each as shown (here or in Wordle). */
export interface Notifications {
  friendRequests: { from: string; fromId: string }[]
  messages: { from: string; fromId: string; content: string }[]
  /** One per group: its newest message (already a preview) and how many arrived. */
  groupMessages: { groupId: number; group: string; from: string; content: string; count: number }[]
}
