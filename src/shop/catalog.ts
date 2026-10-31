/**
 * Shop catalog, levels and coin rules. Shared by the server (validation) and the
 * browser (shop UI) so both always agree. The level curve, daily ladder, deal picker
 * and rarities follow Wordle Unlimited's shared/shop.ts.
 */
import type { CustomTheme } from '../theme/themes'

/* ---------- Levels (from XP) ---------- */

export const MAX_LEVEL = 100
/** Total XP to reach a level. Level 2 = 20 XP, 5 = 200, 10 = 900. */
export const xpForLevel = (level: number) => 10 * level * (level - 1)

export function levelFromXp(xp: number): number {
  let level = 1
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++
  return level
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp)
  const start = xpForLevel(level)
  const next = level >= MAX_LEVEL ? start : xpForLevel(level + 1)
  return {
    level,
    xpIntoLevel: xp - start,
    xpForNext: next - start,
    fraction: level >= MAX_LEVEL ? 1 : (xp - start) / (next - start),
    nextReward: level >= MAX_LEVEL ? 0 : levelUpCoins(level + 1),
  }
}

/** Coins paid for reaching a level, so XP always feeds the shop. */
export const levelUpCoins = (level: number) => 25 + 5 * level
/** All level-up coins earned on the way to `level`. */
export const totalLevelUpCoins = (level: number) => {
  let sum = 0
  for (let l = 2; l <= level; l++) sum += levelUpCoins(l)
  return sum
}

/** Every XP point is also a coin. */
export const COINS_PER_XP = 1

/* ---------- Daily reward ---------- */

export const DAILY_REWARDS = [25, 35, 50, 60, 75, 90, 150]
export const dailyReward = (streakDay: number) => DAILY_REWARDS[(Math.max(1, streakDay) - 1) % DAILY_REWARDS.length]
/** UTC day number: daily rewards and deals change at midnight UTC for everyone. */
export const dayNumber = (d: Date = new Date()) => Math.floor(d.getTime() / 86_400_000)

/* ---------- Catalog ---------- */

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export const RARITY: Record<Rarity, { label: string; color: string }> = {
  common: { label: 'Common', color: '#94a3b8' },
  rare: { label: 'Rare', color: '#3b82f6' },
  epic: { label: 'Epic', color: '#a855f7' },
  legendary: { label: 'Legendary', color: '#f59e0b' },
}

export type Category = 'theme' | 'title' | 'nameColor' | 'celebration' | 'powerup'
export const CATEGORIES: { id: Category; label: string; plural: string }[] = [
  { id: 'theme', label: 'Theme', plural: 'Themes' },
  { id: 'title', label: 'Title', plural: 'Titles' },
  { id: 'nameColor', label: 'Name colour', plural: 'Name colours' },
  { id: 'celebration', label: 'Celebration', plural: 'Celebrations' },
  { id: 'powerup', label: 'Power-up', plural: 'Power-ups' },
]

export type CelebrationKind = 'confetti' | 'fireworks' | 'petals' | 'lanterns' | 'coins' | 'stars'

export interface ShopItem {
  id: string
  category: Category
  name: string
  rarity: Rarity
  /** 0 = free for everyone. */
  price: number
  /** Level needed to buy it. */
  level?: number
  description?: string
  theme?: CustomTheme
  text?: string
  /** Name colour: a colour or a CSS gradient. */
  color?: string
  celebration?: CelebrationKind
  /** Power-ups can be bought repeatedly, up to `max` held at once. */
  consumable?: { max: number }
}

const theme = (t: CustomTheme) => t

export const SHOP_CATALOG: ShopItem[] = [
  /* Themes */
  {
    id: 'th_midnight', category: 'theme', name: 'Midnight', rarity: 'common', price: 150,
    theme: theme({
      background: { type: 'solid', color: '#000000' }, card: '#0b0b0b', text: '#ffffff', mutedText: '#a3a3a3',
      primary: { type: 'solid', color: '#9b6cff' }, accent: '#ffcc33', border: '#262626', key: '#1c1c1c',
      tileCorrect: '#4caf50', tilePresent: '#d4b034', tileAbsent: '#2e2e2e',
    }),
  },
  {
    id: 'th_mint', category: 'theme', name: 'Mint', rarity: 'common', price: 150,
    theme: theme({
      background: { type: 'gradient', colors: ['#e9fff5', '#d4f5ff'], angle: 135 }, card: '#ffffff', text: '#0d2b23', mutedText: '#4f7368',
      primary: { type: 'solid', color: '#10b981' }, accent: '#f59e0b', border: '#c6e9dc', key: '#e3f4ee',
      tileCorrect: '#10b981', tilePresent: '#d99a00', tileAbsent: '#8a9a95',
    }),
  },
  {
    id: 'th_ocean', category: 'theme', name: 'Ocean', rarity: 'rare', price: 300, level: 3,
    theme: theme({
      background: { type: 'gradient', colors: ['#00111f', '#003a5c', '#006d77'], angle: 180 }, card: '#06243a', text: '#e6f7ff', mutedText: '#8fbcd4',
      primary: { type: 'solid', color: '#00b4d8' }, accent: '#90e0ef', border: '#16425b', key: '#0f3550',
      tileCorrect: '#2ec4b6', tilePresent: '#f4d35e', tileAbsent: '#274c63',
    }),
  },
  {
    id: 'th_sakura', category: 'theme', name: 'Sakura', rarity: 'rare', price: 350, level: 4, description: 'Cherry blossoms in spring.',
    theme: theme({
      background: { type: 'gradient', colors: ['#fff0f5', '#ffe4ec'], angle: 160 }, card: '#ffffff', text: '#3b1f2b', mutedText: '#8a5a6e',
      primary: { type: 'gradient', colors: ['#e75480', '#f78fb3'], angle: 90 }, accent: '#e98a15', border: '#f5c6d6', key: '#fde2ea',
      tileCorrect: '#2a9d8f', tilePresent: '#d98a1c', tileAbsent: '#c9b3bd',
    }),
  },
  {
    id: 'th_sunset', category: 'theme', name: 'Sunset', rarity: 'rare', price: 350, level: 5,
    theme: theme({
      background: { type: 'gradient', colors: ['#2b1055', '#7597de', '#f7b267'], angle: 160 }, card: '#1f1235', text: '#fff7f0', mutedText: '#e5c7d9',
      primary: { type: 'gradient', colors: ['#ff6a88', '#ff99ac'], angle: 90 }, accent: '#ffd166', border: '#4a2c6b', key: '#3b2560',
      tileCorrect: '#06d6a0', tilePresent: '#ffd166', tileAbsent: '#4a3a5e',
    }),
  },
  {
    id: 'th_jade', category: 'theme', name: 'Jade Palace', rarity: 'epic', price: 500, level: 6, description: 'Jade and imperial gold.',
    theme: theme({
      background: { type: 'gradient', colors: ['#0b2a20', '#0f3d2e'], angle: 170 }, card: '#123a2c', text: '#f3eadb', mutedText: '#b9c9b8',
      primary: { type: 'gradient', colors: ['#d4a017', '#f2c94c'], angle: 90 }, accent: '#ff6b6b', border: '#1f5a43', key: '#194b39',
      tileCorrect: '#52b788', tilePresent: '#f2c94c', tileAbsent: '#2d4a3e',
    }),
  },
  {
    id: 'th_carnaval', category: 'theme', name: 'Carnaval', rarity: 'epic', price: 500, level: 6, description: 'Green, gold and samba.',
    theme: theme({
      background: { type: 'gradient', colors: ['#003d22', '#00843d', '#d9b300'], angle: 160 }, card: '#003b22', text: '#fffbe6', mutedText: '#cfe8d5',
      primary: { type: 'solid', color: '#ffd200' }, accent: '#5cc8ff', border: '#1f6b45', key: '#0f5a35',
      tileCorrect: '#3ddc84', tilePresent: '#ffd200', tileAbsent: '#2f5d47',
    }),
  },
  {
    id: 'th_neon', category: 'theme', name: 'Neon', rarity: 'epic', price: 600, level: 8,
    theme: theme({
      background: { type: 'solid', color: '#07000f' }, card: '#12001f', text: '#f5e9ff', mutedText: '#b98ad9',
      primary: { type: 'gradient', colors: ['#ff00e6', '#00f0ff'], angle: 90 }, accent: '#39ff14', border: '#3d0066', key: '#2a0047',
      tileCorrect: '#39ff14', tilePresent: '#ffe600', tileAbsent: '#33204a',
    }),
  },
  {
    id: 'th_aurora', category: 'theme', name: 'Aurora', rarity: 'legendary', price: 1200, level: 15, description: 'Northern lights over a polar night.',
    theme: theme({
      background: { type: 'gradient', colors: ['#020617', '#0f3b4c', '#3b1f5c'], angle: 160 }, card: '#0b1220', text: '#e6fffb', mutedText: '#93c5bd',
      primary: { type: 'gradient', colors: ['#2dd4bf', '#a78bfa'], angle: 90 }, accent: '#f0abfc', border: '#1e3a4a', key: '#13283a',
      tileCorrect: '#34d399', tilePresent: '#fbbf24', tileAbsent: '#334155',
    }),
  },

  /* Titles */
  { id: 'tt_learner', category: 'title', name: 'Learner', rarity: 'common', price: 0, text: 'Learner' },
  { id: 'tt_word_collector', category: 'title', name: 'Word Collector', rarity: 'common', price: 120, text: 'Word Collector' },
  { id: 'tt_night_owl', category: 'title', name: 'Night Owl', rarity: 'common', price: 120, text: 'Night Owl' },
  { id: 'tt_early_bird', category: 'title', name: 'Early Bird', rarity: 'common', price: 120, text: 'Early Bird' },
  { id: 'tt_fluentish', category: 'title', name: 'Fluent-ish', rarity: 'rare', price: 300, level: 3, text: 'Fluent-ish' },
  { id: 'tt_polyglot', category: 'title', name: 'Polyglot', rarity: 'rare', price: 300, level: 4, text: 'Polyglot' },
  { id: 'tt_grammar_guru', category: 'title', name: 'Grammar Guru', rarity: 'epic', price: 600, level: 10, text: 'Grammar Guru' },
  { id: 'tt_saudade', category: 'title', name: 'Saudade', rarity: 'epic', price: 600, level: 10, text: 'Saudade' },
  { id: 'tt_hanzi_hero', category: 'title', name: 'Hanzi Hero', rarity: 'epic', price: 700, level: 12, text: '汉字 Hero' },
  { id: 'tt_kanji_master', category: 'title', name: 'Kanji Master', rarity: 'epic', price: 700, level: 12, text: '漢字 Master' },
  { id: 'tt_legend', category: 'title', name: 'Living Legend', rarity: 'legendary', price: 1500, level: 25, text: 'Living Legend' },

  /* Name colours */
  { id: 'nc_crimson', category: 'nameColor', name: 'Crimson', rarity: 'common', price: 100, color: '#e5484d' },
  { id: 'nc_ocean', category: 'nameColor', name: 'Ocean', rarity: 'common', price: 100, color: '#1c7ed6' },
  { id: 'nc_emerald', category: 'nameColor', name: 'Emerald', rarity: 'common', price: 100, color: '#12b886' },
  { id: 'nc_violet', category: 'nameColor', name: 'Violet', rarity: 'rare', price: 200, color: '#845ef7' },
  { id: 'nc_gold', category: 'nameColor', name: 'Gold', rarity: 'rare', price: 300, level: 5, color: '#e0a800' },
  {
    id: 'nc_rainbow', category: 'nameColor', name: 'Rainbow', rarity: 'epic', price: 700, level: 10,
    color: 'linear-gradient(90deg, #ff5f6d, #ffc371, #47e891, #3fa7ff, #c56cf0)',
  },

  /* Celebrations (lesson complete) */
  { id: 'ce_confetti', category: 'celebration', name: 'Confetti', rarity: 'common', price: 0, celebration: 'confetti' },
  { id: 'ce_fireworks', category: 'celebration', name: 'Fireworks', rarity: 'rare', price: 300, celebration: 'fireworks' },
  { id: 'ce_petals', category: 'celebration', name: 'Sakura Petals', rarity: 'rare', price: 300, level: 4, celebration: 'petals' },
  { id: 'ce_lanterns', category: 'celebration', name: 'Lanterns', rarity: 'epic', price: 500, level: 8, celebration: 'lanterns' },
  { id: 'ce_coins', category: 'celebration', name: 'Coin Shower', rarity: 'epic', price: 500, level: 8, celebration: 'coins' },
  { id: 'ce_stars', category: 'celebration', name: 'Starfall', rarity: 'legendary', price: 1000, level: 15, celebration: 'stars' },

  /* Power-ups */
  {
    id: 'pw_freeze', category: 'powerup', name: 'Streak Freeze', rarity: 'common', price: 200, consumable: { max: 2 },
    description: 'Covers one missed day so your streak survives. Hold up to 2.',
  },
]

export const SHOP_ITEM_BY_ID = new Map(SHOP_CATALOG.map((i) => [i.id, i]))
export const itemsIn = (category: Category) => SHOP_CATALOG.filter((i) => i.category === category)
export const isFree = (item: ShopItem) => item.price === 0
export const isConsumable = (item: ShopItem) => !!item.consumable

export const EQUIP_SLOTS = ['theme', 'title', 'nameColor', 'celebration'] as const
export type EquipSlot = (typeof EQUIP_SLOTS)[number]
export type Equipped = Partial<Record<EquipSlot, string | null>>

/** Display cosmetics for an equipped set (unknown or mismatched ids are ignored). */
export function cosmeticsOf(equipped: Equipped | undefined): { title: string | null; nameColor: string | null } {
  const title = SHOP_ITEM_BY_ID.get(equipped?.title ?? '')
  const color = SHOP_ITEM_BY_ID.get(equipped?.nameColor ?? '')
  return {
    title: title?.category === 'title' ? title.text ?? null : null,
    nameColor: color?.category === 'nameColor' ? color.color ?? null : null,
  }
}

/* ---------- Daily deals ---------- */

export const DEAL_DISCOUNT = 0.3
export const DEAL_COUNT = 3

/** Three cosmetics from different categories at 30% off, the same for everyone, changing at midnight UTC. */
export function dailyDeals(day: number = dayNumber()): { itemId: string; price: number }[] {
  let s = (day * 2654435761) % 2147483647 || 1
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647
  const pool = SHOP_CATALOG.filter((i) => !isFree(i) && !isConsumable(i))
  const picked: ShopItem[] = []
  const used = new Set<Category>()
  for (let guard = 0; picked.length < DEAL_COUNT && guard < 500; guard++) {
    const item = pool[Math.floor(rand() * pool.length)]
    if (used.has(item.category) || picked.includes(item)) continue
    picked.push(item)
    used.add(item.category)
  }
  return picked.map((i) => ({ itemId: i.id, price: dealPrice(i) }))
}

export const dealPrice = (item: ShopItem) => Math.round((item.price * (1 - DEAL_DISCOUNT)) / 5) * 5

export function priceToday(item: ShopItem, day: number = dayNumber()): number {
  return dailyDeals(day).find((d) => d.itemId === item.id)?.price ?? item.price
}
