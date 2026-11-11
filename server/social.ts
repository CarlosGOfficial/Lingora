import { recapFor } from './ops'
import { BLOCKED_MESSAGE, blockedBetween, blockedByMe } from './blocks'
import { ACHIEVEMENTS } from '../src/content/goals'
import type { Hono } from 'hono'
import type { LangCode } from '../src/content/types'
import { dayKey, daysBetween, weekStart } from '../src/lib/date'
import { SHOP_ITEM_BY_ID } from '../src/shop/catalog'
import {
  DAILY_IMAGE_LIMIT,
  GIPHY_ID_RE,
  GROUP_NAME_MAX,
  MAX_FAVORITE_GIFS,
  MAX_GIF_BYTES,
  MAX_GROUPS,
  MAX_GROUP_MEMBERS,
  MAX_IMAGE_BYTES,
  MAX_MESSAGE,
  MAX_REACTION_KINDS,
  asPlainText,
  imageId,
  isEmoji,
  isPlainText,
  messagePreview,
  type ChatKind,
  type ChatMessage,
  type ChatPerson,
  type GifResult,
  type GroupSummary,
} from '../src/social/chat'
import { bump, emptyStreak, reconcile } from '../src/store/streak'
import type { Friend, FriendRequest, FriendsData, LeaderboardRow, Prefs } from '../src/sync/types'
import type { Sql } from './db'
import { GIPHY_API_KEY } from './env'
import { COURSES, allLessons } from '../src/content'
import { levelFromXp } from '../src/shop/catalog'
import { BIO_MAX, type CourseProgress, type Notifications, type ProfileRelation, type PublicProfile } from '../src/social/profile'
import { currentUserId, db, fail, rateLimit, requireUser, str, type Env } from './http'
import { clip, notify } from './push'
import { avatarUrl, banterLooks, invisibleIds, wordleGames } from './banter'

/**
 * Friends, private chats and group chats. Everything lives in Wordle Unlimited's tables,
 * so both apps share one friends list, the same requests and the same conversations.
 * The logic mirrors Wordle's server/friends.ts, server/chat.ts and server/social.ts.
 */

const LANGS: LangCode[] = ['zh', 'ja', 'pt']
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/
const ONLINE_MS = 75_000 // seen within this long = online (open pages ping every 30s)
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

type Row = Record<string, any>

const displayName = (u: Row) => (u.username as string) || (u.first_name as string) || 'Player'
const isOnline = (seen: unknown) => !!seen && Date.now() - new Date(seen as string).getTime() < ONLINE_MS

type AppName = 'lingora' | 'banter' | 'wordle'
/** Which app each person has open right now (presence.apps: all three apps write a heartbeat). */
async function openApps(s: NonNullable<ReturnType<typeof db>>, ids: string[]): Promise<Map<string, AppName[]>> {
  const out = new Map<string, AppName[]>()
  if (!ids.length) return out
  try {
    const rows = await s`select user_id, app from presence.apps where user_id = any(${ids}::text[])
      and seen_at > now() - (${String(ONLINE_MS)} || ' milliseconds')::interval`
    for (const r of rows) out.set(r.user_id as string, [...(out.get(r.user_id as string) ?? []), r.app as AppName])
  } catch { /* table not there yet: plain "Online" */ }
  return out
}

function cosmetics(prefs: Prefs | null) {
  const eq = ((prefs?.appearance as { equipped?: Record<string, string> } | undefined)?.equipped ?? {}) as Record<string, string>
  const title = SHOP_ITEM_BY_ID.get(eq.title)
  const color = SHOP_ITEM_BY_ID.get(eq.nameColor)
  return { title: title?.category === 'title' ? title.text ?? null : null, nameColor: color?.category === 'nameColor' ? color.color ?? null : null }
}

/** id → user row (with Lingora prefs and presence) for the given ids. */
async function people(s: Sql, ids: string[]): Promise<Map<string, Row>> {
  if (!ids.length) return new Map()
  const rows = await s`select u.id, u.username, u.first_name, u.last_seen_at, u.profile_image_url, p.prefs, p.user_id is not null as on_lingora
    from users u left join lingora_profiles p on p.user_id = u.id where u.id = any(${[...new Set(ids)]}::text[])`
  return new Map(rows.map((u) => [u.id as string, u]))
}

const personCard = (u: Row): ChatPerson => ({ id: u.id, username: displayName(u), avatar: avatarUrl(u.profile_image_url), ...cosmetics(u.prefs as Prefs | null) })

async function friendshipBetween(s: Sql, a: string, b: string) {
  const [row] = await s`select id, requester_id, addressee_id, status from friendships
    where (requester_id = ${a} and addressee_id = ${b}) or (requester_id = ${b} and addressee_id = ${a})`
  return row as { id: number; requester_id: string; addressee_id: string; status: string } | undefined
}
export const areFriends = async (s: Sql, a: string, b: string) => (await friendshipBetween(s, a, b))?.status === 'accepted'

/** Weekly XP, streak and course for everyone in `ids` who has opened Lingora. */
async function leaderboard(s: Sql, uid: string, ids: string[], today: string): Promise<LeaderboardRow[]> {
  const rows = await s`select u.id, u.username, u.first_name, u.profile_image_url, p.prefs from users u join lingora_profiles p on p.user_id = u.id where u.id = any(${ids}::text[])`
  const days = await s`select user_id, to_char(day, 'YYYY-MM-DD') as day, sum(xp)::int as xp from lingora_xp_events
    where user_id = any(${ids}::text[]) group by user_id, day order by day`
  const start = weekStart(today)
  return rows
    .map((p): LeaderboardRow => {
      const active = days.filter((d) => d.user_id === p.id && d.xp > 0)
      let streak = emptyStreak()
      for (const d of active) if (daysBetween(d.day, today) >= 0) streak = bump(streak, d.day)
      const lang = (p.prefs as Prefs | null)?.activeLang
      return {
        id: p.id,
        username: displayName(p),
        avatar: avatarUrl(p.profile_image_url),
        weeklyXp: active.filter((d) => daysBetween(start, d.day) >= 0 && daysBetween(d.day, today) >= 0).reduce((n, d) => n + d.xp, 0),
        streak: reconcile(streak, today).current,
        lang: lang && LANGS.includes(lang) ? lang : 'zh',
        me: p.id === uid,
        ...cosmetics(p.prefs as Prefs | null),
      }
    })
    .sort((a, b) => b.weeklyXp - a.weeklyXp)
}

/* ---------- Chat messages (shared by DMs and groups) ---------- */

/** Rows → what the browser gets: reactions grouped by emoji, and a quote of the message replied to. */
async function decorate(s: Sql, kind: ChatKind, rows: Row[], me: string): Promise<ChatMessage[]> {
  if (!rows.length) return []
  const ids = rows.map((r) => r.id as number)
  const known = new Map<number, Row>(rows.map((r) => [r.id, r]))
  const missing = [...new Set(rows.map((r) => r.reply_to_id).filter((id): id is number => id !== null && !known.has(id)))]
  const [reactions, quoted] = await Promise.all([
    s`select message_id, user_id, emoji from message_reactions where kind = ${kind} and message_id = any(${ids}::int[]) order by created_at`,
    !missing.length
      ? Promise.resolve([] as Row[])
      : kind === 'dm'
        ? s`select id, from_user_id, content, deleted_at from direct_messages where id = any(${missing}::int[])`
        : s`select id, from_user_id, content, deleted_at from group_messages where id = any(${missing}::int[])`,
  ])
  for (const q of quoted) known.set(q.id, q)

  const byMessage = new Map<number, ChatMessage['reactions']>()
  for (const r of reactions) {
    const list = byMessage.get(r.message_id) ?? []
    let e = list.find((x) => x.emoji === r.emoji)
    if (!e) list.push((e = { emoji: r.emoji, count: 0, mine: false, userIds: [] }))
    e.count++
    e.userIds.push(r.user_id)
    if (r.user_id === me) e.mine = true
    byMessage.set(r.message_id, list)
  }

  return rows.map((r) => {
    const q = r.reply_to_id !== null ? known.get(r.reply_to_id) : undefined
    return {
      id: r.id,
      from: r.from_user_id,
      mine: r.from_user_id === me,
      content: r.deleted_at ? '' : r.content,
      at: new Date(r.created_at).toISOString(),
      editedAt: r.edited_at ? new Date(r.edited_at).toISOString() : null,
      deleted: !!r.deleted_at,
      replyTo:
        r.reply_to_id === null
          ? null
          : { id: r.reply_to_id, from: q?.from_user_id ?? null, preview: !q ? 'Original message isn’t available' : q.deleted_at ? 'Message deleted' : messagePreview(q.content) },
      reactions: r.deleted_at ? [] : byMessage.get(r.id) ?? [],
      ...(kind === 'dm' && r.from_user_id === me ? { read: !!r.read_at } : {}),
    }
  })
}

/** A reply must point at a message in the same chat. Returns the id to store (or null). */
async function replyTarget(s: Sql, chat: { kind: 'dm'; me: string; them: string } | { kind: 'group'; groupId: number }, replyToId: unknown): Promise<number | null> {
  const id = Number(replyToId)
  if (!Number.isInteger(id) || id <= 0) return null
  const rows =
    chat.kind === 'dm'
      ? await s`select id from direct_messages where id = ${id}
          and ((from_user_id = ${chat.me} and to_user_id = ${chat.them}) or (from_user_id = ${chat.them} and to_user_id = ${chat.me}))`
      : await s`select id from group_messages where id = ${id} and group_id = ${chat.groupId}`
  return rows.length ? id : null
}

/** The content to store for a message: typed text, a picture you uploaded, or a GIPHY GIF. */
async function chatContent(s: Sql, me: string, body: Row): Promise<string> {
  if (body?.invite || body?.clip) return fail(400, 'Game invites and clips can only be sent from Wordle Unlimited.')
  if (typeof body?.image === 'string') {
    const [img] = await s`select id from chat_images where id = ${body.image} and user_id = ${me}`
    return img ? `IMG:${img.id}` : fail(400, 'That picture didn’t upload. Try again.')
  }
  if (typeof body?.gif === 'string') return GIPHY_ID_RE.test(body.gif) ? `GIF:${body.gif}` : fail(400, 'That GIF isn’t available.')
  if (typeof body?.recap === 'string') {
    // Your monthly recap as a card (built here from your own numbers, so nobody can fake one).
    const r = await recapFor(me, body.recap)
    if (!r) fail(400, 'No recap for that month.')
    return `RECAP:${r!.period}:${r!.wordle.won}:${r!.lingora.xp}:${r!.banter.messages}`
  }
  const content = str(body?.content).trim()
  if (!content) fail(400, 'Type a message first.')
  if (content.length > MAX_MESSAGE) fail(400, `Messages can be up to ${MAX_MESSAGE} characters.`)
  return asPlainText(content)
}

/** The message, if `me` is in its chat. */
async function findMessage(s: Sql, kind: ChatKind, id: number, me: string): Promise<Row | null> {
  if (!Number.isInteger(id)) return null
  if (kind === 'dm') {
    const [row] = await s`select * from direct_messages where id = ${id}`
    return row && (row.from_user_id === me || row.to_user_id === me) ? row : null
  }
  const [row] = await s`select m.* from group_messages m join group_members gm on gm.group_id = m.group_id and gm.user_id = ${me} where m.id = ${id}`
  return row ?? null
}

/* ---------- Groups ---------- */

async function membership(s: Sql, groupId: number, userId: string) {
  if (!Number.isInteger(groupId)) return undefined
  const [row] = await s`select g.id, g.name, g.owner_id, gm.last_read_id from group_members gm join group_chats g on g.id = gm.group_id
    where gm.group_id = ${groupId} and gm.user_id = ${userId}`
  return row as { id: number; name: string; owner_id: string | null; last_read_id: number } | undefined
}

export async function postToGroup(s: Sql, groupId: number, fromUserId: string | null, content: string, replyToId: number | null = null) {
  const [m] = await s`insert into group_messages (group_id, from_user_id, content, reply_to_id) values (${groupId}, ${fromUserId}, ${content}, ${replyToId})
    returning id, from_user_id, content, created_at, reply_to_id, edited_at, deleted_at`
  await s`update group_chats set last_message_at = ${m.created_at} where id = ${groupId}`
  // Your own messages count as read.
  if (fromUserId) {
    await s`update group_members set last_read_id = ${m.id}, notified_id = ${m.id} where group_id = ${groupId} and user_id = ${fromUserId}`
    const [[g], members, [sender]] = await Promise.all([
      s`select name from group_chats where id = ${groupId}`,
      s`select user_id from group_members where group_id = ${groupId}`,
      s`select username, first_name from users where id = ${fromUserId}`,
    ])
    notify(members.map((r) => r.user_id as string).filter((id) => id !== fromUserId), {
      kind: 'chat', title: (g?.name as string) ?? 'Group chat', body: clip(`${sender ? displayName(sender) : 'Someone'}: ${messagePreview(content)}`), tag: `group:${groupId}`,
      url: { banter: `/chats/group/${groupId}`, wordle: '/', lingora: `/friends/group/${groupId}` },
    })
  }
  return m
}

/** New members start caught up. */
export async function addMember(s: Sql, groupId: number, userId: string) {
  const [{ max }] = await s`select coalesce(max(id), 0)::int as max from group_messages where group_id = ${groupId}`
  await s`insert into group_members (group_id, user_id, last_read_id, notified_id) values (${groupId}, ${userId}, ${max}, ${max}) on conflict do nothing`
}

export async function groupCount(s: Sql, userId: string): Promise<number> {
  const [{ n }] = await s`select count(*)::int as n from group_members where user_id = ${userId}`
  return n
}

async function nameOf(s: Sql, id: string) {
  const [u] = await s`select username, first_name from users where id = ${id}`
  return u ? displayName(u) : 'Someone'
}

async function mySummaries(s: Sql, me: string): Promise<GroupSummary[]> {
  const mine = await s`select g.id, g.name, g.owner_id from group_members gm join group_chats g on g.id = gm.group_id
    where gm.user_id = ${me} order by g.last_message_at desc`
  if (!mine.length) return []
  const ids = mine.map((g) => g.id as number)
  const [members, unreadRows, lastRows] = await Promise.all([
    s`select group_id, user_id, last_read_id from group_members where group_id = any(${ids}::int[]) order by joined_at`,
    s`select m.group_id, count(*)::int as n from group_messages m join group_members gm on gm.group_id = m.group_id and gm.user_id = ${me}
      where m.group_id = any(${ids}::int[]) and m.id > gm.last_read_id and (m.from_user_id is null or m.from_user_id <> ${me}) group by m.group_id`,
    s`select * from group_messages where id in (select max(id) from group_messages where group_id = any(${ids}::int[]) group by group_id)`,
  ])
  const who = await people(s, [...members.map((m) => m.user_id), ...lastRows.map((r) => r.from_user_id).filter(Boolean)])
  const unread = new Map(unreadRows.map((r) => [r.group_id as number, r.n as number]))
  const last = new Map(lastRows.map((r) => [r.group_id as number, r]))
  return mine.map((g) => {
    const l = last.get(g.id)
    const from = l?.from_user_id ? who.get(l.from_user_id) : undefined
    return {
      id: g.id,
      name: g.name,
      ownerId: g.owner_id,
      members: members
        .filter((m) => m.group_id === g.id)
        .flatMap((m) => {
          const u = who.get(m.user_id)
          return u ? [{ ...personCard(u), online: isOnline(u.last_seen_at), lastReadId: m.last_read_id }] : []
        }),
      unread: unread.get(g.id) ?? 0,
      lastMessage: l ? { fromName: from ? displayName(from) : null, content: l.deleted_at ? '' : l.content, at: new Date(l.created_at).toISOString() } : null,
    }
  })
}

/* ---------- GIF search (GIPHY). Needs GIPHY_API_KEY; without it GIF files can still be sent as pictures. ---------- */

let trending: { at: number; gifs: GifResult[] } | null = null

async function giphy(q: string): Promise<GifResult[]> {
  const key = encodeURIComponent(GIPHY_API_KEY)
  const url = q
    ? `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(q)}&limit=24&rating=pg-13&bundle=messaging_non_clips`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=24&rating=pg-13&bundle=messaging_non_clips`
  const r = await fetch(url, { signal: AbortSignal.timeout(6000) })
  if (!r.ok) throw new Error(`GIPHY ${r.status}`)
  const body = (await r.json()) as { data: Row[] }
  return body.data
    .map((g) => {
      const img = g.images?.fixed_width_small ?? g.images?.fixed_width ?? {}
      return { id: String(g.id), preview: img.webp || img.url, width: Number(img.width) || 100, height: Number(img.height) || 100 }
    })
    .filter((g) => g.preview)
}

function looksLike(mime: string, buf: Buffer): boolean {
  if (mime === 'image/png') return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (mime === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
  if (mime === 'image/gif') return /^GIF8[79]a$/.test(buf.subarray(0, 6).toString('ascii'))
  return buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP'
}

const chatKind = (v: string): ChatKind => (v === 'dm' || v === 'group' ? v : fail(404, 'Message not found.'))

/* ---------- Routes ---------- */

export function registerSocialRoutes(app: Hono<Env, any, any>) {
  // Heartbeat from any open page, so friends (here and in Wordle) see you're online.
  app.post('/presence', requireUser, async (c) => {
    const uid = c.get('userId')
    await db()`update users set last_seen_at = now() where id = ${uid}`
    // Which app: Banter shows "Online in Lingora" (shared table, see push.ts).
    // { lang, doing }: shown to friends in Banter and Wordle ("Studying Japanese on Lingora").
    const body = (await c.req.json().catch(() => ({}))) as { lang?: unknown; doing?: unknown }
    const detail = JSON.stringify({
      lang: ['zh', 'ja', 'pt'].includes(String(body.lang)) ? body.lang : null,
      doing: ['lesson', 'review', 'practice', 'reading', 'conversation', 'test', 'browsing'].includes(String(body.doing)) ? body.doing : 'browsing',
    })
    await db()`insert into presence.apps (user_id, app, seen_at, detail) values (${uid}, 'lingora', now(), ${detail}::jsonb)
      on conflict (user_id, app) do update set seen_at = now(), detail = excluded.detail`.catch(() => {})
    return c.json({ ok: true })
  })

  /* ----- Friends ----- */

  app.get('/friends', requireUser, async (c) => {
    const uid = c.get('userId')
    const q = c.req.query('today') ?? ''
    const today = DAY_RE.test(q) ? q : dayKey()
    const s = db()
    const rows = await s`select id, requester_id, addressee_id, status from friendships where requester_id = ${uid} or addressee_id = ${uid}`
    const other = (f: Row) => (f.requester_id === uid ? f.addressee_id : f.requester_id) as string
    const who = await people(s, rows.map(other))
    const accepted = rows.filter((f) => f.status === 'accepted').map(other)
    const unreadRows = accepted.length
      ? await s`select from_user_id, count(*)::int as n from direct_messages
          where to_user_id = ${uid} and read_at is null and deleted_at is null and from_user_id = any(${accepted}::text[]) group by from_user_id`
      : []
    const unread = new Map(unreadRows.map((r) => [r.from_user_id as string, r.n as number]))
    const [open, banter, hidden, games] = await Promise.all([openApps(s, accepted), banterLooks(s, accepted), invisibleIds(s, accepted), wordleGames(s, accepted)])

    const friends: Friend[] = accepted
      .flatMap((id) => {
        const u = who.get(id)
        if (!u) return []
        const seen = u.last_seen_at ? new Date(u.last_seen_at).toISOString() : null
        const online = !hidden.has(id) && isOnline(u.last_seen_at) // Invisible in Banter: offline here too
        return [{ ...personCard(u), online, openIn: online ? open.get(id) ?? [] : [], lastSeen: hidden.has(id) ? null : seen,
          wordleGame: online ? games.get(id) ?? null : null, unread: unread.get(id) ?? 0, onLingora: !!u.on_lingora, onBanter: banter.has(id) }]
      })
      // Online first; unread messages float up within each group.
      .sort((a, b) => Number(b.online) - Number(a.online) || b.unread - a.unread || a.username.localeCompare(b.username))
    const requests = (incoming: boolean): FriendRequest[] =>
      rows
        .filter((f) => f.status === 'pending' && (f.addressee_id === uid) === incoming)
        .flatMap((f) => {
          const u = who.get(other(f))
          return u ? [{ ...personCard(u), requestId: f.id as number }] : []
        })

    const data: FriendsData = {
      leaderboard: await leaderboard(s, uid, [uid, ...accepted], today),
      friends,
      incoming: requests(true),
      outgoing: requests(false),
    }
    return c.json(data)
  })

  // { username } → sends a request, or accepts theirs if they already asked you.
  app.post('/friends/request', requireUser, async (c) => {
    const uid = c.get('userId')
    rateLimit(c, `friend-req:${uid}`, 30, 3_600_000, 'Too many friend requests. Try again later.')
    const username = str((await c.req.json().catch(() => ({}))).username).trim()
    if (!username || username.length > 40) fail(400, 'Enter their username.')
    const s = db()
    const [target] = await s`select id, username, first_name from users where lower(username) = lower(${username})`
    if (!target) fail(404, 'No player with that username.')
    if (target.id === uid) fail(400, 'You can’t add yourself.')
    // Blocked either way (in any of the three apps): no friend requests.
    if (await blockedBetween(s, uid, target.id)) fail(403, BLOCKED_MESSAGE)
    const name = displayName(target)
    const existing = await friendshipBetween(s, uid, target.id)
    if (existing?.status === 'accepted') fail(409, `You’re already friends with ${name}.`)
    if (existing?.requester_id === uid) fail(409, 'Request already sent.')
    if (existing) {
      await s`update friendships set status = 'accepted' where id = ${existing.id}`
      return c.json({ status: 'accepted', name })
    }
    try {
      await s`insert into friendships (requester_id, addressee_id) values (${uid}, ${target.id})`
      const [meRow] = await s`select username, first_name from users where id = ${uid}`
      notify([target.id as string], { kind: 'chat', title: 'New friend request', body: `${meRow ? displayName(meRow) : 'Someone'} wants to be friends.`, tag: `fr:${uid}`, url: { banter: '/chats/friends', wordle: '/', lingora: '/friends' } })
    } catch (e) {
      if ((e as { code?: string }).code === '23505') fail(409, 'Request already sent.')
      throw e
    }
    return c.json({ status: 'pending', name })
  })

  // Accept/decline your incoming requests; cancel your own outgoing ones.
  app.post('/friends/requests/:id/:action', requireUser, async (c) => {
    const uid = c.get('userId')
    const id = Number(c.req.param('id'))
    const action = c.req.param('action')
    const s = db()
    const [f] = Number.isInteger(id) ? await s`select requester_id, addressee_id from friendships where id = ${id} and status = 'pending'` : []
    if (!f || (action === 'cancel' ? f.requester_id !== uid : f.addressee_id !== uid)) fail(404, 'Request not found.')
    if (action === 'accept') await s`update friendships set status = 'accepted' where id = ${id}`
    else if (action === 'decline' || action === 'cancel') await s`delete from friendships where id = ${id}`
    else fail(400, 'Unknown action.')
    return c.json({ ok: true })
  })

  app.delete('/friends/:userId', requireUser, async (c) => {
    const s = db()
    const f = await friendshipBetween(s, c.get('userId'), c.req.param('userId'))
    if (!f) fail(404, 'You’re not friends.')
    await s`delete from friendships where id = ${f!.id}`
    return c.json({ ok: true })
  })

  /* ----- Private messages ----- */

  // Newest 100 messages with a friend. Reading them marks theirs read.
  app.get('/dm/:userId', requireUser, async (c) => {
    const me = c.get('userId')
    const them = c.req.param('userId')
    const s = db()
    if (!(await areFriends(s, me, them))) fail(403, 'You can only message friends.')
    const rows = await s`select * from direct_messages
      where (from_user_id = ${me} and to_user_id = ${them}) or (from_user_id = ${them} and to_user_id = ${me})
      order by created_at desc limit 100`
    await s`update direct_messages set read_at = now(), notified = true where from_user_id = ${them} and to_user_id = ${me} and read_at is null`
    return c.json(await decorate(s, 'dm', rows.reverse(), me))
  })

  // { content } | { image } | { gif }, plus an optional replyToId.
  app.post('/dm/:userId', requireUser, async (c) => {
    const me = c.get('userId')
    const them = c.req.param('userId')
    const s = db()
    if (!(await areFriends(s, me, them))) fail(403, 'You can only message friends.')
    if (await blockedBetween(s, me, them)) fail(403, BLOCKED_MESSAGE)
    rateLimit(c, `chat:${me}`, 20, 60_000, 'Slow down a little — try again in a moment.')
    const body = await c.req.json().catch(() => ({}))
    const content = await chatContent(s, me, body)
    const replyToId = await replyTarget(s, { kind: 'dm', me, them }, body.replyToId)
    const [m] = await s`insert into direct_messages (from_user_id, to_user_id, content, reply_to_id) values (${me}, ${them}, ${content}, ${replyToId}) returning *`
    const [sender] = await s`select username, first_name from users where id = ${me}`
    notify([them], {
      kind: 'chat', title: sender ? displayName(sender) : 'New message', body: clip(messagePreview(content)), tag: `dm:${me}`,
      url: { banter: `/chats/dm/${me}`, wordle: '/', lingora: `/friends/chat/${me}` },
    })
    return c.json((await decorate(s, 'dm', [m], me))[0])
  })

  /* ----- Reactions, edits, deletes (DMs and groups) ----- */

  // Toggle a reaction: { emoji }.
  app.post('/messages/:kind/:id/reactions', requireUser, async (c) => {
    const me = c.get('userId')
    const kind = chatKind(c.req.param('kind'))
    const emoji = str((await c.req.json().catch(() => ({}))).emoji)
    if (!isEmoji(emoji)) fail(400, 'Pick an emoji.')
    rateLimit(c, `react:${me}`, 60, 60_000, 'Slow down a little — try again in a moment.')
    const s = db()
    const msg = await findMessage(s, kind, Number(c.req.param('id')), me)
    if (!msg || msg.deleted_at) fail(404, 'Message not found.')
    if (msg!.from_user_id === null) fail(400, 'You can’t react to that.')
    const removed = await s`delete from message_reactions where kind = ${kind} and message_id = ${msg!.id} and user_id = ${me} and emoji = ${emoji} returning id`
    if (removed.length) return c.json({ reacted: false })
    const kinds = await s`select distinct emoji from message_reactions where kind = ${kind} and message_id = ${msg!.id}`
    if (kinds.length >= MAX_REACTION_KINDS && !kinds.some((k) => k.emoji === emoji)) fail(409, 'That message has enough different reactions.')
    await s`insert into message_reactions (kind, message_id, user_id, emoji) values (${kind}, ${msg!.id}, ${me}, ${emoji}) on conflict do nothing`
    return c.json({ reacted: true })
  })

  // Edit your own text message: { content }.
  app.patch('/messages/:kind/:id', requireUser, async (c) => {
    const me = c.get('userId')
    const kind = chatKind(c.req.param('kind'))
    const s = db()
    const msg = await findMessage(s, kind, Number(c.req.param('id')), me)
    if (!msg || msg.deleted_at || msg.from_user_id !== me) fail(404, 'Message not found.')
    if (!isPlainText(msg!.content)) fail(400, 'Only text messages can be edited.')
    const content = str((await c.req.json().catch(() => ({}))).content).trim()
    if (!content) fail(400, 'Type something (or delete the message).')
    if (content.length > MAX_MESSAGE) fail(400, `Messages can be up to ${MAX_MESSAGE} characters.`)
    if (kind === 'dm') await s`update direct_messages set content = ${asPlainText(content)}, edited_at = now() where id = ${msg!.id}`
    else await s`update group_messages set content = ${asPlainText(content)}, edited_at = now() where id = ${msg!.id}`
    return c.json({ ok: true })
  })

  // Delete your own message (it shows as "Message deleted").
  app.delete('/messages/:kind/:id', requireUser, async (c) => {
    const me = c.get('userId')
    const kind = chatKind(c.req.param('kind'))
    const s = db()
    const msg = await findMessage(s, kind, Number(c.req.param('id')), me)
    if (!msg || msg.deleted_at || msg.from_user_id !== me) fail(404, 'Message not found.')
    if (kind === 'dm') await s`update direct_messages set content = '', deleted_at = now() where id = ${msg!.id}`
    else await s`update group_messages set content = '', deleted_at = now() where id = ${msg!.id}`
    await s`delete from message_reactions where kind = ${kind} and message_id = ${msg!.id}`
    // The picture goes too, unless it was also sent somewhere else.
    const img = imageId(msg!.content)
    if (img) {
      const content = `IMG:${img}`
      const [dm] = await s`select id from direct_messages where content = ${content} limit 1`
      const [gm] = await s`select id from group_messages where content = ${content} limit 1`
      if (!dm && !gm) await s`delete from chat_images where id = ${img} and user_id = ${me}`
    }
    return c.json({ ok: true })
  })

  /* ----- Pictures ----- */

  // Upload a picture: the raw file as the body (Content-Type image/...), ?w=&h= optional.
  // The browser shrinks photos first; GIFs are sent as they are.
  app.post('/chat-images', requireUser, async (c) => {
    const me = c.get('userId')
    const mime = (c.req.header('content-type') ?? '').split(';')[0].trim()
    if (!IMAGE_TYPES.includes(mime)) fail(400, 'Send a PNG, JPEG, GIF or WebP image.')
    const max = mime === 'image/gif' ? MAX_GIF_BYTES : MAX_IMAGE_BYTES
    if (Number(c.req.header('content-length') ?? 0) > max + 1024) fail(413, 'That picture is too big.')
    const buf = Buffer.from(await c.req.arrayBuffer())
    if (!buf.length) fail(400, 'Send a PNG, JPEG, GIF or WebP image.')
    if (buf.length > max) fail(413, 'That picture is too big.')
    if (!looksLike(mime, buf)) fail(400, 'That file isn’t a valid image.')
    const s = db()
    const [{ n }] = await s`select count(*)::int as n from chat_images where user_id = ${me} and created_at > now() - interval '24 hours'`
    if (n >= DAILY_IMAGE_LIMIT) fail(429, `You can send up to ${DAILY_IMAGE_LIMIT} pictures a day.`)
    const dim = (v: unknown) => {
      const x = Math.round(Number(v))
      return Number.isFinite(x) && x > 0 && x < 20000 ? x : null
    }
    const [row] = await s`insert into chat_images (id, user_id, mime, data, bytes, width, height)
      values (${crypto.randomUUID()}, ${me}, ${mime}, ${buf.toString('base64')}, ${buf.length}, ${dim(c.req.query('w'))}, ${dim(c.req.query('h'))}) returning id`
    return c.json({ id: row.id }, 201)
  })

  app.get('/chat-images/:id', requireUser, async (c) => {
    const [row] = await db()`select mime, data from chat_images where id = ${c.req.param('id')}`
    if (!row) return c.body(null, 404)
    return c.body(Buffer.from(row.data, 'base64'), 200, {
      'Content-Type': row.mime,
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    })
  })

  /* ----- GIFs ----- */

  // Your starred GIFs, newest first: [{ id }].
  app.get('/gifs/favorites', requireUser, async (c) => {
    const rows = await db()`select gif_id as id from favorite_gifs where user_id = ${c.get('userId')} order by created_at desc, id desc`
    return c.json(rows)
  })

  // Star / unstar: { id, favorite: boolean }.
  app.post('/gifs/favorites', requireUser, async (c) => {
    const me = c.get('userId')
    const body = await c.req.json().catch(() => ({}))
    const id = str(body.id)
    if (!GIPHY_ID_RE.test(id)) fail(400, 'That GIF isn’t available.')
    const s = db()
    if (!body.favorite) {
      await s`delete from favorite_gifs where user_id = ${me} and gif_id = ${id}`
      return c.json({ favorite: false })
    }
    const [{ n }] = await s`select count(*)::int as n from favorite_gifs where user_id = ${me}`
    if (n >= MAX_FAVORITE_GIFS) fail(409, `You can keep up to ${MAX_FAVORITE_GIFS} favorite GIFs. Unstar one first.`)
    await s`insert into favorite_gifs (user_id, gif_id) values (${me}, ${id}) on conflict do nothing`
    return c.json({ favorite: true })
  })

  // GIF search: ?q= (empty = trending).
  app.get('/gifs', requireUser, async (c) => {
    if (!GIPHY_API_KEY) return c.json({ enabled: false, results: [] })
    const q = (c.req.query('q') ?? '').trim().slice(0, 50)
    if (!q && trending && Date.now() - trending.at < 10 * 60_000) return c.json({ enabled: true, results: trending.gifs })
    try {
      const gifs = await giphy(q)
      if (!q) trending = { at: Date.now(), gifs }
      return c.json({ enabled: true, results: gifs })
    } catch (e) {
      console.error('GIF search error:', e)
      return fail(502, 'GIF search isn’t working right now.')
    }
  })

  /* ----- Profiles ----- */

  // Anyone signed in can look at a profile, by username or account id. ?today= for streaks.
  app.get('/profiles/:key', async (c) => {
    const key = c.req.param('key')
    const q = c.req.query('today') ?? ''
    const today = DAY_RE.test(q) ? q : dayKey()
    const s = db()
    const [u] = await s`select u.*, p.prefs, p.user_id is not null as on_lingora from users u left join lingora_profiles p on p.user_id = u.id
      where lower(u.username) = lower(${key}) or u.id = ${key} order by (u.id = ${key}) desc limit 1`
    if (!u) fail(404, 'No one by that name.')
    const me = await currentUserId(c)

    const [[{ friends }], link, days, done, words] = await Promise.all([
      s`select count(*)::int as friends from friendships where status = 'accepted' and (requester_id = ${u.id} or addressee_id = ${u.id})`,
      me && me !== u.id ? friendshipBetween(s, me, u.id) : Promise.resolve(undefined),
      s`select lang, to_char(day, 'YYYY-MM-DD') as day, sum(xp)::int as xp from lingora_xp_events where user_id = ${u.id} group by lang, day order by day`,
      s`select ref_id, lang from lingora_completions where user_id = ${u.id} and kind = 'lesson'`,
      s`select lang, count(distinct item_id)::int as n from (
          select lang, item_id from lingora_review_logs where user_id = ${u.id}
          union select lang, item_id from lingora_card_imports where user_id = ${u.id}) t group by lang`,
    ])
    const relation: ProfileRelation = !me ? 'guest' : me === u.id ? 'self' : !link ? 'none' : link.status === 'accepted' ? 'friend' : link.requester_id === me ? 'outgoing' : 'incoming'

    let lingora: PublicProfile['lingora'] = null
    if (u.on_lingora) {
      const byDay = new Map<string, number>()
      for (const d of days) byDay.set(d.day, (byDay.get(d.day) ?? 0) + d.xp)
      let streak = emptyStreak()
      for (const [day, xp] of byDay) if (xp > 0 && daysBetween(day, today) >= 0) streak = bump(streak, day)
      const courses: CourseProgress[] = LANGS.map((lang) => {
        const lessons = allLessons(COURSES[lang])
        const ids = new Set(done.filter((r) => r.lang === lang).map((r) => r.ref_id as string))
        const reached = lessons.filter((l) => ids.has(l.lesson.id))
        return {
          lang,
          xp: days.filter((d) => d.lang === lang).reduce((n, d) => n + d.xp, 0),
          lessons: reached.length,
          totalLessons: lessons.length,
          level: reached.length ? reached[reached.length - 1].unit.level : null,
        }
      })
      const totalXp = courses.reduce((n, c) => n + c.xp, 0)
      const activeLang = (u.prefs as Prefs | null)?.activeLang
      lingora = {
        totalXp,
        level: levelFromXp(totalXp),
        streak: reconcile(streak, today).current,
        bestStreak: streak.longest,
        activeDays: [...byDay.values()].filter((xp) => xp > 0).length,
        lessons: courses.reduce((n, c) => n + c.lessons, 0),
        words: words.reduce((n, w) => n + w.n, 0),
        activeLang: activeLang && LANGS.includes(activeLang) ? activeLang : null,
        // Courses they've started first (most XP first).
        courses: courses.filter((c) => c.xp > 0 || c.lessons > 0).sort((a, b) => b.xp - a.xp),
        badges: (await s`select achievement_id from lingora_achievements where user_id = ${u.id} order by unlocked_at desc`.catch(() => [] as { achievement_id: string }[]))
          .flatMap((r) => { const a = ACHIEVEMENTS.find((x) => x.id === r.achievement_id); return a ? [{ id: a.id, name: a.name, icon: a.icon }] : [] }),
      }
    }

    const profile: PublicProfile = {
      ...personCard(u),
      isAdmin: !!u.is_admin,
      bio: u.bio ?? null,
      joinedAt: u.created_at ? new Date(u.created_at).toISOString() : null,
      online: isOnline(u.last_seen_at) && (me === u.id || !(await invisibleIds(s, [u.id])).has(u.id)),
      openIn: isOnline(u.last_seen_at) ? (await openApps(s, [u.id])).get(u.id) ?? [] : [],
      banter: (await banterLooks(s, [u.id])).get(u.id) ?? null,
      lastSeen: u.last_seen_at ? new Date(u.last_seen_at).toISOString() : null,
      friends,
      relation,
      blockedByMe: await blockedByMe(s, me, u.id),
      requestId: link && link.status !== 'accepted' ? link.id : null,
      lingora,
      wordle: u.rounds_played > 0 ? { roundsWon: u.rounds_won ?? 0, roundsPlayed: u.rounds_played, bestWinStreak: u.best_win_streak ?? 0 } : null,
    }
    return c.json(profile)
  })

  // Your bio (shared with Wordle Unlimited): { bio }.
  app.patch('/profile', requireUser, async (c) => {
    const bio = str((await c.req.json().catch(() => ({}))).bio).replace(/\s+/g, ' ').trim().slice(0, BIO_MAX)
    await db()`update users set bio = ${bio || null} where id = ${c.get('userId')}`
    return c.json({ ok: true })
  })

  /* ----- Notifications ----- */

  // New friend requests, messages and group messages to pop up, marked as shown so each
  // appears once — here or in Wordle Unlimited, which uses the same flags.
  app.get('/notifications', requireUser, async (c) => {
    const me = c.get('userId')
    const s = db()
    const requests = await s`update friendships set notified = true
      where addressee_id = ${me} and status = 'pending' and notified = false returning requester_id as from_id`
    const messages = await s`update direct_messages set notified = true
      where to_user_id = ${me} and notified = false and deleted_at is null returning from_user_id as from_id, content, id`
    const groupRows = await s`select m.group_id, g.name, m.id, m.from_user_id, m.content from group_messages m
      join group_members gm on gm.group_id = m.group_id and gm.user_id = ${me}
      join group_chats g on g.id = m.group_id
      where m.id > gm.notified_id and m.from_user_id is not null and m.from_user_id <> ${me} and m.deleted_at is null
      order by m.id limit 200`
    const byGroup = new Map<number, Row[]>()
    for (const r of groupRows) byGroup.set(r.group_id, [...(byGroup.get(r.group_id) ?? []), r])
    for (const [groupId, list] of byGroup) {
      await s`update group_members set notified_id = greatest(notified_id, ${list[list.length - 1].id}) where group_id = ${groupId} and user_id = ${me}`
    }
    const who = await people(s, [...requests.map((r) => r.from_id), ...messages.map((m) => m.from_id), ...groupRows.map((r) => r.from_user_id)])
    const name = (id: string) => (who.get(id) ? displayName(who.get(id)!) : 'Someone')
    const out: Notifications = {
      friendRequests: requests.map((r) => ({ from: name(r.from_id), fromId: r.from_id })),
      messages: [...messages].sort((a, b) => a.id - b.id).map((m) => ({ from: name(m.from_id), fromId: m.from_id, content: m.content })),
      groupMessages: [...byGroup.values()].map((list) => {
        const l = list[list.length - 1]
        return { groupId: l.group_id, group: l.name, from: name(l.from_user_id), content: messagePreview(l.content), count: list.length }
      }),
    }
    return c.json(out)
  })

  /* ----- Group chats ----- */

  app.get('/groups', requireUser, async (c) => c.json(await mySummaries(db(), c.get('userId'))))

  // { name, memberIds } — members must be your friends.
  app.post('/groups', requireUser, async (c) => {
    const me = c.get('userId')
    const body = await c.req.json().catch(() => ({}))
    const name = str(body.name).trim().slice(0, GROUP_NAME_MAX)
    const ids: string[] = Array.isArray(body.memberIds) ? [...new Set<string>(body.memberIds.filter((x: unknown) => typeof x === 'string' && x !== me))] : []
    if (!name) fail(400, 'Give the group a name.')
    if (!ids.length) fail(400, 'Pick at least one friend.')
    if (ids.length + 1 > MAX_GROUP_MEMBERS) fail(400, `Groups can have up to ${MAX_GROUP_MEMBERS} people.`)
    const s = db()
    if ((await groupCount(s, me)) >= MAX_GROUPS) fail(409, `You can be in up to ${MAX_GROUPS} groups. Leave one first.`)
    for (const id of ids) if (!(await areFriends(s, me, id))) fail(403, 'You can only add your friends.')
    const full: string[] = [] // friends already in MAX_GROUPS groups are left out
    for (const id of ids) if ((await groupCount(s, id)) >= MAX_GROUPS) full.push(id)
    const [group] = await s`insert into group_chats (name, owner_id) values (${name}, ${me}) returning id`
    for (const id of [me, ...ids.filter((id) => !full.includes(id))]) await addMember(s, group.id, id)
    await postToGroup(s, group.id, null, `${await nameOf(s, me)} created the group`)
    return c.json({ id: group.id, skipped: full.length }, 201)
  })

  // Owner only: { name }
  app.patch('/groups/:id', requireUser, async (c) => {
    const me = c.get('userId')
    const s = db()
    const m = await membership(s, Number(c.req.param('id')), me)
    if (!m) fail(404, 'Group not found.')
    if (m!.owner_id !== me) fail(403, 'Only the group’s owner can rename it.')
    const name = str((await c.req.json().catch(() => ({}))).name).trim().slice(0, GROUP_NAME_MAX)
    if (!name) fail(400, 'Give the group a name.')
    if (name !== m!.name) {
      await s`update group_chats set name = ${name} where id = ${m!.id}`
      await postToGroup(s, m!.id, null, `${await nameOf(s, me)} renamed the group to "${name}"`)
    }
    return c.json({ ok: true })
  })

  // Newest 100 messages. Reading them marks the group read.
  app.get('/groups/:id/messages', requireUser, async (c) => {
    const me = c.get('userId')
    const s = db()
    const m = await membership(s, Number(c.req.param('id')), me)
    if (!m) fail(404, 'Group not found.')
    const rows = await s`select * from group_messages where group_id = ${m!.id} order by id desc limit 100`
    if (rows.length && rows[0].id > m!.last_read_id) {
      await s`update group_members set last_read_id = ${rows[0].id}, notified_id = greatest(notified_id, ${rows[0].id}) where group_id = ${m!.id} and user_id = ${me}`
    }
    return c.json(await decorate(s, 'group', rows.reverse(), me))
  })

  // { content } | { image } | { gif }, plus an optional replyToId.
  app.post('/groups/:id/messages', requireUser, async (c) => {
    const me = c.get('userId')
    const s = db()
    const m = await membership(s, Number(c.req.param('id')), me)
    if (!m) fail(404, 'Group not found.')
    rateLimit(c, `chat:${me}`, 20, 60_000, 'Slow down a little — try again in a moment.')
    const body = await c.req.json().catch(() => ({}))
    const content = await chatContent(s, me, body)
    const replyTo = await replyTarget(s, { kind: 'group', groupId: m!.id }, body.replyToId)
    const msg = await postToGroup(s, m!.id, me, content, replyTo)
    return c.json((await decorate(s, 'group', [msg], me))[0])
  })

  // Add one of your friends: { userId }
  app.post('/groups/:id/members', requireUser, async (c) => {
    const me = c.get('userId')
    const s = db()
    const m = await membership(s, Number(c.req.param('id')), me)
    if (!m) fail(404, 'Group not found.')
    const them = str((await c.req.json().catch(() => ({}))).userId)
    if (!(await areFriends(s, me, them))) fail(403, 'You can only add your friends.')
    if (await membership(s, m!.id, them)) fail(409, 'They’re already in the group.')
    const [{ n }] = await s`select count(*)::int as n from group_members where group_id = ${m!.id}`
    if (n >= MAX_GROUP_MEMBERS) fail(409, `Groups can have up to ${MAX_GROUP_MEMBERS} people.`)
    if ((await groupCount(s, them)) >= MAX_GROUPS) fail(409, 'They’re in too many groups already.')
    await addMember(s, m!.id, them)
    await postToGroup(s, m!.id, null, `${await nameOf(s, me)} added ${await nameOf(s, them)}`)
    return c.json({ ok: true })
  })

  // Leave (your own id), or the owner removes someone.
  app.delete('/groups/:id/members/:userId', requireUser, async (c) => {
    const me = c.get('userId')
    const them = c.req.param('userId')
    const s = db()
    const m = await membership(s, Number(c.req.param('id')), me)
    if (!m) fail(404, 'Group not found.')
    if (them !== me && m!.owner_id !== me) fail(403, 'Only the group’s owner can remove people.')
    const gone = await s`delete from group_members where group_id = ${m!.id} and user_id = ${them} returning user_id`
    if (!gone.length) fail(404, 'They’re not in the group.')
    const left = await s`select user_id from group_members where group_id = ${m!.id} order by joined_at`
    if (!left.length) {
      // Reactions aren't linked by a foreign key, so they go first.
      await s`delete from message_reactions where kind = 'group' and message_id in (select id from group_messages where group_id = ${m!.id})`
      await s`delete from group_chats where id = ${m!.id}`
      return c.json({ ok: true })
    }
    // The owner left: the longest-standing member takes over.
    if (m!.owner_id === them) await s`update group_chats set owner_id = ${left[0].user_id} where id = ${m!.id}`
    await postToGroup(s, m!.id, null, them === me ? `${await nameOf(s, me)} left` : `${await nameOf(s, me)} removed ${await nameOf(s, them)}`)
    return c.json({ ok: true })
  })
}
