import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { levelFromXp, levelProgress } from './catalog'
import { coinBalance, dailyStatus, ownedItems, totalXp, type BuyContext } from './wallet'

/** Coins, level, owned items and daily reward status, derived from the store. */
export function useWallet() {
  const xpByDay = useStore((s) => s.xpByDay)
  const shop = useStore((s) => s.shop)
  const freezes = useStore((s) => s.streak.freezes)
  return useMemo(() => {
    const xp = totalXp(xpByDay)
    const ctx: BuyContext = {
      coins: coinBalance(xp, shop),
      level: levelFromXp(xp),
      owned: ownedItems(shop),
      held: (id) => (id === 'pw_freeze' ? freezes : 0),
    }
    return { ...ctx, xp, progress: levelProgress(xp), daily: dailyStatus(shop.claims) }
  }, [xpByDay, shop, freezes])
}
