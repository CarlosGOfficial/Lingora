import { Hono, type Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import type { LangCode } from '../src/content/types'
import { DAILY_REWARDS, SHOP_ITEM_BY_ID, dailyReward, dayNumber, dealPrice } from '../src/shop/catalog'
import { buy, settleCoins, walletOf } from './economy'
import type { Account, Outbox, Prefs, SavedTheme, Snapshot, SyncRequest } from '../src/sync/types'
import { MAX_SAVED_THEMES, isCustomTheme } from '../src/theme/themes'
import Anthropic from '@anthropic-ai/sdk'
import type { ChatRequest } from '../src/chat/types'
import { USERNAME_RE, hashPassword, hashToken, newSessionToken, verifyPassword } from './auth'
import { chatEnabled, chatTurn, validateChat } from './chat'
import { sql, type Sql } from './db'
import { IS_PROD } from './env'
import { FailureLimiter, SESSION_COOKIE, clientIp, currentUserId, db, fail, rateLimit, requireUser, str, type Env } from './http'
import { registerPushRoutes } from './push'
import { registerSocialRoutes } from './social'
import { registerBanterRoutes } from './banter'
import { checkAchievements, registerGoalRoutes } from './goals'

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

/** Admins are flagged in the shared users table, managed from Wordle Unlimited's admin console. */
async function isAdmin(userId: string | null): Promise<boolean> {
  if (!userId || !sql) return false
  const rows = await sql`select is_admin from users where id = ${userId}`
  return rows[0]?.is_admin === true
}

async function account(userId: string): Promise<Account> {
  const rows = await db()`select u.id, u.username, u.first_name, u.pin, u.password_hash is not null as has_password, p.prefs
    from users u left join lingora_profiles p on p.user_id = u.id where u.id = ${userId}`
  if (!rows.length) fail(401, 'Account not found.')
  const r = rows[0]
  return { id: r.id, username: r.username ?? r.first_name ?? 'Learner', prefs: (r.prefs ?? {}) as Prefs, pin: r.pin ?? null, hasPassword: !!r.has_password }
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

// Wordle Unlimited's 4-digit PIN sign-in (same rules as Wordle and Banter). PINs are short,
// so wrong guesses are capped per network and across the whole site.
const pinFailsPerIp = new FailureLimiter(5, 15 * 60_000)
const pinFailsGlobal = new FailureLimiter(100, 60 * 60_000)

app.post('/auth/login-pin', async (c) => {
  const ip = clientIp(c)
  if (pinFailsPerIp.blocked(ip)) fail(429, 'Too many wrong PINs. Try again in 15 minutes.')
  if (pinFailsGlobal.blocked('all')) fail(429, 'PIN sign-in is paused for now. Log in with your username and password.')
  const body = await c.req.json().catch(() => ({}))
  const pin = str(body.pin).trim()
  if (!/^\d{4}$/.test(pin)) fail(400, 'PINs are 4 digits.')
  const rows = await db()`select id from users where pin = ${pin}`
  if (!rows.length) {
    pinFailsPerIp.fail(ip)
    pinFailsGlobal.fail('all')
    fail(401, 'Wrong PIN.')
  }
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

  // Coins live in the shared wallet (users.coins, Wordle's). Pay what's new, then charge
  // purchases in time order, only while the wallet covers them (rejected ones vanish on sync).
  await settleCoins(uid)
  // New achievements (and their coins), worked out from what just synced.
  await checkAchievements(uid, xp.length ? xp[xp.length - 1].day : new Date().toISOString().slice(0, 10)).catch((err) => console.warn('Achievements:', err))
  if (purchases.length) {
    const known = new Set((await s`select client_id from lingora_purchases where user_id = ${uid}`).map((r) => r.client_id))
    for (const p of [...purchases].sort((x, y) => x.at - y.at)) {
      if (!known.has(p.id)) await buy(uid, p)
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
    wallet: await walletOf(uid),
    reviews: reviewRows.map((r) => ({ id: r.client_id, itemId: r.item_id, lang: r.lang, rating: r.rating, at: Number(r.at_ms) })),
    imports: importRows.map((r) => ({ itemId: r.item_id, lang: r.lang, state: r.state })),
    xp: xpRows.map((r) => ({ lang: r.lang, day: r.day, xp: r.xp })),
    completions: completionRows.map((r) => ({ refId: r.ref_id, lang: r.lang, kind: r.kind, at: Number(r.at_ms) })),
    purchases: purchaseRows.map((r) => ({ id: r.client_id, itemId: r.item_id, price: r.price, at: Number(r.at_ms) })),
    claims: claimRows.map((r) => ({ day: r.day, streakDay: r.streak_day, coins: r.coins, at: Number(r.at_ms) })),
  }
  return c.json(snapshot)
})

/* ---------- Resetting progress ---------- */

// { lang } restarts one course (its lessons and review history; XP, coins and streak stay).
// {} erases everything Lingora stores for you. Your account, friends and chats are
// shared with Wordle Unlimited and are never touched.
app.post('/progress/reset', requireUser, async (c) => {
  const uid = c.get('userId')
  const body = await c.req.json().catch(() => ({}))
  const lang = body.lang === undefined ? null : LANGS.includes(body.lang) ? (body.lang as LangCode) : fail(400, 'Unknown course.')
  rateLimit(c, `reset:${uid}`, 10, 3_600_000, 'Too many resets. Try again later.')
  const s = db()
  await s.transaction(
    lang
      ? [
          s`delete from lingora_review_logs where user_id = ${uid} and lang = ${lang}`,
          s`delete from lingora_card_imports where user_id = ${uid} and lang = ${lang}`,
          s`delete from lingora_completions where user_id = ${uid} and lang = ${lang}`,
        ]
      : [
          s`delete from lingora_review_logs where user_id = ${uid}`,
          s`delete from lingora_card_imports where user_id = ${uid}`,
          s`delete from lingora_completions where user_id = ${uid}`,
          s`delete from lingora_xp_events where user_id = ${uid}`,
          s`delete from lingora_purchases where user_id = ${uid}`,
          s`delete from lingora_daily_claims where user_id = ${uid}`,
          s`update lingora_profiles set prefs = '{}'::jsonb where user_id = ${uid}`,
        ],
  )
  return c.json({ ok: true })
})

/* ---------- Friends, chats and groups: server/social.ts ---------- */
registerSocialRoutes(app)
registerBanterRoutes(app)
registerGoalRoutes(app)
registerPushRoutes(app)

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

/* ---------- AI conversation partner ---------- */

// Admin-only while in testing (the same admins as Wordle Unlimited).
app.get('/chat/status', async (c) => c.json({ enabled: chatEnabled && (await isAdmin(await currentUserId(c))) }))

app.post('/chat', requireUser, async (c) => {
  if (!chatEnabled) fail(503, 'Conversation practice isn’t set up on this server yet.')
  const uid = c.get('userId')
  if (!(await isAdmin(uid))) fail(403, 'Conversation practice isn’t available yet.')
  rateLimit(c, `chat-burst:${uid}`, 30, 600_000, 'You’re chatting fast! Take a short break and try again in a few minutes.')
  rateLimit(c, `chat-day:${uid}`, 300, 86_400_000, 'You’ve reached today’s conversation limit. Come back tomorrow!')
  let body: ChatRequest
  try {
    body = validateChat(await c.req.json().catch(() => null))
  } catch {
    return fail(400, 'That message couldn’t be sent. Try something shorter.')
  }
  try {
    return c.json(await chatTurn(body))
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) fail(429, 'The conversation partner is busy right now. Try again in a moment.')
    if ((e as Error).message === 'refusal') fail(502, 'Your partner couldn’t reply to that. Try saying it another way.')
    console.error('chat failed:', e)
    return fail(502, 'Your partner didn’t answer. Try again.')
  }
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
    out.completions.every((e) => id(e.refId) && lang(e.lang) && (e.kind === 'lesson' || e.kind === 'reading' || e.kind === 'story') && time(e.at)) &&
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
