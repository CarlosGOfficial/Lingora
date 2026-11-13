import { useEffect, useState, useSyncExternalStore } from 'react'

/*
 * Offline mode: the service worker (public/sw.js) keeps the app, its content and stroke
 * data on the device; lessons and reviews go into the outbox and sync when you're back.
 */

/** Registers the service worker (built app only: in dev it would cache the dev server's files). */
export function registerOffline() {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {}))
}

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}
export const useOnline = () => useSyncExternalStore(subscribe, () => navigator.onLine, () => true)

/** Pages that need the server (live play, chat, browsing other people's things). */
export const NEEDS_SERVER: { path: RegExp; what: string }[] = [
  { path: /^\/duels/, what: 'Duels' },
  { path: /^\/study/, what: 'Study rooms' },
  { path: /^\/friends/, what: 'Friends and chat' },
  { path: /^\/conversation/, what: 'Conversation practice' },
  { path: /^\/decks(\/?$|\/new|\/\d+$)/, what: 'Community decks' },
  { path: /^\/crew/, what: 'Crews' },
  { path: /^\/season/, what: 'The season' },
  { path: /^\/u\//, what: 'Profiles' },
  { path: /^\/goals/, what: 'Quests' },
  { path: /^\/shop/, what: 'The shop' },
  { path: /^\/recap/, what: 'Your recap' },
]
export const serverOnly = (path: string) => NEEDS_SERVER.find((n) => n.path.test(path))?.what ?? null

type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }
let deferred: InstallEvent | null = null
const installSubs = new Set<() => void>()
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallEvent
    installSubs.forEach((f) => f())
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installSubs.forEach((f) => f())
  })
}

/** "Install app", when the browser offers it (null otherwise, e.g. already installed). */
export function useInstallPrompt(): (() => Promise<void>) | null {
  const [, bump] = useState(0)
  useEffect(() => {
    const f = () => bump((n) => n + 1)
    installSubs.add(f)
    return () => void installSubs.delete(f)
  }, [])
  if (!deferred) return null
  return async () => {
    const e = deferred!
    deferred = null
    installSubs.forEach((f) => f())
    await e.prompt()
  }
}
