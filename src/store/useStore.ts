import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEY } from '../config'
import type { LangCode } from '../content/types'
import { dayKey, weekStart, daysBetween } from '../lib/date'
import { newCard, review, type Rating, type SrsCard } from '../lib/fsrs'
import { SHOP_ITEM_BY_ID, dayNumber, levelFromXp, priceToday, type EquipSlot, type Equipped } from '../shop/catalog'
import { cannotBuy, coinBalance, dailyStatus, emptyShopLog, ownedItems, totalXp, type ShopLog } from '../shop/wallet'
import { generateFriendCode, isValidCode, lookupFriend, normalizeCode, sampleFriends, type Friend } from '../social/friends'
import { emptyOutbox, type Account, type Outbox } from '../sync/types'
import { DEFAULT_CUSTOM_THEME, type CustomTheme, type ThemeChoice } from '../theme/themes'
import { bump, emptyStreak, reconcile, type Streak } from './streak'

export interface CardRecord extends SrsCard {
  itemId: string
}

export interface LangProgress {
  completedLessons: string[]
  completedReadings: string[]
  cards: Record<string, CardRecord>
  xp: number
}

export interface Settings {
  listening: boolean
  speaking: boolean
  showReading: boolean
  /** Per language: furigana (ja) / pinyin (zh) on or off; falls back to showReading. */
  readingByLang?: Partial<Record<LangCode, boolean>>
  speechRate: number
}

export interface SessionInput {
  lang: LangCode
  xp: number
  ratings: Record<string, Rating>
  lessonId?: string
  /** Several lessons at once (passing a section's "jump here" test completes everything before it). */
  lessonIds?: string[]
  readingId?: string
  /** A finished story (stored with readings, synced as kind 'story'). */
  storyId?: string
}

const lessonIdsOf = (s: SessionInput) => [...new Set([...(s.lessonId ? [s.lessonId] : []), ...(s.lessonIds ?? [])])]

export interface Appearance {
  theme: ThemeChoice
  /** The theme being edited in Theme Studio (applied when theme = 'custom'). */
  custom: CustomTheme
  equipped: Equipped
}

interface State {
  onboarded: boolean
  name: string
  friendCode: string
  dailyGoal: number
  activeLang: LangCode
  languages: LangCode[]
  progress: Record<LangCode, LangProgress>
  xpByDay: Record<string, number>
  streak: Streak
  friends: Friend[]
  settings: Settings
  /** Random per-device id; prefixes event ids so they never collide across devices. */
  deviceId: string
  account: Account | null
  /** Events not yet pushed to the server (only queued while signed in). */
  outbox: Outbox
  lastSyncedAt: number | null
  syncError: string | null
  shop: ShopLog
  /** Coins in the shared wallet (Wordle Unlimited's) at the last sync; null when not signed in. */
  wallet: number | null
  appearance: Appearance
  /** Using Lingora without an account (only offered when the server can't hold accounts). */
  guest: boolean

  onboard(name: string, lang: LangCode, dailyGoal: number): void
  setGuest(guest: boolean): void
  setActiveLang(lang: LangCode): void
  recordSession(input: SessionInput): void
  reconcileStreak(): void
  addFriend(rawCode: string): string | null
  addSampleFriends(): void
  removeFriend(code: string): void
  updateSettings(patch: Partial<Settings>): void
  setDailyGoal(xp: number): void
  setName(name: string): void
  resetAll(): void
  /** Clears one course's lessons and reviews on this device (XP, streak and coins stay). */
  restartCourse(lang: LangCode): void
  /** Clears all progress on this device but stays signed in; the course setup runs again. */
  eraseProgress(): void
  /** Returns an error message, or null when bought. */
  buyItem(itemId: string): string | null
  /** Returns the coins received, or null if already claimed today. */
  claimDaily(): number | null
  equip(slot: EquipSlot, itemId: string | null): void
  setTheme(choice: ThemeChoice): void
  setCustomTheme(theme: CustomTheme): void
}

const emptyLang = (): LangProgress => ({ completedLessons: [], completedReadings: [], cards: {}, xp: 0 })

const initial = () => ({
  onboarded: false,
  name: '',
  friendCode: generateFriendCode(),
  dailyGoal: 20,
  activeLang: 'zh' as LangCode,
  languages: [] as LangCode[],
  progress: { zh: emptyLang(), ja: emptyLang(), pt: emptyLang() },
  xpByDay: {} as Record<string, number>,
  streak: emptyStreak(),
  friends: [] as Friend[],
  settings: { listening: true, speaking: true, showReading: true, speechRate: 0.9 },
  deviceId: Math.random().toString(36).slice(2, 10),
  account: null as Account | null,
  outbox: emptyOutbox(),
  lastSyncedAt: null as number | null,
  syncError: null as string | null,
  shop: emptyShopLog(),
  wallet: null,
  appearance: {
    theme: 'system',
    custom: DEFAULT_CUSTOM_THEME,
    equipped: { title: 'tt_learner', celebration: 'ce_confetti' },
  } as Appearance,
  guest: false,
})

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),

      onboard(name, lang, dailyGoal) {
        set({ onboarded: true, name: name.trim() || 'Learner', activeLang: lang, languages: [lang], dailyGoal })
      },

      setGuest(guest) {
        set({ guest })
      },

      setActiveLang(lang) {
        const { languages } = get()
        set({ activeLang: lang, languages: languages.includes(lang) ? languages : [...languages, lang] })
      },

      recordSession(input) {
        const { lang, xp, ratings, storyId } = input
        const readingId = input.readingId ?? storyId
        const now = Date.now()
        const today = dayKey()
        const state = get()
        const prog = state.progress[lang]
        const newLessons = lessonIdsOf(input).filter((id) => !prog.completedLessons.includes(id))
        const cards = { ...prog.cards }
        for (const [itemId, rating] of Object.entries(ratings)) {
          const prev = cards[itemId] ?? { ...newCard(now), itemId }
          cards[itemId] = { ...review(prev, rating, now), itemId }
        }
        set({
          progress: {
            ...state.progress,
            [lang]: {
              cards,
              xp: prog.xp + xp,
              completedLessons: newLessons.length ? [...prog.completedLessons, ...newLessons] : prog.completedLessons,
              completedReadings:
                readingId && !prog.completedReadings.includes(readingId) ? [...prog.completedReadings, readingId] : prog.completedReadings,
            },
          },
          xpByDay: { ...state.xpByDay, [today]: (state.xpByDay[today] ?? 0) + xp },
          streak: bump(state.streak, today),
          outbox: state.account ? queueEvents(state.outbox, state.deviceId, now, today, input) : state.outbox,
        })
      },

      reconcileStreak() {
        set({ streak: reconcile(get().streak, dayKey()) })
      },

      addFriend(rawCode) {
        const code = normalizeCode(rawCode)
        const { friends, friendCode } = get()
        if (!isValidCode(code)) return 'Codes look like LIN-AB12.'
        if (code === friendCode) return 'That’s your own code!'
        if (friends.some((f) => f.code === code)) return 'Already on your list.'
        set({ friends: [...friends, lookupFriend(code)] })
        return null
      },

      addSampleFriends() {
        const { friends } = get()
        set({ friends: [...friends, ...sampleFriends().filter((s) => !friends.some((f) => f.code === s.code))] })
      },

      removeFriend(code) {
        set({ friends: get().friends.filter((f) => f.code !== code) })
      },

      updateSettings(patch) {
        set({ settings: { ...get().settings, ...patch } })
      },

      setDailyGoal(xp) {
        set({ dailyGoal: xp })
      },

      setName(name) {
        set({ name: name.trim() || 'Learner' })
      },

      resetAll() {
        set(initial())
      },

      restartCourse(lang) {
        const s = get()
        const other = <T extends { lang: LangCode }>(list: T[]) => list.filter((e) => e.lang !== lang)
        set({
          progress: { ...s.progress, [lang]: { ...emptyLang(), xp: s.progress[lang].xp } },
          outbox: { ...s.outbox, reviews: other(s.outbox.reviews), completions: other(s.outbox.completions), imports: other(s.outbox.imports) },
        })
      },

      eraseProgress() {
        const s = get()
        set({ ...initial(), account: s.account, deviceId: s.deviceId, settings: s.settings, guest: s.guest, name: s.name })
      },

      buyItem(itemId) {
        const s = get()
        const item = SHOP_ITEM_BY_ID.get(itemId)
        if (!item) return 'That item doesn’t exist.'
        const xp = totalXp(s.xpByDay)
        const why = cannotBuy(item, {
          coins: coinsNow(s),
          level: levelFromXp(xp),
          owned: ownedItems(s.shop),
          held: (id) => (id === 'pw_freeze' ? s.streak.freezes : 0),
        })
        if (why) return why
        const now = Date.now()
        const purchase = { id: `${s.deviceId}-${now}-${itemId}`, itemId, price: priceToday(item), at: now }
        set({
          shop: { ...s.shop, purchases: [...s.shop.purchases, purchase] },
          streak: itemId === 'pw_freeze' ? { ...s.streak, freezes: s.streak.freezes + 1 } : s.streak,
          outbox: s.account ? { ...s.outbox, purchases: [...s.outbox.purchases, purchase] } : s.outbox,
        })
        return null
      },

      claimDaily() {
        const s = get()
        const status = dailyStatus(s.shop.claims)
        if (status.claimedToday) return null
        const claim = { day: dayNumber(), streakDay: status.streakDay, coins: status.reward, at: Date.now() }
        set({
          shop: { ...s.shop, claims: [...s.shop.claims, claim] },
          outbox: s.account ? { ...s.outbox, claims: [...s.outbox.claims, claim] } : s.outbox,
        })
        return claim.coins
      },

      equip(slot, itemId) {
        const s = get()
        if (itemId) {
          const item = SHOP_ITEM_BY_ID.get(itemId)
          if (!item || item.category !== slot || !ownedItems(s.shop).has(itemId)) return
        }
        const appearance = { ...s.appearance, equipped: { ...s.appearance.equipped, [slot]: itemId } }
        if (slot === 'theme') appearance.theme = (itemId as ThemeChoice | null) ?? 'system'
        set({ appearance })
      },

      setTheme(choice) {
        const s = get()
        const isItem = choice.startsWith('th_')
        if (isItem && !ownedItems(s.shop).has(choice)) return
        set({ appearance: { ...s.appearance, theme: choice, equipped: { ...s.appearance.equipped, theme: isItem ? choice : null } } })
      },

      setCustomTheme(theme) {
        set({ appearance: { ...get().appearance, custom: theme, theme: 'custom', equipped: { ...get().appearance.equipped, theme: null } } })
      },
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      // v1 stored an outbox without purchases/claims.
      migrate: (persisted) => {
        const p = persisted as Partial<State>
        return { ...p, outbox: { ...emptyOutbox(), ...(p.outbox ?? {}) } } as State
      },
    },
  ),
)

function queueEvents(outbox: Outbox, deviceId: string, now: number, today: string, s: SessionInput): Outbox {
  const id = `${deviceId}-${now}`
  return {
    ...outbox,
    reviews: [
      ...outbox.reviews,
      ...Object.entries(s.ratings).map(([itemId, rating]) => ({ id: `${id}-${itemId}`, itemId, lang: s.lang, rating, at: now })),
    ],
    xp: [...outbox.xp, { id: `${id}-xp`, lang: s.lang, xp: s.xp, day: today, at: now }],
    completions: [
      ...outbox.completions,
      ...lessonIdsOf(s).map((refId) => ({ refId, lang: s.lang, kind: 'lesson' as const, at: now })),
      ...(s.readingId ? [{ refId: s.readingId, lang: s.lang, kind: 'reading' as const, at: now }] : []),
      ...(s.storyId ? [{ refId: s.storyId, lang: s.lang, kind: 'story' as const, at: now }] : []),
    ],
  }
}

/* ---------- Selectors ---------- */

export function todayXp(xpByDay: Record<string, number>): number {
  return xpByDay[dayKey()] ?? 0
}

export function weeklyXp(xpByDay: Record<string, number>): number {
  const today = dayKey()
  const start = weekStart(today)
  return Object.entries(xpByDay)
    .filter(([d]) => daysBetween(start, d) >= 0 && daysBetween(d, today) >= 0)
    .reduce((sum, [, xp]) => sum + xp, 0)
}

export function dueCards(prog: LangProgress, now = Date.now()): CardRecord[] {
  return Object.values(prog.cards)
    .filter((c) => c.due <= now)
    .sort((a, b) => a.due - b.due)
}

/** Streak as it stands right now (0 if broken and not yet reconciled). */
export function liveStreak(streak: Streak): number {
  return reconcile(streak, dayKey()).current
}

/**
 * Coins you can spend right now. Signed in, that's the shared wallet from the last sync,
 * plus what's waiting to sync (XP, daily rewards) minus purchases waiting to sync. Without
 * an account it's the old local count.
 */
export function coinsNow(s: Pick<State, 'wallet' | 'outbox' | 'shop' | 'xpByDay' | 'account'>): number {
  if (!s.account || s.wallet === null) return coinBalance(totalXp(s.xpByDay), s.shop)
  const pending = s.outbox.xp.reduce((n, e) => n + e.xp, 0) + s.outbox.claims.reduce((n, c) => n + c.coins, 0)
  return s.wallet + pending - s.outbox.purchases.reduce((n, p) => n + p.price, 0)
}

/** Are readings (furigana / pinyin / romaji) shown for this language? */
export const readingOn = (s: Settings, lang: LangCode) => s.readingByLang?.[lang] ?? s.showReading
