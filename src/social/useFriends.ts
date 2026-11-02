import { useEffect, useSyncExternalStore } from 'react'
import { dayKey } from '../lib/date'
import { useStore } from '../store/useStore'
import { api } from '../sync/api'
import type { FriendsData } from '../sync/types'
import type { GroupSummary } from './chat'

/**
 * Friends, requests and leaderboard from the server, shared by every component that
 * shows them (the Friends page and the nav badge), refreshed while any is mounted.
 */
const POLL_MS = 20_000
const PRESENCE_MS = 30_000

let data: FriendsData | null = null
let groups: GroupSummary[] | null = null
let error: string | null = null
let timer: ReturnType<typeof setInterval> | undefined
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export async function refreshFriends(): Promise<void> {
  try {
    ;[data, groups] = await Promise.all([api.friends(dayKey()), api.groups()])
    error = null
  } catch (e) {
    error = (e as Error).message
  }
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    void refreshFriends()
    timer = setInterval(() => document.visibilityState === 'visible' && void refreshFriends(), POLL_MS)
  }
  return () => {
    listeners.delete(listener)
    if (!listeners.size) clearInterval(timer)
  }
}

type Snapshot = { data: FriendsData | null; groups: GroupSummary[] | null; error: string | null }
let snapshot: Snapshot = { data, groups, error }
const getSnapshot = () =>
  snapshot.data === data && snapshot.groups === groups && snapshot.error === error ? snapshot : (snapshot = { data, groups, error })
const signedOut: Snapshot = { data: null, groups: null, error: null }

export function useFriends(): Snapshot {
  const signedIn = useStore((s) => !!s.account)
  const state = useSyncExternalStore(signedIn ? subscribe : noop, getSnapshot)
  return signedIn ? state : signedOut
}
const noop = () => () => {}

/** New requests + unread messages (friends and groups), for the nav badge. */
export function useFriendAlerts(): number {
  const { data, groups } = useFriends()
  return (data?.incoming.length ?? 0) + (data?.friends.reduce((n, f) => n + f.unread, 0) ?? 0) + (groups?.reduce((n, g) => n + g.unread, 0) ?? 0)
}

/** Tells the server you're online (friends see a green dot, here and in Wordle Unlimited). */
export function usePresence(): void {
  const signedIn = useStore((s) => !!s.account)
  useEffect(() => {
    if (!signedIn) return
    const ping = () => document.visibilityState === 'visible' && api.presence().catch(() => {})
    ping()
    const id = setInterval(ping, PRESENCE_MS)
    document.addEventListener('visibilitychange', ping)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', ping)
    }
  }, [signedIn])
}
