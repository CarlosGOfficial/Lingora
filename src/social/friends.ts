/**
 * Friends service. Phase 1 runs fully locally: friends are added by code and
 * their activity is simulated deterministically from the code + week.
 * Phase 2 swaps these functions for API calls with the same shapes.
 */
import type { LangCode } from '../content/types'
import { daysBetween, weekStart } from '../lib/date'
import { hashString, mulberry32 } from '../lib/random'

export interface Friend {
  code: string
  name: string
  addedAt: number
  sample?: boolean
}

export interface FriendStats {
  weeklyXp: number
  streak: number
  lang: LangCode
}

const CODE_RE = /^[A-Z]{3}-[A-Z0-9]{4}$/
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const NAMES = ['Mei', 'Haruto', 'Beatriz', 'Liang', 'Yuki', 'Rafael', 'Sakura', 'Wei', 'Lucas', 'Aiko', 'Camila', 'Jun', 'Thiago', 'Hana', 'Xiao']

export function generateFriendCode(): string {
  let tail = ''
  for (let i = 0; i < 4; i++) tail += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return `LIN-${tail}`
}

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase()
}

export function isValidCode(code: string): boolean {
  return CODE_RE.test(code)
}

/** Resolve a code to a profile. Locally that means a stable simulated name. */
export function lookupFriend(code: string): Friend {
  return { code, name: NAMES[hashString(code) % NAMES.length], addedAt: Date.now() }
}

export function sampleFriends(): Friend[] {
  return ['LIN-M3IW', 'LIN-HRT0', 'LIN-BEA7'].map((code) => ({ ...lookupFriend(code), sample: true }))
}

export function simulatedStats(friend: Friend, today: string): FriendStats {
  const start = weekStart(today)
  const rand = mulberry32(hashString(friend.code + start))
  const daysSoFar = daysBetween(start, today) + 1
  let weeklyXp = 0
  for (let i = 0; i < daysSoFar; i++) if (rand() > 0.25) weeklyXp += 10 + Math.floor(rand() * 40)
  const base = mulberry32(hashString(friend.code))
  const langs: LangCode[] = ['zh', 'ja', 'pt']
  return {
    weeklyXp,
    streak: 1 + Math.floor(base() * 60) + daysBetween(start, today),
    lang: langs[Math.floor(base() * 3)],
  }
}
