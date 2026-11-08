import type { Hono } from 'hono'
import { randomInt } from 'crypto'
import type { Sql } from './db'
import { db, fail, rateLimit, requireUser, str, type Env } from './http'
import { credit } from './economy'
import { notify } from './push'
import { blockedBetween } from './blocks'
import { areFriends } from './social'
import type { LangCode } from '../src/content/types'
import { DUEL_COINS, DUEL_QUESTIONS, DUEL_SECONDS, DUEL_TIERS, buildDuel, eloDeltas, publicQuestions, type DuelTier } from '../src/engine/duel'

/*
 * Live duels: challenge a friend, or get matched with someone learning the same language
 * at a similar rating. Both get the same 10 questions (src/engine/duel.ts, from the
 * duel's seed); the server checks every answer. Most right wins; on a tie, whoever
 * finished first. Random matches are ranked (Elo per language). Coins are paid once per
 * duel through the coin ledger (credit()).
 *
 * The Neon HTTP driver has no interactive transactions, so each step that matters is one
 * statement: claiming a queue partner, recording an answer, and finishing a duel (only
 * the request that flips it to done updates ratings).
 */

export const DUELS_SCHEMA = [
  `create table if not exists lingora_duels (
    id serial primary key,
    lang text not null,
    tier text not null default 'core',
    seed integer not null,
    a_id text not null references users(id) on delete cascade,
    b_id text not null references users(id) on delete cascade,
    ranked boolean not null default false,
    status text not null default 'pending',
    created_at timestamptz not null default now(),
    started_at timestamptz,
    ended_at timestamptz,
    winner_id text,
    a_delta integer,
    b_delta integer
  )`,
  `create index if not exists lingora_duels_a on lingora_duels (a_id, created_at desc)`,
  `create index if not exists lingora_duels_b on lingora_duels (b_id, created_at desc)`,
  `create table if not exists lingora_duel_answers (
    duel_id integer not null references lingora_duels(id) on delete cascade,
    user_id text not null,
    idx integer not null,
    option_id text not null,
    correct boolean not null,
    ms integer not null,
    primary key (duel_id, user_id, idx)
  )`,
  `create table if not exists lingora_duel_queue (
    user_id text primary key references users(id) on delete cascade,
    lang text not null,
    rating integer not null,
    joined_at timestamptz not null default now(),
    seen_at timestamptz not null default now()
  )`,
  `create table if not exists lingora_duel_ratings (
    user_id text not null references users(id) on delete cascade,
    lang text not null,
    rating integer not null default 1000,
    wins integer not null default 0,
    losses integer not null default 0,
    draws integer not null default 0,
    primary key (user_id, lang)
  )`,
]

const LANGS: LangCode[] = ['zh', 'ja', 'pt']
const COUNTDOWN_MS = 3000
const INVITE_MINUTES = 10
const LANG_NAME: Record<LangCode, string> = { zh: 'Mandarin', ja: 'Japanese', pt: 'Portuguese' }

const langOf = (v: unknown): LangCode => (LANGS.includes(v as LangCode) ? (v as LangCode) : fail(400, 'Pick a language.'))
const tierOf = (v: unknown): DuelTier => (DUEL_TIERS.includes(v as DuelTier) ? (v as DuelTier) : 'core')

async function ratingOf(s: Sql, uid: string, lang: string): Promise<number> {
  const [r] = await s`select rating from lingora_duel_ratings where user_id = ${uid} and lang = ${lang}`
  return (r?.rating as number) ?? 1000
}

async function names(s: Sql, ids: string[]) {
  const rows = await s`select id, coalesce(username, first_name, 'Learner') as name from users where id = any(${ids})`
  return Object.fromEntries(rows.map((r) => [r.id as string, r.name as string]))
}

/** Finish a duel whose players are both done or whose time is up. Only the request that flips it pays. */
async function finishIfDone(s: Sql, d: any) {
  if (d.status !== 'active') return d
  const answers = await s`select user_id, count(*)::int as n, count(*) filter (where correct)::int as right, max(ms)::int as last
    from lingora_duel_answers where duel_id = ${d.id} group by user_id`
  const of = (uid: string) => answers.find((a) => a.user_id === uid) ?? { n: 0, right: 0, last: DUEL_SECONDS * 1000 }
  const a = of(d.a_id), b = of(d.b_id)
  const timeUp = Date.now() > new Date(d.started_at).getTime() + DUEL_SECONDS * 1000 + 2000
  if (!timeUp && (a.n < DUEL_QUESTIONS || b.n < DUEL_QUESTIONS)) return d
  // Most right; then whoever finished their last answer sooner (only if both finished).
  let scoreA: 0 | 0.5 | 1 = a.right > b.right ? 1 : a.right < b.right ? 0 : 0.5
  if (scoreA === 0.5 && a.n === DUEL_QUESTIONS && b.n === DUEL_QUESTIONS && a.last !== b.last) scoreA = a.last < b.last ? 1 : 0
  const winner = scoreA === 1 ? d.a_id : scoreA === 0 ? d.b_id : null
  let deltas: [number, number] = [0, 0]
  if (d.ranked) deltas = eloDeltas(await ratingOf(s, d.a_id, d.lang), await ratingOf(s, d.b_id, d.lang), scoreA)
  const [done] = await s`update lingora_duels set status = 'done', ended_at = now(), winner_id = ${winner}, a_delta = ${deltas[0]}, b_delta = ${deltas[1]}
    where id = ${d.id} and status = 'active' returning *`
  if (!done) return (await s`select * from lingora_duels where id = ${d.id}`)[0]
  for (const [uid, delta, result] of [[d.a_id, deltas[0], scoreA], [d.b_id, deltas[1], 1 - scoreA]] as [string, number, number][]) {
    if (d.ranked) {
      await s`insert into lingora_duel_ratings (user_id, lang, rating, wins, losses, draws)
        values (${uid}, ${d.lang}, ${1000 + delta}, ${result === 1 ? 1 : 0}, ${result === 0 ? 1 : 0}, ${result === 0.5 ? 1 : 0})
        on conflict (user_id, lang) do update set rating = lingora_duel_ratings.rating + ${delta},
          wins = lingora_duel_ratings.wins + ${result === 1 ? 1 : 0}, losses = lingora_duel_ratings.losses + ${result === 0 ? 1 : 0},
          draws = lingora_duel_ratings.draws + ${result === 0.5 ? 1 : 0}`
    }
    await credit(uid, `duel:${d.id}`, result === 1 ? DUEL_COINS.win : result === 0.5 ? DUEL_COINS.draw : DUEL_COINS.loss)
  }
  return done
}

async function load(s: Sql, id: number, uid: string) {
  const [d] = await s`select * from lingora_duels where id = ${id} and (a_id = ${uid} or b_id = ${uid})`
  if (!d) fail(404, 'Duel not found.')
  if (d.status === 'pending' && Date.now() - new Date(d.created_at).getTime() > INVITE_MINUTES * 60_000) {
    await s`update lingora_duels set status = 'expired' where id = ${id} and status = 'pending'`
    d.status = 'expired'
  }
  return finishIfDone(s, d)
}

async function view(s: Sql, d: any, uid: string) {
  const other = d.a_id === uid ? d.b_id : d.a_id
  const nm = await names(s, [d.a_id, d.b_id])
  const answers = await s`select user_id, idx, option_id, correct from lingora_duel_answers where duel_id = ${d.id} order by idx`
  const mine = answers.filter((a) => a.user_id === uid)
  const theirs = answers.filter((a) => a.user_id === other)
  const started = d.status === 'active' || d.status === 'done'
  const built = started ? buildDuel(d.lang, d.tier, d.seed) : []
  const done = d.status === 'done'
  return {
    id: d.id, lang: d.lang, tier: d.tier, ranked: d.ranked, status: d.status,
    me: { id: uid, name: nm[uid] }, them: { id: other, name: nm[other] }, invitedByMe: d.a_id === uid,
    startsAt: d.started_at ? new Date(d.started_at).getTime() : null, seconds: DUEL_SECONDS, serverNow: Date.now(),
    questions: started ? publicQuestions(built) : [],
    // Your answers, with the right one shown once you've answered (or at the end).
    answers: mine.map((a) => ({ idx: a.idx, optionId: a.option_id, correct: a.correct, answer: built[a.idx]?.answer })),
    // The other player: how far along and how many right (their picks only at the end).
    them_progress: { answered: theirs.length, right: theirs.filter((a) => a.correct).length },
    result: done ? {
      winner: d.winner_id, delta: d.a_id === uid ? d.a_delta : d.b_delta,
      answers: built.map((q) => q.answer), theirs: theirs.map((a) => ({ idx: a.idx, optionId: a.option_id, correct: a.correct })),
    } : null,
  }
}

async function startDuel(s: Sql, a: string, b: string, lang: LangCode, tier: DuelTier, ranked: boolean) {
  const [d] = await s`insert into lingora_duels (lang, tier, seed, a_id, b_id, ranked, status, started_at)
    values (${lang}, ${tier}, ${randomInt(1, 2 ** 31 - 1)}, ${a}, ${b}, ${ranked}, 'active', now() + make_interval(secs => ${COUNTDOWN_MS / 1000})) returning *`
  return d
}

export function registerDuelRoutes(app: Hono<Env>) {
  // Your duels (pending, live and recent) and ratings.
  app.get('/duels', requireUser, async (c) => {
    const s = db(), uid = c.get('userId')
    await s`update lingora_duels set status = 'expired' where status = 'pending' and created_at < now() - make_interval(mins => ${INVITE_MINUTES}) and (a_id = ${uid} or b_id = ${uid})`
    const rows = await s`select * from lingora_duels where (a_id = ${uid} or b_id = ${uid}) and (status in ('pending', 'active') or ended_at > now() - interval '7 days')
      order by created_at desc limit 30`
    const nm = await names(s, [...new Set(rows.flatMap((r) => [r.a_id as string, r.b_id as string]))])
    const ratings = await s`select lang, rating, wins, losses, draws from lingora_duel_ratings where user_id = ${uid}`
    const [queued] = await s`select lang from lingora_duel_queue where user_id = ${uid} and seen_at > now() - interval '20 seconds'`
    return c.json({
      duels: rows.map((d) => {
        const other = d.a_id === uid ? d.b_id : d.a_id
        return { id: d.id, lang: d.lang, tier: d.tier, ranked: d.ranked, status: d.status, them: { id: other, name: nm[other] }, invitedByMe: d.a_id === uid,
          won: d.status === 'done' ? (d.winner_id === uid ? true : d.winner_id ? false : null) : undefined, delta: d.a_id === uid ? d.a_delta : d.b_delta, at: d.created_at }
      }),
      ratings: Object.fromEntries(ratings.map((r) => [r.lang, { rating: r.rating, wins: r.wins, losses: r.losses, draws: r.draws }])),
      queued: queued?.lang ?? null,
    })
  })

  app.get('/duels/ladder/:lang', requireUser, async (c) => {
    const s = db(), lang = langOf(c.req.param('lang'))
    const rows = await s`select r.user_id, r.rating, r.wins, r.losses, r.draws, coalesce(u.username, u.first_name, 'Learner') as name
      from lingora_duel_ratings r join users u on u.id = r.user_id
      where r.lang = ${lang} order by r.rating desc, r.wins desc limit 50`
    return c.json(rows.map((r) => ({ id: r.user_id, name: r.name, rating: r.rating, wins: r.wins, losses: r.losses, draws: r.draws })))
  })

  // { friendId, lang, tier }: challenge a friend (unranked).
  app.post('/duels', requireUser, async (c) => {
    const s = db(), uid = c.get('userId'), body = await c.req.json().catch(() => ({}))
    rateLimit(c, `duel:${uid}`, 20, 3_600_000, 'Too many duel invites. Try again later.')
    const friend = str(body.friendId), lang = langOf(body.lang), tier = tierOf(body.tier)
    if (!friend || friend === uid || !(await areFriends(s, uid, friend)) || (await blockedBetween(s, uid, friend))) fail(403, 'You can only challenge friends.')
    const [d] = await s`insert into lingora_duels (lang, tier, seed, a_id, b_id, status) values (${lang}, ${tier}, ${randomInt(1, 2 ** 31 - 1)}, ${uid}, ${friend}, 'pending') returning id`
    const nm = await names(s, [uid])
    notify([friend], { kind: 'lingora', tag: `duel:${d.id}`, title: `${nm[uid]} challenged you to a duel`, body: `${LANG_NAME[lang]} · 10 questions. Tap to play!`, url: { lingora: `/duels/${d.id}` } })
    return c.json({ id: d.id }, 201)
  })

  app.post('/duels/:id/accept', requireUser, async (c) => {
    const s = db(), uid = c.get('userId'), id = Number(c.req.param('id')) || 0
    const [d] = await s`update lingora_duels set status = 'active', started_at = now() + make_interval(secs => ${COUNTDOWN_MS / 1000})
      where id = ${id} and b_id = ${uid} and status = 'pending' and created_at > now() - make_interval(mins => ${INVITE_MINUTES}) returning *`
    if (!d) fail(409, 'That challenge has expired.')
    return c.json(await view(s, d, uid))
  })

  app.post('/duels/:id/decline', requireUser, async (c) => {
    const s = db(), uid = c.get('userId'), id = Number(c.req.param('id')) || 0
    await s`update lingora_duels set status = 'declined', ended_at = now() where id = ${id} and (a_id = ${uid} or b_id = ${uid}) and status = 'pending'`
    return c.json({ ok: true })
  })

  // { lang }: find a random opponent (ranked). Call again every couple of seconds while waiting.
  app.post('/duels/queue', requireUser, async (c) => {
    const s = db(), uid = c.get('userId'), lang = langOf((await c.req.json().catch(() => ({}))).lang)
    // Already matched by someone else's call?
    const [mine] = await s`select id from lingora_duels where ranked and (a_id = ${uid} or b_id = ${uid}) and status = 'active' and created_at > now() - interval '1 minute' order by id desc limit 1`
    if (mine) { await s`delete from lingora_duel_queue where user_id = ${uid}`; return c.json({ id: mine.id }) }
    const rating = await ratingOf(s, uid, lang)
    // Claim the longest-waiting partner within range (the range widens the longer they wait).
    const [other] = await s`delete from lingora_duel_queue where user_id = (
        select q.user_id from lingora_duel_queue q where q.lang = ${lang} and q.user_id <> ${uid} and q.seen_at > now() - interval '15 seconds'
          and abs(q.rating - ${rating}) <= 150 + extract(epoch from now() - q.joined_at) * 10
          and not exists (select 1 from chat.blocks b where (b.user_id = q.user_id and b.blocked_id = ${uid}) or (b.user_id = ${uid} and b.blocked_id = q.user_id))
        order by q.joined_at limit 1 for update skip locked)
      returning user_id`.catch(() => [] as any[])
    if (other) {
      await s`delete from lingora_duel_queue where user_id = ${uid}`
      const d = await startDuel(s, other.user_id, uid, lang, 'core', true)
      notify([other.user_id], { kind: 'lingora', tag: `duel:${d.id}`, title: 'Opponent found!', body: `Your ${LANG_NAME[lang]} duel is starting.`, url: { lingora: `/duels/${d.id}` } })
      return c.json({ id: d.id })
    }
    await s`insert into lingora_duel_queue (user_id, lang, rating) values (${uid}, ${lang}, ${rating})
      on conflict (user_id) do update set seen_at = now(), lang = excluded.lang, rating = excluded.rating,
        joined_at = case when lingora_duel_queue.lang = excluded.lang then lingora_duel_queue.joined_at else now() end`
    return c.json({ waiting: true })
  })

  app.delete('/duels/queue', requireUser, async (c) => {
    await db()`delete from lingora_duel_queue where user_id = ${c.get('userId')}`
    return c.json({ ok: true })
  })

  app.get('/duels/:id', requireUser, async (c) => {
    const s = db(), uid = c.get('userId')
    return c.json(await view(s, await load(s, Number(c.req.param('id')) || 0, uid), uid))
  })

  // { index, optionId }: questions are answered in order, once each.
  app.post('/duels/:id/answer', requireUser, async (c) => {
    const s = db(), uid = c.get('userId'), id = Number(c.req.param('id')) || 0, body = await c.req.json().catch(() => ({}))
    const d = await load(s, id, uid)
    if (d.status !== 'active') fail(409, 'This duel is over.')
    const start = new Date(d.started_at).getTime()
    if (Date.now() < start) fail(409, 'Not yet: the duel is about to start.')
    const index = Number(body.index), optionId = str(body.optionId)
    const built = buildDuel(d.lang, d.tier, d.seed)
    if (!Number.isInteger(index) || index < 0 || index >= built.length) fail(400, 'No such question.')
    const [{ n }] = await s`select count(*)::int as n from lingora_duel_answers where duel_id = ${id} and user_id = ${uid}`
    if (index !== n) fail(409, 'Answer the questions in order.')
    const correct = built[index].answer === optionId
    const saved = await s`insert into lingora_duel_answers (duel_id, user_id, idx, option_id, correct, ms)
      values (${id}, ${uid}, ${index}, ${optionId}, ${correct}, ${Math.max(0, Date.now() - start)}) on conflict do nothing returning idx`
    if (!saved.length) fail(409, 'Already answered.')
    const after = await finishIfDone(s, d)
    return c.json({ correct, answer: built[index].answer, view: await view(s, after, uid) })
  })
}
