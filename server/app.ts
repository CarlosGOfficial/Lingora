import { Hono, type Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { LangCode } from '../src/content/types'
import { dayKey, daysBetween, weekStart } from '../src/lib/date'
import { DAILY_REWARDS, SHOP_ITEM_BY_ID, dailyReward, dayNumber, dealPrice } from '../src/shop/catalog'
import { coinBalance } from '../src/shop/wallet'
import { bump, emptyStreak, reconcile } from '../src/store/streak'
import type { Account, LeaderboardRow, Outbox, Prefs, SavedTheme, Snapshot, SyncRequest } from '../src/sync/types'
import { MAX_SAVED_THEMES, isCustomTheme } from '../src/theme/themes'
import { USERNAME_RE, hashPassword, hashToken, newSessionToken, verifyPassword } from './auth'
import { sql, type Sql } from './db'
import { IS_PROD } from './env'

type Env = { Variables: { userId: string } }

const SESSION_COOKIE = 'lg_sid'
const SESSION_DAYS = 30
const LANGS: LangCode[] = ['zh', 'ja', 'pt']
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const MAX_EVENTS = 5000

export const app = new Hono<Env>().basePath('/api')

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status)
  console.error(err)
  return c.json({ error: 'Something went wrong on the server.' }, 500)
})

const fail = (status: 400 | 401 | 403 | 404 | 409 | 429 | 503, message: string): never => {
  throw new HTTPException(status, { message })
}

function db(): Sql {
  return sql ?? fail(503, 'The database isn’t configured yet.')
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

/* ---------- In-memory rate limits ---------- */
const hits = new Map<string, { n: number; reset: number }>()
function rateLimit(c: Context, bucket: string, max: number, windowMs: number, message: string) {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? 'local'
  const key = `${bucket}:${ip}`
  const now = Date.now()
  const h = hits.get(key)
  if (!h || h.reset < now) hits.set(key, { n: 1, reset: now + windowMs })
  else if (++h.n > max) fail(429, message)
}

/* ---------- Wordle Unlimited's friends table is optional ---------- */
let wordleFriends: boolean | null = null
async function hasWordleFriends(s: Sql) {
  if (wordleFriends === null) wordleFriends = !!(await s`select to_regclass('public.friendships') as t`)[0].t
  return wordleFriends
}

/* ---------- Sessions ---------- */
async function startSession(c: Context, userId: string) {
  const s = db()
  const token = newSessionToken()
  await s.transaction([
    s`insert into lingora_profiles (user_id) values (${userId}) on conflict do nothing`,
    s`insert into lingora_sessions (token_hash, user_id, expires_at)
      values (${hashToken(token)}, ${userId}, now() + make_interval(days => ${SESSION_DAYS}))`,
  ])
  setCookie(c, SESSION_COOKIE, token, { httpOnly: true, sameSite: 'Lax', secure: IS_PROD, path: '/', maxAge: SESSION_DAYS * 86_400 })
}

const requireUser = createMiddleware<Env>(async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) fail(401, 'Please sign in.')
  const rows = await db()`select user_id from lingora_sessions where token_hash = ${hashToken(token!)} and expires_at > now()`
  if (!rows.length) fail(401, 'Your session has expired. Please sign in again.')
  c.set('userId', rows[0].user_id as string)
  await next()
})

async function account(userId: string): Promise<Account> {
  const rows = await db()`select u.id, u.username, p.prefs from users u left join lingora_profiles p on p.user_id = u.id where u.id = ${userId}`
  if (!rows.length) fail(401, 'Account not found.')
  return { id: rows[0].id, username: rows[0].username ?? 'Learner', prefs: (rows[0].prefs ?? {}) as Prefs }
}

/** Every account needs a unique 4-digit PIN in Wordle Unlimited (its PIN login). */
async function unusedPin(s: Sql): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const pin = String(1000 + Math.floor(Math.random() * 9000))
    if (!(await s`select 1 from users where pin = ${pin}`).length) return pin
  }
  return fail(409, 'Couldn’t create the account right now. Please try again.')
}

/* ---------- Auth (shared accounts with Wordle Unlimited) ---------- */
app.get('/health', (c) => c.json({ ok: true, db: !!sql }))

app.post('/auth/signup', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const username = str(body.username).trim()
  const password = str(body.password)
  if (!USERNAME_RE.test(username)) fail(400, 'Username must be 3–20 letters, numbers or underscores.')
  if (password.length < 8 || password.length > 200) fail(400, 'Password must be at least 8 characters.')
  rateLimit(c, 'signup', 5, 3_600_000, 'Too many new accounts from this network. Try again later.')
  const s = db()
  if ((await s`select 1 from users where lower(username) = lower(${username})`).length) fail(409, 'That username is taken.')

  let rows
  try {
    rows = await s`insert into users (id, username, password_hash, first_name, pin)
      values (gen_random_uuid()::text, ${username}, ${await hashPassword(password)}, ${username}, ${await unusedPin(s)}) returning id`
  } catch (e) {
    if ((e as { code?: string }).code === '23505') fail(409, 'That username is taken.')
    throw e
  }
  await startSession(c, rows[0].id as string)
  return c.json(await account(rows[0].id as string))
})

app.post('/auth/login', async (c) => {
  rateLimit(c, 'login', 10, 900_000, 'Too many failed attempts. Try again in 15 minutes.')
  const body = await c.req.json().catch(() => ({}))
  const username = str(body.username).trim()
  const password = str(body.password)
  const rows = username ? await db()`select id, password_hash from users where lower(username) = lower(${username})` : []
  const stored = rows[0]?.password_hash as string | null | undefined
  // Hash even when there's no match, so timing doesn't reveal which usernames exist.
  const ok = stored ? await verifyPassword(password, stored) : (await hashPassword(password), false)
  if (!ok) fail(401, 'Wrong username or password.')
  await startSession(c, rows[0].id as string)
  return c.json(await account(rows[0].id as string))
})

app.post('/auth/logout', async (c) => {
  const token = getCookie(c, SESSION_COOKIE)
  if (token && sql) await sql`delete from lingora_sessions where token_hash = ${hashToken(token)}`
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
  return c.json({ ok: true })
})

app.get('/me', requireUser, async (c) => c.json(await account(c.get('userId'))))

/* ---------- Sync ---------- */

/** Push queued events, receive the full event log back. Idempotent per event id. */
app.post('/sync', requireUser, async (c) => {
  const uid = c.get('userId')
  const body = (await c.req.json().catch(() => ({}))) as Partial<SyncRequest>
  const { reviews, xp, completions, imports, purchases, claims } = validateOutbox(body.outbox)
  const s = db()

  const writes = []
  if (reviews.length)
    writes.push(s`insert into lingora_review_logs (user_id, client_id, item_id, lang, rating, at_ms)
      select ${uid}, * from unnest(${reviews.map((r) => r.id)}::text[], ${reviews.map((r) => r.itemId)}::text[],
        ${reviews.map((r) => r.lang)}::text[], ${reviews.map((r) => r.rating)}::int[], ${reviews.map((r) => r.at)}::bigint[])
      on conflict do nothing`)
  if (xp.length)
    writes.push(s`insert into lingora_xp_events (user_id, client_id, lang, xp, day, at_ms)
      select ${uid}, * from unnest(${xp.map((e) => e.id)}::text[], ${xp.map((e) => e.lang)}::text[],
        ${xp.map((e) => e.xp)}::int[], ${xp.map((e) => e.day)}::date[], ${xp.map((e) => e.at)}::bigint[])
      on conflict do nothing`)
  if (completions.length)
    writes.push(s`insert into lingora_completions (user_id, ref_id, lang, kind, at_ms)
      select ${uid}, * from unnest(${completions.map((e) => e.refId)}::text[], ${completions.map((e) => e.lang)}::text[],
        ${completions.map((e) => e.kind)}::text[], ${completions.map((e) => e.at)}::bigint[])
      on conflict do nothing`)
  if (imports.length)
    writes.push(s`insert into lingora_card_imports (user_id, item_id, lang, state)
      select ${uid}, i, l, st::jsonb from unnest(${imports.map((e) => e.itemId)}::text[], ${imports.map((e) => e.lang)}::text[],
        ${imports.map((e) => JSON.stringify(e.state))}::text[]) as t(i, l, st)
      on conflict (user_id, item_id) do update set state = excluded.state
      where coalesce((excluded.state->>'lastReview')::bigint, 0) > coalesce((lingora_card_imports.state->>'lastReview')::bigint, 0)`)
  if (claims.length)
    writes.push(s`insert into lingora_daily_claims (user_id, day, streak_day, coins, at_ms)
      select ${uid}, * from unnest(${claims.map((e) => e.day)}::int[], ${claims.map((e) => e.streakDay)}::int[],
        ${claims.map((e) => e.coins)}::int[], ${claims.map((e) => e.at)}::bigint[])
      on conflict do nothing`)
  if (body.prefs && typeof body.prefs === 'object' && JSON.stringify(body.prefs).length < 20_000)
    writes.push(s`update lingora_profiles set prefs = ${JSON.stringify(body.prefs)}::jsonb where user_id = ${uid}`)
  if (writes.length) await s.transaction(writes)

  // Purchases go in last, in time order, and only while the wallet covers them, so a
  // modified client can't spend coins it never earned (rejected ones vanish on sync).
  if (purchases.length) {
    const [w] = await s`select
      (select coalesce(sum(xp), 0)::int from lingora_xp_events where user_id = ${uid}) as xp,
      (select coalesce(sum(coins), 0)::int from lingora_daily_claims where user_id = ${uid}) as claimed,
      (select coalesce(sum(price), 0)::int from lingora_purchases where user_id = ${uid}) as spent`
    const known = new Set((await s`select client_id from lingora_purchases where user_id = ${uid}`).map((r) => r.client_id))
    let balance = coinBalance(w.xp, { purchases: [{ id: '', itemId: '', price: w.spent, at: 0 }], claims: [{ day: 0, streakDay: 1, coins: w.claimed, at: 0 }] })
    for (const p of [...purchases].sort((x, y) => x.at - y.at)) {
      if (known.has(p.id) || p.price > balance) continue
      const added = await s`insert into lingora_purchases (user_id, client_id, item_id, price, at_ms)
        values (${uid}, ${p.id}, ${p.itemId}, ${p.price}, ${p.at}) on conflict do nothing returning client_id`
      if (added.length) balance -= p.price
    }
  }

  const [acct, reviewRows, importRows, xpRows, completionRows, purchaseRows, claimRows] = await Promise.all([
    account(uid),
    s`select client_id, item_id, lang, rating, at_ms from lingora_review_logs where user_id = ${uid} order by at_ms, client_id`,
    s`select item_id, lang, state from lingora_card_imports where user_id = ${uid}`,
    s`select lang, to_char(day, 'YYYY-MM-DD') as day, sum(xp)::int as xp from lingora_xp_events where user_id = ${uid} group by lang, day`,
    s`select ref_id, lang, kind, at_ms from lingora_completions where user_id = ${uid}`,
    s`select client_id, item_id, price, at_ms from lingora_purchases where user_id = ${uid} order by at_ms`,
    s`select day, streak_day, coins, at_ms from lingora_daily_claims where user_id = ${uid} order by day`,
  ])
  const snapshot: Snapshot = {
    account: acct,
    reviews: reviewRows.map((r) => ({ id: r.client_id, itemId: r.item_id, lang: r.lang, rating: r.rating, at: Number(r.at_ms) })),
    imports: importRows.map((r) => ({ itemId: r.item_id, lang: r.lang, state: r.state })),
    xp: xpRows.map((r) => ({ lang: r.lang, day: r.day, xp: r.xp })),
    completions: completionRows.map((r) => ({ refId: r.ref_id, lang: r.lang, kind: r.kind, at: Number(r.at_ms) })),
    purchases: purchaseRows.map((r) => ({ id: r.client_id, itemId: r.item_id, price: r.price, at: Number(r.at_ms) })),
    claims: claimRows.map((r) => ({ day: r.day, streakDay: r.streak_day, coins: r.coins, at: Number(r.at_ms) })),
  }
  return c.json(snapshot)
})

/* ---------- Friends ---------- */

function cosmetics(prefs: Prefs | null) {
  const eq = ((prefs?.appearance as { equipped?: Record<string, string> } | undefined)?.equipped ?? {}) as Record<string, string>
  const title = SHOP_ITEM_BY_ID.get(eq.title)
  const color = SHOP_ITEM_BY_ID.get(eq.nameColor)
  return { title: title?.category === 'title' ? title.text ?? null : null, nameColor: color?.category === 'nameColor' ? color.color ?? null : null }
}

app.get('/friends', requireUser, async (c) => {
  const uid = c.get('userId')
  const q = c.req.query('today') ?? ''
  const today = DAY_RE.test(q) ? q : dayKey()
  const s = db()

  const mine = (await s`select friend_id from lingora_friendships where user_id = ${uid}`).map((r) => r.friend_id as string)
  // Accepted friends from Wordle Unlimited count too (read-only; managed in Wordle).
  const fromWordle = (await hasWordleFriends(s))
    ? (
        await s`select case when requester_id = ${uid} then addressee_id else requester_id end as id
          from friendships where status = 'accepted' and (requester_id = ${uid} or addressee_id = ${uid})`
      ).map((r) => r.id as string)
    : []
  const ids = [...new Set([uid, ...mine, ...fromWordle])]
  // Only people who have opened Lingora (they have a profile) are on the board.
  const people = await s`select u.id, u.username, p.prefs from users u join lingora_profiles p on p.user_id = u.id where u.id = any(${ids}::text[])`
  const days = await s`select user_id, to_char(day, 'YYYY-MM-DD') as day, sum(xp)::int as xp from lingora_xp_events
    where user_id = any(${ids}::text[]) group by user_id, day order by day`

  const start = weekStart(today)
  const rows: LeaderboardRow[] = people.map((p) => {
    const active = days.filter((d) => d.user_id === p.id && d.xp > 0)
    let streak = emptyStreak()
    for (const d of active) if (daysBetween(d.day, today) >= 0) streak = bump(streak, d.day)
    const lang = (p.prefs as Prefs | null)?.activeLang
    return {
      username: p.username ?? 'Learner',
      weeklyXp: active.filter((d) => daysBetween(start, d.day) >= 0 && daysBetween(d.day, today) >= 0).reduce((n, d) => n + d.xp, 0),
      streak: reconcile(streak, today).current,
      lang: lang && LANGS.includes(lang) ? lang : 'zh',
      me: p.id === uid,
      via: p.id === uid || mine.includes(p.id) ? 'lingora' : 'wordle',
      ...cosmetics(p.prefs as Prefs | null),
    }
  })
  return c.json(rows.sort((a, b) => b.weeklyXp - a.weeklyXp))
})

app.post('/friends', requireUser, async (c) => {
  const uid = c.get('userId')
  const username = str((await c.req.json().catch(() => ({}))).username).trim()
  if (!USERNAME_RE.test(username)) fail(400, 'Enter their username.')
  const s = db()
  const rows = await s`select id from users where lower(username) = lower(${username})`
  if (!rows.length) fail(404, `No one is called “${username}”. Check the spelling.`)
  const fid = rows[0].id as string
  if (fid === uid) fail(400, 'That’s you!')
  // Friendships are mutual: both learners see each other on their boards.
  await s.transaction([
    s`insert into lingora_friendships (user_id, friend_id) values (${uid}, ${fid}) on conflict do nothing`,
    s`insert into lingora_friendships (user_id, friend_id) values (${fid}, ${uid}) on conflict do nothing`,
  ])
  return c.json({ ok: true })
})

app.delete('/friends/:username', requireUser, async (c) => {
  const uid = c.get('userId')
  const s = db()
  const rows = await s`select id from users where lower(username) = lower(${c.req.param('username')})`
  if (rows.length) {
    await s`delete from lingora_friendships where (user_id = ${uid} and friend_id = ${rows[0].id}) or (user_id = ${rows[0].id} and friend_id = ${uid})`
  }
  return c.json({ ok: true })
})

/* ---------- Saved themes (the same table and shape as Wordle Unlimited) ---------- */

const toSaved = (r: Record<string, unknown>): SavedTheme => ({
  id: String(r.id),
  name: r.name as string,
  theme: r.data as SavedTheme['theme'],
  updatedAt: new Date(r.updated_at as string).toISOString(),
})

function themeName(v: unknown): string {
  const name = str(v).trim()
  if (!name) fail(400, 'Give your theme a name.')
  if (name.length > 30) fail(400, 'Names can be up to 30 characters.')
  return name
}

app.get('/themes', requireUser, async (c) => {
  const rows = await db()`select id, name, data, updated_at from saved_themes where user_id = ${c.get('userId')} order by id`
  return c.json(rows.map(toSaved))
})

app.post('/themes', requireUser, async (c) => {
  const uid = c.get('userId')
  const body = await c.req.json().catch(() => ({}))
  const name = themeName(body.name)
  if (!isCustomTheme(body.theme)) fail(400, 'That theme isn’t valid.')
  const s = db()
  const [{ n }] = await s`select count(*)::int as n from saved_themes where user_id = ${uid}`
  if (n >= MAX_SAVED_THEMES) fail(409, `All ${MAX_SAVED_THEMES} slots are full. Delete or update one first.`)
  const [row] = await s`insert into saved_themes (user_id, name, data) values (${uid}, ${name}, ${JSON.stringify(body.theme)}::jsonb)
    returning id, name, data, updated_at`
  return c.json(toSaved(row), 201)
})

app.patch('/themes/:id', requireUser, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) fail(404, 'Saved theme not found.')
  const body = await c.req.json().catch(() => ({}))
  const name = body.name !== undefined ? themeName(body.name) : null
  if (body.theme !== undefined && !isCustomTheme(body.theme)) fail(400, 'That theme isn’t valid.')
  const data = body.theme !== undefined ? JSON.stringify(body.theme) : null
  const rows = await db()`update saved_themes set name = coalesce(${name}, name), data = coalesce(${data}::jsonb, data), updated_at = now()
    where id = ${id} and user_id = ${c.get('userId')} returning id, name, data, updated_at`
  if (!rows.length) fail(404, 'Saved theme not found.')
  return c.json(toSaved(rows[0]))
})

app.delete('/themes/:id', requireUser, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id)) fail(404, 'Saved theme not found.')
  const rows = await db()`delete from saved_themes where id = ${id} and user_id = ${c.get('userId')} returning id`
  if (!rows.length) fail(404, 'Saved theme not found.')
  return c.json({ ok: true })
})

/* ---------- Validation ---------- */
function validateOutbox(raw: unknown): Outbox {
  const o = (raw ?? {}) as Partial<Outbox>
  const arr = <T>(v: T[] | undefined): T[] => {
    if (v === undefined) return []
    if (!Array.isArray(v) || v.length > MAX_EVENTS) fail(400, 'Invalid sync payload.')
    return v
  }
  const lang = (l: unknown) => LANGS.includes(l as LangCode)
  const time = (t: unknown) => typeof t === 'number' && Number.isFinite(t) && t > 0
  const id = (v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= 200
  const int = (v: unknown) => Number.isInteger(v)
  const today = dayNumber()
  const out: Outbox = {
    reviews: arr(o.reviews),
    xp: arr(o.xp),
    completions: arr(o.completions),
    imports: arr(o.imports),
    purchases: arr(o.purchases),
    claims: arr(o.claims),
  }
  const ok =
    out.reviews.every((r) => id(r.id) && id(r.itemId) && lang(r.lang) && [1, 2, 3, 4].includes(r.rating) && time(r.at)) &&
    out.xp.every((e) => id(e.id) && lang(e.lang) && int(e.xp) && e.xp >= 0 && e.xp <= 1000 && DAY_RE.test(e.day) && time(e.at)) &&
    out.completions.every((e) => id(e.refId) && lang(e.lang) && (e.kind === 'lesson' || e.kind === 'reading') && time(e.at)) &&
    out.imports.every((e) => id(e.itemId) && lang(e.lang) && e.state && typeof e.state === 'object' && typeof e.state.stability === 'number') &&
    // A purchase must name a real item and pay at least its deal price.
    out.purchases.every((p) => {
      const item = SHOP_ITEM_BY_ID.get(p.itemId)
      return id(p.id) && !!item && item.price > 0 && int(p.price) && p.price >= dealPrice(item) && p.price <= item.price && time(p.at)
    }) &&
    out.claims.every((cl) => int(cl.day) && cl.day <= today + 1 && cl.day > today - 400 && int(cl.streakDay) && cl.streakDay >= 1 && DAILY_REWARDS.includes(cl.coins) && cl.coins === dailyReward(cl.streakDay) && time(cl.at))
  if (!ok) fail(400, 'Invalid sync payload.')
  return out
}
