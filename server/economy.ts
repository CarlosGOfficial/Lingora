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

/*
 * Every payment is ONE SQL statement: the ledger row and the wallet change commit
 * together or not at all. (Two statements could record a payment whose coins never
 * arrived, and the ledger would then refuse to pay it again.)
 */

/** Pay once for a source (quests, achievements, leagues, challenges). Returns what was paid (0 if already paid). */
export async function credit(uid: string, sourceId: string, coins: number): Promise<number> {
  const [r] = await db()`
    with paid as (
      insert into lingora_coin_ledger (user_id, source_id, coins) values (${uid}, ${sourceId}, ${coins})
      on conflict do nothing returning coins
    ), wallet as (
      update users set coins = coins + (select coins from paid) where id = ${uid} and exists (select 1 from paid) and ${coins}::int <> 0
    )
    select coalesce((select coins from paid), 0)::int as coins`
  return r?.coins ?? 0
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
  const [{ xp }] = await s`select coalesce(sum(xp), 0)::int as xp from lingora_xp_events where user_id = ${uid}`
  const level = levelFromXp(xp)
  const levels = level >= 2 ? Array.from({ length: level - 1 }, (_, i) => i + 2) : []
  await s`
    with due as (
      select 'xp:' || client_id as source_id, xp * ${COINS_PER_XP} as coins from lingora_xp_events where user_id = ${uid}
      union all
      select 'claim:' || day, coins from lingora_daily_claims where user_id = ${uid}
      union all
      select 'level:' || l, c from unnest(${levels}::int[], ${levels.map(levelUpCoins)}::int[]) as t(l, c)
    ), paid as (
      insert into lingora_coin_ledger (user_id, source_id, coins) select ${uid}, source_id, coins from due
      on conflict do nothing returning coins
    )
    update users set coins = coins + (select sum(coins) from paid)
    where id = ${uid} and (select coalesce(sum(coins), 0) from paid) <> 0`
}

export type Purchase = { id: string; itemId: string; price: number; at: number }

/**
 * Buy something: in one statement, record the charge in the ledger, take the coins from
 * the wallet and record the purchase. False if the wallet doesn't cover it, the item can
 * only be owned once and is already owned, or this purchase was already handled.
 */
export async function buy(uid: string, p: Purchase): Promise<boolean> {
  const s = db()
  const source = `buy:${p.id}`
  const [r] = await s`
    with charge as (
      insert into lingora_coin_ledger (user_id, source_id, coins)
      select ${uid}, ${source}, ${-p.price}
      where (select coins from users where id = ${uid}) >= ${p.price}
        and (${p.itemId} like 'pw\\_%' or not exists (select 1 from lingora_purchases where user_id = ${uid} and item_id = ${p.itemId}))
      on conflict do nothing returning coins
    ), wallet as (
      update users set coins = coins - ${p.price}
      where id = ${uid} and coins >= ${p.price} and exists (select 1 from charge) returning 1
    ), item as (
      insert into lingora_purchases (user_id, client_id, item_id, price, at_ms)
      select ${uid}, ${p.id}, ${p.itemId}, ${p.price}, ${p.at} where exists (select 1 from wallet)
      returning 1
    )
    select exists (select 1 from charge) as charged, exists (select 1 from item) as bought`.catch((err: { code?: string }) => {
    // Bought the same once-only item twice at the same moment: the second one rolls back.
    if (err?.code === '23505') return [{ charged: false, bought: false }]
    throw err
  })
  if (r.bought) return true
  // Another purchase took the coins between our check and our debit: nothing was taken
  // and nothing recorded, so drop the charge row and let this purchase be refused.
  if (r.charged) await s`delete from lingora_coin_ledger where user_id = ${uid} and source_id = ${source}`
  return false
}

export async function walletOf(uid: string): Promise<number> {
  const [r] = await db()`select coins from users where id = ${uid}`
  return r?.coins ?? 0
}
