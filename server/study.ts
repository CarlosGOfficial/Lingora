import type { Hono } from 'hono'
import { randomInt } from 'crypto'
import type { Sql } from './db'
import { db, fail, rateLimit, requireUser, str, type Env } from './http'
import { notify } from './push'
import { addMember, areFriends, groupCount, postToGroup } from './social'
import { blockedBetween } from './blocks'
import { MAX_GROUPS } from '../src/social/chat'

/*
 * Study rooms: study together on a shared focus timer (Pomodoro), seeing each other's
 * progress since joining (XP and cards reviewed, from the usual sync). Each room comes
 * with a group chat (so it's in Banter too), and the room page links to a Banter call
 * in that group. Anyone can join with the room's code; friends see your open rooms.
 */

export const STUDY_SCHEMA = [
  `create table if not exists lingora_study_rooms (
    id serial primary key,
    code text not null unique,
    name text not null,
    owner_id text not null references users(id) on delete cascade,
    group_id integer,
    focus integer not null default 25,
    rest integer not null default 5,
    timer_started_at timestamptz,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists lingora_study_members (
    room_id integer not null references lingora_study_rooms(id) on delete cascade,
    user_id text not null references users(id) on delete cascade,
    joined_at timestamptz not null default now(),
    last_seen timestamptz not null default now(),
    primary key (room_id, user_id)
  )`,
]

const MAX_MEMBERS = 12, MAX_ROOMS = 5
const ONLINE_SECONDS = 45
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const TIMERS: [number, number][] = [[25, 5], [50, 10], [15, 3]]
const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join('')

async function roomFor(s: Sql, id: number, uid: string) {
  const [r] = await s`select r.* from lingora_study_rooms r join lingora_study_members m on m.room_id = r.id and m.user_id = ${uid} where r.id = ${id}`
  if (!r) fail(404, 'Study room not found.')
  return r
}

async function view(s: Sql, r: any, uid: string) {
  const members = await s`select m.user_id, m.joined_at, m.last_seen > now() - make_interval(secs => ${ONLINE_SECONDS}) as online,
      coalesce(u.username, u.first_name, 'Learner') as name,
      (select coalesce(sum(x.xp), 0)::int from lingora_xp_events x where x.user_id = m.user_id and x.at_ms >= extract(epoch from m.joined_at) * 1000) as xp,
      (select count(*)::int from lingora_review_logs l where l.user_id = m.user_id and l.at_ms >= extract(epoch from m.joined_at) * 1000) as reviews
    from lingora_study_members m join users u on u.id = m.user_id where m.room_id = ${r.id}
    order by online desc, xp desc, m.joined_at`
  return {
    id: r.id, code: r.code, name: r.name, owner: r.owner_id === uid, groupId: r.group_id,
    timer: r.timer_started_at ? { focus: r.focus, rest: r.rest, startedAt: new Date(r.timer_started_at).getTime() } : null,
    serverNow: Date.now(),
    members: members.map((m) => ({ id: m.user_id, name: m.name, online: m.online, xp: m.xp, reviews: m.reviews, joinedAt: m.joined_at, me: m.user_id === uid })),
  }
}

export function registerStudyRoutes(app: Hono<Env>) {
  // Your rooms, and open rooms your friends are in right now.
  app.get('/study', requireUser, async (c) => {
    const s = db(), uid = c.get('userId')
    const mine = await s`select r.id, r.code, r.name, (select count(*)::int from lingora_study_members x where x.room_id = r.id
        and x.last_seen > now() - make_interval(secs => ${ONLINE_SECONDS})) as online
      from lingora_study_rooms r join lingora_study_members m on m.room_id = r.id and m.user_id = ${uid} order by m.last_seen desc`
    const friends = await s`select distinct r.id, r.code, r.name, coalesce(u.username, u.first_name) as friend,
        (select count(*)::int from lingora_study_members x where x.room_id = r.id and x.last_seen > now() - make_interval(secs => ${ONLINE_SECONDS})) as online
      from friendships f
      join lingora_study_members m on m.user_id = case when f.requester_id = ${uid} then f.addressee_id else f.requester_id end
        and m.last_seen > now() - make_interval(secs => ${ONLINE_SECONDS})
      join lingora_study_rooms r on r.id = m.room_id
      join users u on u.id = m.user_id
      where f.status = 'accepted' and (f.requester_id = ${uid} or f.addressee_id = ${uid})
        and not exists (select 1 from lingora_study_members me where me.room_id = r.id and me.user_id = ${uid})
      limit 10`
    return c.json({ mine, friends })
  })

  // { name, focus, rest }
  app.post('/study', requireUser, async (c) => {
    const s = db(), uid = c.get('userId'), body = await c.req.json().catch(() => ({}))
    rateLimit(c, `study:${uid}`, 10, 3_600_000, 'Too many new rooms. Try again later.')
    const name = str(body.name).trim().slice(0, 40) || 'Study room'
    const [focus, rest] = TIMERS.find(([f, r]) => f === Number(body.focus) && r === Number(body.rest)) ?? TIMERS[0]
    const [{ n }] = await s`select count(*)::int as n from lingora_study_rooms where owner_id = ${uid}`
    if (n >= MAX_ROOMS) fail(409, `You can have up to ${MAX_ROOMS} study rooms. Delete one first.`)
    // The room's chat is a normal group chat (if you have room for another group).
    let groupId: number | null = null
    if ((await groupCount(s, uid)) < MAX_GROUPS) {
      const [g] = await s`insert into group_chats (name, owner_id) values (${`📚 ${name}`}, ${uid}) returning id`
      groupId = g.id
      await addMember(s, g.id, uid)
      await postToGroup(s, g.id, null, 'Study room chat. Open the room in Lingora to see the timer and everyone\'s progress.')
    }
    let room: any
    for (let i = 0; i < 5 && !room; i++) {
      ;[room] = await s`insert into lingora_study_rooms (code, name, owner_id, group_id, focus, rest) values (${newCode()}, ${name}, ${uid}, ${groupId}, ${focus}, ${rest})
        on conflict (code) do nothing returning *`
    }
    await s`insert into lingora_study_members (room_id, user_id) values (${room.id}, ${uid})`
    return c.json({ id: room.id, code: room.code }, 201)
  })

  // Join by code. { } → { id }
  app.post('/study/join/:code', requireUser, async (c) => {
    const s = db(), uid = c.get('userId')
    const [r] = await s`select * from lingora_study_rooms where code = ${str(c.req.param('code')).toUpperCase()}`
    if (!r) fail(404, 'No study room with that code.')
    if (await blockedBetween(s, uid, r.owner_id)) fail(403, 'You can’t join that room.')
    const [{ n }] = await s`select count(*)::int as n from lingora_study_members where room_id = ${r.id}`
    const [already] = await s`select 1 from lingora_study_members where room_id = ${r.id} and user_id = ${uid}`
    if (!already && n >= MAX_MEMBERS) fail(409, `A study room can have up to ${MAX_MEMBERS} people.`)
    if (!already) {
      await s`insert into lingora_study_members (room_id, user_id) values (${r.id}, ${uid}) on conflict do nothing`
      if (r.group_id && (await groupCount(s, uid)) < MAX_GROUPS) {
        await addMember(s, r.group_id, uid)
        const [u] = await s`select coalesce(username, first_name, 'Someone') as name from users where id = ${uid}`
        await postToGroup(s, r.group_id, null, `${u.name} joined the study room`)
      }
    }
    return c.json({ id: r.id })
  })

  // Polled every few seconds by the room page (also marks you as here).
  app.get('/study/:id', requireUser, async (c) => {
    const s = db(), uid = c.get('userId')
    const r = await roomFor(s, Number(c.req.param('id')) || 0, uid)
    await s`update lingora_study_members set last_seen = now() where room_id = ${r.id} and user_id = ${uid}`
    return c.json(await view(s, r, uid))
  })

  // { action: 'start' | 'stop', focus?, rest? }: anyone in the room runs the shared timer.
  app.post('/study/:id/timer', requireUser, async (c) => {
    const s = db(), uid = c.get('userId'), body = await c.req.json().catch(() => ({}))
    const r = await roomFor(s, Number(c.req.param('id')) || 0, uid)
    if (body.action === 'stop') {
      await s`update lingora_study_rooms set timer_started_at = null where id = ${r.id}`
    } else {
      const [focus, rest] = TIMERS.find(([f, x]) => f === Number(body.focus) && x === Number(body.rest)) ?? [r.focus, r.rest]
      await s`update lingora_study_rooms set timer_started_at = now(), focus = ${focus}, rest = ${rest} where id = ${r.id}`
      const others = await s`select user_id from lingora_study_members where room_id = ${r.id} and user_id <> ${uid}
        and last_seen < now() - make_interval(secs => ${ONLINE_SECONDS}) and last_seen > now() - interval '1 day'`
      notify(others.map((o) => o.user_id as string), { kind: 'lingora', tag: `study:${r.id}`, title: `📚 ${r.name}: focus time!`, body: `A ${focus}-minute session just started. Join in?`, url: { lingora: `/study/${r.id}` } })
    }
    return c.json(await view(s, (await s`select * from lingora_study_rooms where id = ${r.id}`)[0], uid))
  })

  // { friendId }: send a friend the room (a notification with the code).
  app.post('/study/:id/invite', requireUser, async (c) => {
    const s = db(), uid = c.get('userId'), body = await c.req.json().catch(() => ({}))
    const r = await roomFor(s, Number(c.req.param('id')) || 0, uid)
    const friend = str(body.friendId)
    if (!(await areFriends(s, uid, friend))) fail(403, 'You can only invite friends.')
    rateLimit(c, `study-invite:${uid}`, 30, 3_600_000, 'Too many invites. Try again later.')
    const [u] = await s`select coalesce(username, first_name, 'Someone') as name from users where id = ${uid}`
    notify([friend], { kind: 'lingora', tag: `study:${r.id}`, title: `${u.name} invited you to study`, body: `“${r.name}”: join with code ${r.code}.`, url: { lingora: `/study?join=${r.code}` } })
    return c.json({ ok: true })
  })

  // Leave (the owner leaving deletes the room).
  app.post('/study/:id/leave', requireUser, async (c) => {
    const s = db(), uid = c.get('userId')
    const r = await roomFor(s, Number(c.req.param('id')) || 0, uid)
    if (r.owner_id === uid) await s`delete from lingora_study_rooms where id = ${r.id}`
    else await s`delete from lingora_study_members where room_id = ${r.id} and user_id = ${uid}`
    return c.json({ ok: true })
  })
}
