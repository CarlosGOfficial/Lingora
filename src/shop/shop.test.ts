import { describe, expect, it } from 'vitest'
import { DEFAULT_CUSTOM_THEME, isCustomTheme, parseThemeCode, themeCode } from '../theme/themes'
import { CATEGORIES, SHOP_CATALOG, SHOP_ITEM_BY_ID, dailyDeals, levelFromXp, totalLevelUpCoins, xpForLevel } from './catalog'
import { cannotBuy, coinBalance, dailyStatus, ownedItems } from './wallet'

describe('catalog', () => {
  it('has unique ids, known categories and valid theme items', () => {
    expect(SHOP_ITEM_BY_ID.size).toBe(SHOP_CATALOG.length)
    const cats = new Set(CATEGORIES.map((c) => c.id))
    for (const item of SHOP_CATALOG) {
      expect(cats.has(item.category), item.id).toBe(true)
      if (item.category === 'theme') expect(isCustomTheme(item.theme), item.id).toBe(true)
    }
  })

  it('picks 3 deals from different categories, stable per day', () => {
    const deals = dailyDeals(20_000)
    expect(deals).toHaveLength(3)
    expect(new Set(deals.map((d) => SHOP_ITEM_BY_ID.get(d.itemId)!.category)).size).toBe(3)
    expect(dailyDeals(20_000)).toEqual(deals)
  })

  it('uses the same level curve as Wordle Unlimited', () => {
    expect(xpForLevel(10)).toBe(900)
    expect(levelFromXp(899)).toBe(9)
    expect(levelFromXp(900)).toBe(10)
  })
})

describe('wallet', () => {
  it('earns coins from XP, level-ups and daily rewards; spends on purchases', () => {
    const log = { purchases: [{ id: 'a', itemId: 'tt_night_owl', price: 120, at: 1 }], claims: [{ day: 1, streakDay: 1, coins: 25, at: 1 }] }
    expect(coinBalance(200, log)).toBe(200 + totalLevelUpCoins(levelFromXp(200)) + 25 - 120)
    expect(ownedItems(log).has('tt_night_owl')).toBe(true)
    expect(ownedItems(log).has('ce_confetti')).toBe(true) // free
  })

  it('climbs the daily ladder on consecutive days and resets after a gap', () => {
    expect(dailyStatus([], 100)).toMatchObject({ claimedToday: false, streakDay: 1, reward: 25 })
    expect(dailyStatus([{ day: 99, streakDay: 1, coins: 25, at: 0 }], 100)).toMatchObject({ streakDay: 2, reward: 35 })
    expect(dailyStatus([{ day: 97, streakDay: 3, coins: 50, at: 0 }], 100).streakDay).toBe(1)
  })

  it('explains why something can’t be bought', () => {
    const item = SHOP_ITEM_BY_ID.get('th_aurora')!
    const ctx = { coins: 5000, level: 1, owned: new Set<string>(), held: () => 0 }
    expect(cannotBuy(item, ctx)).toMatch(/level 15/)
    expect(cannotBuy(SHOP_ITEM_BY_ID.get('pw_freeze')!, { ...ctx, held: () => 2 })).toMatch(/at most/)
    expect(cannotBuy(SHOP_ITEM_BY_ID.get('tt_night_owl')!, ctx)).toBeNull()
  })
})

describe('theme codes', () => {
  it('round-trips and accepts codes from Wordle Unlimited', () => {
    const code = themeCode(DEFAULT_CUSTOM_THEME)
    expect(code.startsWith('wt')).toBe(true)
    expect(parseThemeCode(code)).toEqual(DEFAULT_CUSTOM_THEME)
    const sunset = SHOP_ITEM_BY_ID.get('th_sunset')!.theme!
    expect(parseThemeCode(themeCode(sunset))).toEqual(sunset)
    expect(parseThemeCode('wtgarbage')).toBeNull()
  })
})
