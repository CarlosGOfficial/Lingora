/**
 * The wallet is derived, never stored: coins = XP earned + level-up bonuses + daily
 * rewards − purchases. Purchases and claims are events like reviews, so the balance
 * works offline and is identical on every synced device.
 */
import {
  COINS_PER_XP,
  dailyReward,
  dayNumber,
  isConsumable,
  isFree,
  levelFromXp,
  priceToday,
  SHOP_CATALOG,
  totalLevelUpCoins,
  type ShopItem,
} from './catalog'

export interface Purchase {
  id: string
  itemId: string
  price: number
  at: number
}

export interface DailyClaim {
  /** UTC day number. */
  day: number
  streakDay: number
  coins: number
  at: number
}

export interface ShopLog {
  purchases: Purchase[]
  claims: DailyClaim[]
}

export const emptyShopLog = (): ShopLog => ({ purchases: [], claims: [] })

export const totalXp = (xpByDay: Record<string, number>) => Object.values(xpByDay).reduce((a, b) => a + b, 0)

export function coinBalance(xp: number, log: ShopLog): number {
  const earned = xp * COINS_PER_XP + totalLevelUpCoins(levelFromXp(xp)) + log.claims.reduce((n, c) => n + c.coins, 0)
  return earned - log.purchases.reduce((n, p) => n + p.price, 0)
}

/** Cosmetics owned: everything bought plus the free items. */
export function ownedItems(log: ShopLog): Set<string> {
  const owned = new Set(SHOP_CATALOG.filter(isFree).map((i) => i.id))
  for (const p of log.purchases) owned.add(p.itemId)
  return owned
}

/** Where the daily ladder stands today (it resets if a day is skipped). */
export function dailyStatus(claims: DailyClaim[], today = dayNumber()) {
  const last = claims.reduce<DailyClaim | null>((best, c) => (!best || c.day > best.day ? c : best), null)
  const claimedToday = last?.day === today
  const streakDay = claimedToday ? last!.streakDay : last?.day === today - 1 ? last.streakDay + 1 : 1
  return { claimedToday, streakDay, reward: dailyReward(streakDay) }
}

export interface BuyContext {
  coins: number
  level: number
  owned: Set<string>
  /** How many of each consumable are currently held. */
  held: (itemId: string) => number
}

/** Why an item can't be bought right now, or null if it can. */
export function cannotBuy(item: ShopItem, ctx: BuyContext): string | null {
  if (isFree(item)) return 'Free — already yours.'
  if (!isConsumable(item) && ctx.owned.has(item.id)) return 'Owned.'
  if (item.consumable && ctx.held(item.id) >= item.consumable.max) return `You can hold ${item.consumable.max} at most.`
  if (item.level && ctx.level < item.level) return `Reach level ${item.level} to unlock.`
  const price = priceToday(item)
  if (ctx.coins < price) return `You need ${price - ctx.coins} more coins.`
  return null
}
