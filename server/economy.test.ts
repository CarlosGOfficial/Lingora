/*
 * The coin wallet against a real Postgres. Skipped unless TEST_DATABASE_URL points at a
 * throwaway database (tables are created, and test users removed, as it runs):
 *
 *   TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/lingora_test npm test
 *
 * Production uses Neon's HTTP driver; here a small stand-in with the same tagged-template
 * interface runs the very same SQL through `pg`.
 */
import pg from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const URL = process.env.TEST_DATABASE_URL
const pool = URL ? new pg.Pool({ connectionString: URL, max: 8 }) : null

/** Neon-style `sql` (tagged template, .query, .transaction) on top of a pg pool. */
function neonLike(p: pg.Pool) {
  type Q = { text: string; params: unknown[] } & PromiseLike<any[]> & { catch: (f: (e: any) => any) => Promise<any> }
  const query = (text: string, params: unknown[] = []) => p.query(text, params).then((r) => r.rows)
  const tag = (strings: TemplateStringsArray, ...values: unknown[]): Q => {
    const text = strings.reduce((out, s, i) => out + s + (i < values.length ? `$${i + 1}` : ''), '')
    const run = () => query(text, values)
    return { text, params: values, then: (a, b) => run().then(a, b), catch: (f) => run().catch(f) }
  }
  return Object.assign(tag, {
    query,
    async transaction(qs: Q[]) {
      const c = await p.connect()
      try {
        await c.query('begin')
        const out = []
        for (const q of qs) out.push((await c.query(q.text, q.params)).rows)
        await c.query('commit')
        return out
      } catch (err) {
        await c.query('rollback')
        throw err
      } finally {
        c.release()
      }
    },
  })
}

vi.mock('./db', () => ({ sql: pool ? neonLike(pool) : null }))

const { SCHEMA } = await import('./schema')
const { GOALS_SCHEMA } = await import('./goals')
const { buy, credit, settleCoins, walletOf } = await import('./economy')
const { levelFromXp, levelUpCoins } = await import('../src/shop/catalog')

const q = async (text: string, params: unknown[] = []) => (await pool!.query(text, params)).rows
const users: string[] = []
let uid = ''
const ledgerSum = async (id: string) => (await q(`select coalesce(sum(coins), 0)::int as n from lingora_coin_ledger where user_id = $1`, [id]))[0].n

/** Wallet writes for users listed in lingora_test_broken fail, like a dropped connection would. */
async function installBreaker() {
  await q(`create table if not exists lingora_test_broken (user_id text primary key)`)
  await q(`create or replace function lingora_test_break() returns trigger language plpgsql as $$
    begin
      if exists (select 1 from lingora_test_broken where user_id = new.id) then raise exception 'wallet write failed'; end if;
      return new;
    end $$`)
  await q(`drop trigger if exists lingora_test_break on users`)
  await q(`create trigger lingora_test_break before update on users for each row execute function lingora_test_break()`)
}

describe.skipIf(!pool)('coin wallet (Postgres)', () => {
  beforeAll(async () => {
    for (const s of [...SCHEMA, ...GOALS_SCHEMA]) await q(s)
    await installBreaker()
  })
  beforeEach(async () => {
    uid = `test-${Math.random().toString(36).slice(2, 10)}`
    users.push(uid)
    await q(`insert into users (id, username, coins) values ($1, $2, 0)`, [uid, uid])
  })
  afterAll(async () => {
    if (pool) {
      await q(`drop trigger if exists lingora_test_break on users`).catch(() => {})
      await q(`drop table if exists lingora_test_broken`).catch(() => {})
      await q(`delete from users where id = any($1)`, [users]).catch(() => {})
    }
    await pool?.end().catch(() => {})
  })

  it('credit pays a source exactly once, even when called at the same time', async () => {
    const paid = await Promise.all(Array.from({ length: 8 }, () => credit(uid, 'quest:test', 40)))
    expect(paid.filter((n) => n === 40)).toHaveLength(1)
    expect(paid.filter((n) => n === 0)).toHaveLength(7)
    expect(await walletOf(uid)).toBe(40)
    expect(await ledgerSum(uid)).toBe(40)
  })

  it('settleCoins pays XP, daily claims and level-ups once', async () => {
    await q(`insert into lingora_xp_events (user_id, client_id, lang, xp, day, at_ms) values ($1, 'a', 'ja', 120, '2026-01-01', 1), ($1, 'b', 'ja', 30, '2026-01-02', 2)`, [uid])
    await q(`insert into lingora_daily_claims (user_id, day, streak_day, coins, at_ms) values ($1, 100, 1, 25, 1)`, [uid])
    await settleCoins(uid)
    let levelCoins = 0
    for (let l = 2; l <= levelFromXp(150); l++) levelCoins += levelUpCoins(l)
    const expected = 150 + 25 + levelCoins
    expect(await walletOf(uid)).toBe(expected)
    await Promise.all([settleCoins(uid), settleCoins(uid), settleCoins(uid)])
    expect(await walletOf(uid)).toBe(expected)
    expect(await ledgerSum(uid)).toBe(expected)
  })

  it('buy takes the coins and records the item together; never twice, never below zero', async () => {
    await credit(uid, 'gift', 500)
    expect(await buy(uid, { id: 'p1', itemId: 'th_midnight', price: 150, at: 1 })).toBe(true)
    expect(await buy(uid, { id: 'p1', itemId: 'th_midnight', price: 150, at: 1 })).toBe(false) // same purchase again
    expect(await buy(uid, { id: 'p2', itemId: 'th_midnight', price: 150, at: 2 })).toBe(false) // already owned
    expect(await buy(uid, { id: 'p3', itemId: 'pw_freeze', price: 200, at: 3 })).toBe(true) // power-ups stack
    expect(await buy(uid, { id: 'p4', itemId: 'pw_freeze', price: 200, at: 4 })).toBe(false) // 150 left
    expect(await walletOf(uid)).toBe(150)
    expect((await q(`select client_id from lingora_purchases where user_id = $1 order by client_id`, [uid])).map((r) => r.client_id)).toEqual(['p1', 'p3'])
    expect(await ledgerSum(uid)).toBe(150)
  })

  it('buying many things at once never overspends', async () => {
    await credit(uid, 'gift', 600)
    const ok = await Promise.all(Array.from({ length: 10 }, (_, i) => buy(uid, { id: `c${i}`, itemId: 'pw_freeze', price: 200, at: i })))
    expect(ok.filter(Boolean)).toHaveLength(3)
    expect(await walletOf(uid)).toBe(0)
    expect(await ledgerSum(uid)).toBe(0)
    expect((await q(`select count(*)::int as n from lingora_purchases where user_id = $1`, [uid]))[0].n).toBe(3)
  })

  it('a failed wallet write leaves no payment behind, so a retry pays', async () => {
    await q(`insert into lingora_xp_events (user_id, client_id, lang, xp, day, at_ms) values ($1, 'x', 'pt', 10, '2026-01-01', 1)`, [uid])
    await q(`insert into lingora_test_broken values ($1)`, [uid])
    await expect(credit(uid, 'quest:broken', 30)).rejects.toThrow(/wallet write failed/)
    await expect(settleCoins(uid)).rejects.toThrow(/wallet write failed/)
    await credit(uid, 'gift', 0) // zero-coin sources don't touch the wallet
    // Nothing that failed is marked as paid...
    expect((await q(`select source_id from lingora_coin_ledger where user_id = $1 and source_id not in ('migrate', 'gift')`, [uid]))).toEqual([])
    // ...so once the wallet works again, a retry pays everything, once.
    await q(`delete from lingora_test_broken where user_id = $1`, [uid])
    expect(await credit(uid, 'quest:broken', 30)).toBe(30)
    await settleCoins(uid)
    await settleCoins(uid)
    expect(await walletOf(uid)).toBe(40)
    expect(await ledgerSum(uid)).toBe(40)
  })
})
