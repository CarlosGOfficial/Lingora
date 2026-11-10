import { LANG_CODES } from '../content'
import type { LangCode } from '../content/types'
import { dayKey } from '../lib/date'
import { useStore, type Appearance } from '../store/useStore'
import { isCustomTheme } from '../theme/themes'
import { ApiError, api } from './api'
import { derive } from './derive'
import { disablePush } from '../lib/push'
import { emptyOutbox, type Account, type Outbox, type Prefs } from './types'

let inFlight: Promise<void> | null = null

function localPrefs(): Prefs {
  const s = useStore.getState()
  return {
    // Only once a course is chosen, so other devices still show the setup until then.
    activeLang: s.onboarded ? s.activeLang : undefined,
    languages: s.languages,
    dailyGoal: s.dailyGoal,
    settings: { ...s.settings },
    appearance: { ...s.appearance } as unknown as Record<string, unknown>,
  }
}

const pending = (o: Outbox) => o.reviews.length + o.xp.length + o.completions.length + o.imports.length + o.purchases.length + o.claims.length

/** Push the outbox and replace local progress with the server's view. */
export function syncNow(): Promise<void> {
  if (inFlight) return inFlight
  inFlight = (async () => {
    const s = useStore.getState()
    if (!s.account) return
    const sent = s.outbox
    try {
      const snap = await api.sync({ outbox: sent, prefs: localPrefs() })
      const sentIds = new Set([
        ...sent.reviews.map((e) => e.id),
        ...sent.xp.map((e) => e.id),
        ...sent.completions.map((e) => e.refId),
        ...sent.purchases.map((e) => e.id),
        ...sent.claims.map((e) => `claim-${e.day}`),
      ])
      const current = useStore.getState().outbox
      const remaining: Outbox = {
        reviews: current.reviews.filter((e) => !sentIds.has(e.id)),
        xp: current.xp.filter((e) => !sentIds.has(e.id)),
        completions: current.completions.filter((e) => !sentIds.has(e.refId)),
        imports: current.imports.filter((e) => !sent.imports.includes(e)),
        purchases: current.purchases.filter((e) => !sentIds.has(e.id)),
        claims: current.claims.filter((e) => !sentIds.has(`claim-${e.day}`)),
      }
      // Events recorded mid-request are already in local state; keep them on top of the snapshot.
      const merged = {
        ...snap,
        reviews: [...snap.reviews, ...remaining.reviews],
        completions: [...snap.completions, ...remaining.completions],
        xp: [...snap.xp, ...remaining.xp.map((e) => ({ lang: e.lang, day: e.day, xp: e.xp }))],
        purchases: [...snap.purchases, ...remaining.purchases],
        claims: [...snap.claims, ...remaining.claims.filter((c) => !snap.claims.some((x) => x.day === c.day))],
      }
      useStore.setState({
        ...derive(merged, dayKey()),
        account: snap.account,
        wallet: typeof snap.wallet === 'number' ? snap.wallet : null,
        name: snap.account.username,
        outbox: remaining,
        lastSyncedAt: Date.now(),
        syncError: null,
      })
      void refreshDecks()
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) useStore.setState({ account: null, syncError: 'Signed out — please sign in again.' })
      else useStore.setState({ syncError: (e as Error).message })
    }
  })().finally(() => {
    inFlight = null
  })
  return inFlight
}

/** Package progress made before signing in so it merges into the account. */
function importLocalProgress(): Outbox {
  const s = useStore.getState()
  const out = emptyOutbox()
  for (const lang of LANG_CODES) {
    const p = s.progress[lang]
    for (const card of Object.values(p.cards)) {
      const { itemId, ...state } = card
      out.imports.push({ itemId, lang, state })
    }
    for (const refId of p.completedLessons) out.completions.push({ refId, lang, kind: 'lesson', at: Date.now() })
    for (const refId of p.completedReadings) out.completions.push({ refId, lang, kind: 'reading', at: Date.now() })
  }
  // Daily XP isn't split by language locally, so it's credited to the active course.
  for (const [day, xp] of Object.entries(s.xpByDay)) {
    if (xp > 0) out.xp.push({ id: `import-${s.deviceId}-${day}`, lang: s.activeLang, xp: Math.min(xp, 1000), day, at: Date.now() })
  }
  out.purchases.push(...s.shop.purchases)
  out.claims.push(...s.shop.claims)
  return out
}

async function afterAuth(acct: Account, adoptServerPrefs: boolean) {
  const p = acct.prefs
  const s = useStore.getState()
  const patch: Partial<ReturnType<typeof useStore.getState>> = {
    account: acct,
    name: acct.username,
    outbox: importLocalProgress(),
    guest: false,
    // New accounts (and Wordle accounts opening Lingora for the first time) get the
    // course setup; anyone who already chose a course here or on another device skips it.
    onboarded: s.onboarded,
  }
  if (adoptServerPrefs && p.activeLang && LANG_CODES.includes(p.activeLang)) {
    patch.onboarded = true
    patch.activeLang = p.activeLang
    patch.languages = (p.languages ?? [p.activeLang]).filter((l): l is LangCode => LANG_CODES.includes(l))
    if (typeof p.dailyGoal === 'number') patch.dailyGoal = p.dailyGoal
    if (p.settings) patch.settings = { ...s.settings, ...p.settings }
    const a = p.appearance as Partial<Appearance> | undefined
    if (a) {
      patch.appearance = {
        theme: typeof a.theme === 'string' ? a.theme : s.appearance.theme,
        custom: isCustomTheme(a.custom) ? a.custom : s.appearance.custom,
        equipped: { ...s.appearance.equipped, ...(a.equipped ?? {}) },
      }
    }
  }
  useStore.setState(patch)
  await syncNow()
}

/**
 * Signed in on the server but not on this device yet (for example, arrived from Banter or
 * Wordle Unlimited through a sign-in link): use that session.
 */
export async function adoptServerSession() {
  if (useStore.getState().account) return
  try {
    await afterAuth(await api.me(), true)
  } catch {
    /* not signed in: the website shows the sign-in page as usual */
  }
}

export async function signUp(username: string, password: string) {
  await afterAuth(await api.signup({ username, password }), false)
}

export async function logIn(username: string, password: string) {
  await afterAuth(await api.login({ username, password }), true)
}

/** Sign in with the 4-digit PIN from Wordle Unlimited. */
export async function logInWithPin(pin: string) {
  await afterAuth(await api.loginPin(pin), true)
}

/**
 * Starts a course over. Signed in, the server's history for it is deleted too (after
 * pushing anything still queued), so the next sync can't bring it back.
 */
export async function restartCourse(lang: LangCode) {
  const signedIn = !!useStore.getState().account
  if (signedIn) {
    await syncNow()
    await api.resetProgress(lang)
  }
  useStore.getState().restartCourse(lang)
  if (signedIn) await syncNow()
}

/** Erases all Lingora progress (here and, signed in, on the server); the account stays. */
export async function eraseAllProgress() {
  const signedIn = !!useStore.getState().account
  if (signedIn) {
    await syncNow()
    await api.resetProgress()
  }
  useStore.getState().eraseProgress()
  if (signedIn) await syncNow()
}

/** Signing out clears this device so the next person starts fresh. */
export async function logOut() {
  await syncNow()
  // Stop notifications for this account on this device.
  await disablePush().catch(() => {})
  await api.logout().catch(() => {})
  useStore.getState().resetAll()
}

/** Sync on load, shortly after new activity, and when the tab regains focus. */
export function startAutoSync(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(() => void syncNow(), 1500)
  }
  if (useStore.getState().account) void syncNow()
  const unsub = useStore.subscribe((s, prev) => {
    const changed = s.outbox !== prev.outbox && pending(s.outbox) > 0
    const prefsChanged = s.appearance !== prev.appearance || s.settings !== prev.settings || s.activeLang !== prev.activeLang || s.dailyGoal !== prev.dailyGoal
    if (s.account && (changed || prefsChanged)) schedule()
  })
  const onFocus = () => useStore.getState().account && void syncNow()
  window.addEventListener('focus', onFocus)
  return () => {
    clearTimeout(timer)
    unsub()
    window.removeEventListener('focus', onFocus)
  }
}

/** Your own and followed community decks (their cards are learnable items). */
export async function refreshDecks() {
  if (!useStore.getState().account) return
  try { useStore.getState().setDecks(await api.myDecks()) } catch { /* offline: keep what we have */ }
}
