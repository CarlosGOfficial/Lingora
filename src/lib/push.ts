/*
 * Turning push notifications on and off in this browser (Web Push + the service worker
 * in /sw.js). The server decides what to send (server/push.ts).
 */

export type PushStatus = 'unsupported' | 'needs-install' | 'off-server' | 'blocked' | 'off' | 'on'

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

async function serverKey(): Promise<string | null> {
  const r = await fetch('/api/push/key', { credentials: 'include' })
  const d = (await r.json().catch(() => ({}))) as { enabled?: boolean; key?: string | null }
  return d.enabled && d.key ? d.key : null
}

const toBytes = (b64: string) => {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(s, (c) => c.charCodeAt(0))
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration('/')) ?? navigator.serviceWorker.register('/sw.js', { scope: '/' })
}

export async function pushStatus(): Promise<PushStatus> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return isIos() && !standalone() ? 'needs-install' : 'unsupported'
  }
  if (!(await serverKey())) return 'off-server'
  if (Notification.permission === 'denied') return 'blocked'
  const reg = await navigator.serviceWorker.getRegistration('/')
  const sub = await reg?.pushManager.getSubscription()
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}

async function post(path: string, body: unknown) {
  const r = await fetch(path, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { message?: string; error?: string }).error ?? 'Something went wrong')
}

/** Asks permission (must be called from a tap), subscribes, and tells the server. */
export async function enablePush(): Promise<PushStatus> {
  const key = await serverKey()
  if (!key) return 'off-server'
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return perm === 'denied' ? 'blocked' : 'off'
  const reg = await registration()
  await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(key) })
  await post('/api/push/subscribe', { subscription: sub.toJSON() })
  return 'on'
}

export async function disablePush(): Promise<PushStatus> {
  const reg = await navigator.serviceWorker.getRegistration('/')
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    await post('/api/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => {})
    await sub.unsubscribe()
  }
  return 'off'
}

export const sendTestPush = () => post('/api/push/test', {})

/** Keeps the server's copy fresh (browsers can rotate subscriptions). Call once when signed in. */
export async function refreshPush() {
  try {
    if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return
    const reg = await navigator.serviceWorker.getRegistration('/')
    const sub = await reg?.pushManager.getSubscription()
    if (sub) await post('/api/push/subscribe', { subscription: sub.toJSON() })
  } catch {
    /* offline etc. */
  }
}
