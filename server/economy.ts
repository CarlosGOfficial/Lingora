import { levelFromXp, levelUpCoins } from '../src/shop/catalog'
import { coinBalance } from '../src/shop/wallet'
import { sql } from './db'
import { db } from './http'

/*
 * Coins: Lingora uses Wordle Unlimited's wallet (users.coins), so coins earned studying
 * can be spent in either app. Wordle's rules for its own coins don't change.
 *
 * Everything Lingora pays goes through lingora_coin_ledger, one row per source
 * ("xp:<event id>", "level:<n>", "claim:<day>", "quest:...", "ach:...", ...), so each is
 * paid exactly once however often a device syncs. Purchases debit users.coins only if
 * the balance covers them.
 *
 * Rates are unchanged: 1 coin per XP, plus level-up and daily-reward coins. An hour of
 * study earns somewhat less than an hour of Wordle rounds, so pooling the wallets doesn't
 * inflate Wordle's shop.
 *
 * The first time someone syncs after this change, their old Lingora balance is
 * credited once ("migrate") and everything earned or bought before then is marked as
 * already settled.
 */

export const COINS_PER_XP = 1

export const ECONOMY_SCHEMA = [
  `create table if not exists lingora_coin_ledger (
    user_id text not null references users(id) on delete cascade,
    source_id text not null,
    coins int not null,
    at timestamptz not null default now(),
    primary key (user_id, source_id)
  )`,
]

export async function ensureEconomyTables(extra: string[] = []) {
  if (!sql) return
  for (const q of [...ECONOMY_SCHEMA, ...extra]) await sql.query(q).catch((err: Error) => console.warn('Economy table:', err.message))
}

/** Pay once for a source (quests, achievements, leagues, challenges). Returns what was paid (0 if already paid). */
export async function credit(uid: string, sourceId: string, coins: number): Promise<number> {
  const s = db()
  const added = await s`insert into lingora_coin_ledger (user_id, source_id, coins) values (${uid}, ${sourceId}, ${coins}) on conflict do nothing returning coins`
  if (!added.length || !coins) return 0
  await s`update users set coins = coins + ${coins} where id = ${uid}`
  return coins
}

async function migrateOnce(uid: string) {
  const s = db()
  const started = await s`insert into lingora_coin_ledger (user_id, source_id, coins) values (${uid}, 'migrate', 0) on conflict do nothing returning source_id`
  if (!started.length) return
  const [w] = await s`select
    (select coalesce(sum(xp), 0)::int from lingora_xp_events where user_id = ${uid}) as xp,
    (select coalesce(sum(coins), 0)::int from lingora_daily_claims where user_id = ${uid}) as claimed,
    (select coalesce(sum(price), 0)::int from lingora_purchases where user_id = ${uid}) as spent`
  const old = Math.max(0, coinBalance(w.xp, { purchases: [{ id: '', itemId: '', price: w.spent, at: 0 }], claims: [{ day: 0, streakDay: 1, coins: w.claimed, at: 0 }] }))
  const level = levelFromXp(w.xp)
  await s.transaction([
    s`update lingora_coin_ledger set coins = ${old} where user_id = ${uid} and source_id = 'migrate'`,
    s`insert into lingora_coin_ledger (user_id, source_id, coins) select ${uid}, 'xp:' || client_id, 0 from lingora_xp_events where user_id = ${uid} on conflict do nothing`,
    s`insert into lingora_coin_ledger (user_id, source_id, coins) select ${uid}, 'claim:' || day, 0 from lingora_daily_claims where user_id = ${uid} on conflict do nothing`,
    s`insert into lingora_coin_ledger (user_id, source_id, coins) select ${uid}, 'buy:' || client_id, 0 from lingora_purchases where user_id = ${uid} on conflict do nothing`,
    s`insert into lingora_coin_ledger (user_id, source_id, coins) select ${uid}, 'level:' || g, 0 from generate_series(2, ${Math.max(1, level)}) g on conflict do nothing`,
    s`update users set coins = coins + ${old} where id = ${uid}`,
  ])
}

/** Credit everything new since the last sync: XP events, level-ups, daily claims. */
export async function settleCoins(uid: string) {
  await migrateOnce(uid)
  const s = db()
  const xpRows = await s`insert into lingora_coin_ledger (user_id, source_id, coins)
    select ${uid}, 'xp:' || client_id, xp * ${COINS_PER_XP} from lingora_xp_events where user_id = ${uid}
    on conflict do nothing returning coins`
  const claimRows = await s`insert into lingora_coin_ledger (user_id, source_id, coins)
    select ${uid}, 'claim:' || day, coins from lingora_daily_claims where user_id = ${uid}
    on conflict do nothing returning coins`
  const [{ xp }] = await s`select coalesce(sum(xp), 0)::int as xp from lingora_xp_events where user_id = ${uid}`
  const level = levelFromXp(xp)
  let levelCoins = 0
  if (level >= 2) {
    const levels = Array.from({ length: level - 1 }, (_, i) => i + 2)
    const added = await s`insert into lingora_coin_ledger (user_id, source_id, coins)
      select ${uid}, 'level:' || l, c from unnest(${levels}::int[], ${levels.map(levelUpCoins)}::int[]) as t(l, c)
      on conflict do nothing returning coins`
    levelCoins = added.reduce((n, r) => n + r.coins, 0)
  }
  const total = [...xpRows, ...claimRows].reduce((n, r) => n + r.coins, 0) + levelCoins
  if (total) await s`update users set coins = coins + ${total} where id = ${uid}`
}

/** Spend coins on a purchase; false if the wallet doesn't cover it (or it was already paid). */
export async function chargePurchase(uid: string, purchaseId: string, price: number): Promise<boolean> {
  const s = db()
  const claimed = await s`insert into lingora_coin_ledger (user_id, source_id, coins) values (${uid}, ${'buy:' + purchaseId}, ${-price}) on conflict do nothing returning coins`
  if (!claimed.length) return false
  if (price <= 0) return true
  const paid = await s`update users set coins = coins - ${price} where id = ${uid} and coins >= ${price} returning coins`
  if (paid.length) return true
  await s`delete from lingora_coin_ledger where user_id = ${uid} and source_id = ${'buy:' + purchaseId}`
  return false
}

export async function walletOf(uid: string): Promise<number> {
  const [r] = await db()`select coins from users where id = ${uid}`
  return r?.coins ?? 0
}
