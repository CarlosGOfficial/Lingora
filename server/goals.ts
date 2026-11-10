import { speakingCounts } from './speech'
import { noteTrophies } from './trophies'
import type { Hono } from 'hono'
import {
  ACHIEVEMENTS, CHALLENGE_HOURS, CHALLENGE_PRIZE, DIVISIONS, LEAGUE_MOVES, LEAGUE_PRIZES, LEAGUE_SIZE, questsFor,
  type ChallengeView, type GoalStats, type GoalsView, type LeagueView, type QuestView,
} from '../src/content/goals'
import { levelFromXp } from '../src/shop/catalog'
import { bump, emptyStreak } from '../src/store/streak'
import { daysBetween } from '../src/lib/date'
import { credit } from './economy'
import { db, fail, requireUser, str, type Env } from './http'
import { notify } from './push'

/*
 * Goals, all worked out on the server from synced progress (so they match on every
 * device and can't be faked): daily quests, achievements, weekly leagues and friend XP
 * challenges. Every reward is paid through the coin ledger (server/economy.ts).
 */

export const GOALS_SCHEMA = [
  // Stories are a new kind of completion.
  `alter table lingora_completions drop constraint if exists lingora_completions_kind_check`,
  `alter table lingora_completions add constraint lingora_completions_kind_check check (kind in ('lesson', 'reading', 'story'))`,
  `create table if not exists lingora_achievements (
    user_id text not null references users(id) on delete cascade,
    achievement_id text not null,
    unlocked_at timestamptz not null default now(),
    primary key (user_id, achievement_id)
  )`,
  `create table if not exists lingora_quest_claims (
    user_id text not null references users(id) on delete cascade,
    day text not null,
    quest_id text not null,
    primary key (user_id, day, quest_id)
  )`,
  `create table if not exists lingora_leagues (
    id serial primary key,
    week text not null,
    division int not null,
    finalized boolean not null default false
  )`,
  `create index if not exists lingora_leagues_week on lingora_leagues (week, division)`,
  `create table if not exists lingora_league_members (
    league_id int not null references lingora_leagues(id) on delete cascade,
    user_id text not null references users(id) on delete cascade,
    place int,
    moved text,
    next_division int,
    primary key (league_id, user_id)
  )`,
  `create table if not exists lingora_challenges (
    id serial primary key,
    from_id text not null references users(id) on delete cascade,
    to_id text not null references users(id) on delete cascade,
    hours int not null,
    status text not null default 'pending',
    started_at timestamptz,
    ends_at timestamptz,
    winner text,
    created_at timestamptz not null default now()
  )`,
]

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const mondayOf = (day: string) => {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}
const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
const nameOf = (r: { username?: string | null; first_name?: string | null }) => r.username || r.first_name || 'Learner'

/* ---------- Stats ---------- */

async function statsFor(uid: string, today: string): Promise<GoalStats> {
  const s = db()
  const [[t], days, comp, [rv], [lg], [ch]] = await Promise.all([
    s`select coalesce(sum(xp), 0)::int as xp, count(distinct lang)::int as langs from lingora_xp_events where user_id = ${uid}`,
    s`select to_char(day, 'YYYY-MM-DD') as day, sum(xp)::int as xp from lingora_xp_events where user_id = ${uid} group by 1 order by 1`,
    s`select kind, count(*)::int as n from lingora_completions where user_id = ${uid} group by kind`,
    s`select count(*)::int as n, count(distinct item_id)::int as words from lingora_review_logs where user_id = ${uid}`,
    s`select count(*)::int as n from lingora_league_members where user_id = ${uid} and moved = 'up'`,
    s`select count(*)::int as n from lingora_challenges where winner = ${uid}`,
  ])
  let streak = emptyStreak()
  for (const d of days) if (d.xp > 0 && daysBetween(d.day, today) >= 0) streak = bump(streak, d.day)
  const kind = (k: string) => comp.find((c) => c.kind === k)?.n ?? 0
  return {
    totalXp: t.xp, level: levelFromXp(t.xp), bestStreak: streak.longest, words: rv.words, reviews: rv.n,
    lessons: kind('lesson'), readings: kind('reading'), stories: kind('story'), langs: t.langs,
    leaguePromotions: lg.n, challengesWon: ch.n,
  }
}

/** Unlock (and pay for) any achievements newly earned. */
export async function checkAchievements(uid: string, today: string) {
  noteTrophies(uid)
  const stats = await statsFor(uid, today)
  const s = db()
  // Done means paid (a ledger row), so an unlock whose payment failed is paid on the next sync.
  const paid = new Set((await s`select source_id from lingora_coin_ledger where user_id = ${uid} and source_id like 'ach:%'`).map((r) => r.source_id))
  for (const a of ACHIEVEMENTS) {
    if (paid.has(`ach:${a.id}`) || !a.test(stats)) continue
    await s`insert into lingora_achievements (user_id, achievement_id) values (${uid}, ${a.id}) on conflict do nothing`
    await credit(uid, `ach:${a.id}`, a.coins)
  }
  return stats
}

/* ---------- Quests ---------- */

async function questViews(uid: string, day: string, tzMin: number): Promise<QuestView[]> {
  const s = db()
  // The learner's day, in their own time zone, as a time range.
  const from = Date.parse(`${day}T00:00:00Z`) + tzMin * 60_000, to = from + 86_400_000
  const [[xp], [rv], comp, claimed, speech] = await Promise.all([
    s`select coalesce(sum(xp), 0)::int as n from lingora_xp_events where user_id = ${uid} and day = ${day}::date`,
    s`select count(*)::int as n, count(*) filter (where rating >= 3)::int as good from lingora_review_logs where user_id = ${uid} and at_ms >= ${from} and at_ms < ${to}`,
    s`select kind, count(*)::int as n from lingora_completions where user_id = ${uid} and at_ms >= ${from} and at_ms < ${to} group by kind`,
    s`select quest_id from lingora_quest_claims where user_id = ${uid} and day = ${day}`,
    speakingCounts(uid, from, to),
  ])
  const done = new Set(claimed.map((r) => r.quest_id))
  const kind = (k: string) => comp.find((c) => c.kind === k)?.n ?? 0
  const value = { xp: xp.n, reviews: rv.n, good_reviews: rv.good, lessons: kind('lesson'), readings: kind('reading'), stories: kind('story'), speak: speech.passed }
  return questsFor(uid, day, { speaker: speech.speaker }).map((q) => ({ ...q, progress: Math.min(q.target, value[q.metric]), claimed: done.has(q.id), day }))
}

/* ---------- Leagues ---------- */

async function weekXp(ids: string[], week: string): Promise<Map<string, number>> {
  if (!ids.length) return new Map()
  const rows = await db()`select user_id, coalesce(sum(xp), 0)::int as xp from lingora_xp_events
    where user_id = any(${ids}) and day >= ${week}::date and day < ${addDays(week, 7)}::date group by user_id`
  return new Map(rows.map((r) => [r.user_id, r.xp]))
}

/** Close a finished week's league: places, moves and prizes (once). */
async function finalize(leagueId: number) {
  const s = db()
  // Places and prizes are written first and are safe to redo (each prize is paid once per
  // person and league), and the league is marked finished last. A run that fails half way
  // is simply redone next time; only the run that marks it finished sends notifications.
  const [league] = await s`select week, division from lingora_leagues where id = ${leagueId} and not finalized`
  if (!league) return
  const { week, division } = league
  const members = (await s`select user_id from lingora_league_members where league_id = ${leagueId}`).map((r) => r.user_id as string)
  const xp = await weekXp(members, week)
  const ranked = [...members].sort((a, b) => (xp.get(b) ?? 0) - (xp.get(a) ?? 0))
  const n = ranked.length
  const results = ranked.map((uid, i) => {
    const up = i < LEAGUE_MOVES && division < DIVISIONS.length - 1 && (xp.get(uid) ?? 0) > 0
    const down = n > LEAGUE_MOVES * 2 && i >= n - LEAGUE_MOVES && division > 0
    return { uid, i, up, down, prize: (LEAGUE_PRIZES[i] ?? 0) + (up ? 25 : 0) }
  })
  for (const { uid, i, up, down, prize } of results) {
    const moved = up ? 'up' : down ? 'down' : 'stay'
    await s`update lingora_league_members set place = ${i + 1}, moved = ${moved}, next_division = ${division + (up ? 1 : down ? -1 : 0)} where league_id = ${leagueId} and user_id = ${uid}`
    if (prize && (xp.get(uid) ?? 0) > 0) await credit(uid, `league:${leagueId}`, prize)
  }
  const done = await s`update lingora_leagues set finalized = true where id = ${leagueId} and not finalized returning id`
  if (!done.length) return
  for (const { uid, i, up, down } of results) {
    notify([uid], {
      kind: 'lingora', tag: `league:${leagueId}`,
      title: up ? `Promoted to the ${DIVISIONS[division + 1]} league!` : down ? `Down to the ${DIVISIONS[division - 1]} league` : `You finished #${i + 1} in your league`,
      body: up ? 'Great week. New league, new rivals.' : down ? 'A fresh week starts now. You can climb back up!' : 'A new week of the league has started.',
      url: { lingora: '/goals' },
    })
  }
}

async function leagueView(uid: string, today: string): Promise<LeagueView | null> {
  const s = db()
  const week = mondayOf(today)
  // Close last week's league (if it's over) so this week's division is known.
  const [prev] = await s`select l.id, l.week, l.division, l.finalized, m.place, m.moved, m.next_division from lingora_league_members m
    join lingora_leagues l on l.id = m.league_id where m.user_id = ${uid} and l.week < ${week} order by l.week desc limit 1`
  if (prev && !prev.finalized) await finalize(prev.id)
  const [last] = prev ? await s`select m.place, m.moved, m.next_division, l.division from lingora_league_members m join lingora_leagues l on l.id = m.league_id
    where m.league_id = ${prev.id} and m.user_id = ${uid}` : []
  let [mine] = await s`select l.id, l.division from lingora_league_members m join lingora_leagues l on l.id = m.league_id where m.user_id = ${uid} and l.week = ${week}`
  if (!mine) {
    // You join this week's league once you've studied this week.
    const [{ xp }] = await s`select coalesce(sum(xp), 0)::int as xp from lingora_xp_events where user_id = ${uid} and day >= ${week}::date`
    if (!xp) return { week, division: last?.next_division ?? 0, rows: [], endsAt: `${addDays(week, 7)}T00:00:00Z`, last: last ? { division: last.division, place: last.place, moved: last.moved, coins: 0 } : null }
    const division = last?.next_division ?? 0
    let [open] = await s`select l.id from lingora_leagues l where l.week = ${week} and l.division = ${division}
      and (select count(*) from lingora_league_members m where m.league_id = l.id) < ${LEAGUE_SIZE} order by l.id limit 1`
    if (!open) [open] = await s`insert into lingora_leagues (week, division) values (${week}, ${division}) returning id`
    await s`insert into lingora_league_members (league_id, user_id) values (${open.id}, ${uid}) on conflict do nothing`
    mine = { id: open.id, division }
  }
  const members = await s`select m.user_id, u.username, u.first_name, u.profile_image_url from lingora_league_members m join users u on u.id = m.user_id where m.league_id = ${mine.id}`
  const xp = await weekXp(members.map((m) => m.user_id), week)
  const friends = new Set((await s`select case when requester_id = ${uid} then addressee_id else requester_id end as id from friendships
    where status = 'accepted' and (requester_id = ${uid} or addressee_id = ${uid})`).map((r) => r.id))
  const rows = members.map((m) => ({ userId: m.user_id, name: nameOf(m), avatar: m.profile_image_url ?? null, xp: xp.get(m.user_id) ?? 0, friend: friends.has(m.user_id), me: m.user_id === uid }))
    .sort((a, b) => b.xp - a.xp || Number(b.friend) - Number(a.friend))
  return { week, division: mine.division, rows, endsAt: `${addDays(week, 7)}T00:00:00Z`, last: last ? { division: last.division, place: last.place, moved: last.moved, coins: 0 } : null }
}

/* ---------- XP challenges ---------- */

async function settleChallenges(uid: string) {
  const s = db()
  const due = await s`select * from lingora_challenges where status = 'active' and ends_at <= now() and (from_id = ${uid} or to_id = ${uid})`
  for (const c of due) {
    // Pay first (once per person and challenge, so redoing it is safe), mark it done last.
    const [a, b] = await Promise.all([xpBetween(c.from_id, c.started_at, c.ends_at), xpBetween(c.to_id, c.started_at, c.ends_at)])
    const winner = a > b ? c.from_id : b > a ? c.to_id : null
    if (winner) await credit(winner, `chal:${c.id}`, CHALLENGE_PRIZE)
    else for (const p of [c.from_id, c.to_id]) await credit(p, `chal:${c.id}`, CHALLENGE_PRIZE / 2)
    const claimed = await s`update lingora_challenges set status = 'done', winner = ${winner} where id = ${c.id} and status = 'active' returning id`
    if (!claimed.length) continue
    notify([c.from_id, c.to_id], { kind: 'lingora', tag: `chal:${c.id}`, title: 'XP challenge over!', body: winner ? 'See who won and grab your coins.' : 'It’s a draw: you both get coins.', url: { lingora: '/goals' } })
  }
}

async function xpBetween(uid: string, from: Date | string | null, to: Date | string | null) {
  if (!from) return 0
  const end = to ? new Date(to).getTime() : Date.now()
  const [r] = await db()`select coalesce(sum(xp), 0)::int as xp from lingora_xp_events where user_id = ${uid} and at_ms >= ${new Date(from).getTime()} and at_ms < ${end}`
  return r.xp
}

export async function challengeViews(uid: string): Promise<ChallengeView[]> {
  await settleChallenges(uid)
  const rows = await db()`select c.*, a.username as a_name, a.first_name as a_first, b.username as b_name, b.first_name as b_first
    from lingora_challenges c join users a on a.id = c.from_id join users b on b.id = c.to_id
    where (c.from_id = ${uid} or c.to_id = ${uid}) and (c.status in ('pending', 'active') or c.created_at > now() - interval '14 days')
    order by c.id desc limit 20`
  const out: ChallengeView[] = []
  for (const c of rows) {
    out.push({
      id: c.id, hours: c.hours, status: c.status, mine: c.from_id === uid, winner: c.winner,
      from: { id: c.from_id, name: c.a_name || c.a_first || 'Learner' }, to: { id: c.to_id, name: c.b_name || c.b_first || 'Learner' },
      startedAt: c.started_at ? new Date(c.started_at).toISOString() : null, endsAt: c.ends_at ? new Date(c.ends_at).toISOString() : null,
      fromXp: await xpBetween(c.from_id, c.started_at, c.ends_at), toXp: await xpBetween(c.to_id, c.started_at, c.ends_at),
    })
  }
  return out
}

/** Start a challenge (also used by Banter, which posts a card for it). */
export async function createChallenge(from: string, to: string, hours: number): Promise<number> {
  if (!(CHALLENGE_HOURS as readonly number[]).includes(hours)) fail(400, 'Pick 24 hours, 3 days or a week.')
  if (from === to) fail(400, 'Challenge a friend, not yourself.')
  const s = db()
  const [f] = await s`select 1 from friendships where status = 'accepted' and ((requester_id = ${from} and addressee_id = ${to}) or (requester_id = ${to} and addressee_id = ${from}))`
  if (!f) fail(403, 'You can only challenge friends.')
  const [open] = await s`select 1 from lingora_challenges where status in ('pending', 'active') and ((from_id = ${from} and to_id = ${to}) or (from_id = ${to} and to_id = ${from}))`
  if (open) fail(409, 'You already have a challenge going with them.')
  const [c] = await s`insert into lingora_challenges (from_id, to_id, hours) values (${from}, ${to}, ${hours}) returning id`
  const [u] = await s`select username, first_name from users where id = ${from}`
  notify([to], { kind: 'lingora', tag: `chal:${c.id}`, title: `${nameOf(u ?? {})} challenged you!`, body: `Most XP in ${hours === 24 ? '24 hours' : hours === 72 ? '3 days' : 'a week'} wins coins. Accept in Lingora.`, url: { lingora: '/goals' } })
  return c.id
}

export function registerGoalRoutes(app: Hono<Env>) {
  // ?day=YYYY-MM-DD (your day) &tz=<minutes from UTC, as Date.getTimezoneOffset()>
  app.get('/goals', requireUser, async (c) => {
    const uid = c.get('userId')
    const day = DAY_RE.test(c.req.query('day') ?? '') ? c.req.query('day')! : new Date().toISOString().slice(0, 10)
    const tz = Math.max(-840, Math.min(840, Number(c.req.query('tz')) || 0))
    const stats = await checkAchievements(uid, day)
    const unlocked = new Map((await db()`select achievement_id, unlocked_at from lingora_achievements where user_id = ${uid}`).map((r) => [r.achievement_id, new Date(r.unlocked_at).toISOString()]))
    const view: GoalsView = {
      quests: await questViews(uid, day, tz),
      achievements: ACHIEVEMENTS.map(({ test: _t, ...a }) => ({ ...a, unlockedAt: unlocked.get(a.id) ?? null })),
      league: await leagueView(uid, day),
      challenges: await challengeViews(uid),
      stats,
    }
    return c.json(view)
  })

  // { day, tz, questId }
  app.post('/goals/quests/claim', requireUser, async (c) => {
    const uid = c.get('userId')
    const body = await c.req.json().catch(() => ({}))
    const day = DAY_RE.test(str(body.day)) ? str(body.day) : fail(400, 'Bad day.')
    // Only today's (or yesterday's, across a time zone) quests can be claimed.
    if (Math.abs(daysBetween(day, new Date().toISOString().slice(0, 10))) > 1) fail(400, 'That quest has ended.')
    const q = (await questViews(uid, day, Number(body.tz) || 0)).find((x) => x.id === body.questId)
    if (!q) fail(404, 'That quest has ended.')
    if (q!.progress < q!.target) fail(400, 'Finish the quest first.')
    // Pay first (the ledger only pays a source once), then mark it claimed. If the
    // payment fails, the quest stays claimable and the next try pays it.
    const coins = await credit(uid, `quest:${day}:${q!.id}`, q!.coins)
    await db()`insert into lingora_quest_claims (user_id, day, quest_id) values (${uid}, ${day}, ${q!.id}) on conflict do nothing`
    if (!coins) fail(409, 'Already claimed.')
    return c.json({ coins })
  })

  // { to: userId, hours }
  app.post('/challenges', requireUser, async (c) => {
    const body = await c.req.json().catch(() => ({}))
    const id = await createChallenge(c.get('userId'), str(body.to), Number(body.hours))
    return c.json({ id }, 201)
  })

  app.post('/challenges/:id/:action', requireUser, async (c) => {
    const uid = c.get('userId'), id = Number(c.req.param('id')), action = c.req.param('action')
    const s = db()
    const [ch] = await s`select * from lingora_challenges where id = ${id} and (to_id = ${uid} or from_id = ${uid})`
    if (!ch) fail(404, 'Challenge not found.')
    if (ch.status !== 'pending') fail(409, 'That challenge already started.')
    if (action === 'accept' && ch.to_id === uid) await s`update lingora_challenges set status = 'active', started_at = now(), ends_at = now() + make_interval(hours => ${ch.hours}) where id = ${id}`
    else if (action === 'decline') await s`update lingora_challenges set status = 'declined' where id = ${id}`
    else fail(400, 'Accept or decline.')
    if (action === 'accept') notify([ch.from_id], { kind: 'lingora', tag: `chal:${id}`, title: 'Challenge accepted!', body: 'The clock is running. Go earn some XP!', url: { lingora: '/goals' } })
    return c.json({ ok: true })
  })
}
