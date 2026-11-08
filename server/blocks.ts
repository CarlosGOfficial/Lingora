import type { Hono } from 'hono'
import type { Sql } from './db'
import { db, fail, requireUser, type Env } from './http'
import { activeAnnouncements, activityFeed, activitySharing, fileReport, inboxOf, markInboxRead, setActivitySharing } from './ops'

/*
 * Blocking, shared with Banter and Wordle Unlimited: the same `chat.blocks` rows (Banter
 * creates the table). A block works both ways: neither person can send the other a friend
 * request, and blocking ends any friendship or pending request between them (as in
 * Banter), which also ends DMs, since those need a friendship.
 */

/** Has either of them blocked the other? (False if Banter's tables aren't there yet.) */
export async function blockedBetween(s: Sql, a: string, b: string): Promise<boolean> {
  if (!a || !b) return false
  try {
    return (await s`select 1 from chat.blocks where (user_id = ${a} and blocked_id = ${b}) or (user_id = ${b} and blocked_id = ${a}) limit 1`).length > 0
  } catch {
    return false
  }
}

/** Did `me` block `them`? */
export async function blockedByMe(s: Sql, me: string | null | undefined, them: string): Promise<boolean> {
  if (!me || me === them) return false
  try {
    return (await s`select 1 from chat.blocks where user_id = ${me} and blocked_id = ${them}`).length > 0
  } catch {
    return false
  }
}

export const BLOCKED_MESSAGE = 'You can’t do that with this person.'

export function registerBlockRoutes(app: Hono<Env>) {
  // The activity hub (server/ops.ts): one inbox for all three apps, and friends' activity.
  app.get('/hub/inbox', requireUser, async (c) => c.json(await inboxOf(c.get('userId'))))
  app.post('/hub/read', requireUser, async (c) => {
    await markInboxRead(c.get('userId'), (await c.req.json().catch(() => ({}))).ids)
    return c.json({ ok: true })
  })
  app.get('/hub/feed', requireUser, async (c) => c.json(await activityFeed(c.get('userId'))))
  app.get('/hub/sharing', requireUser, async (c) => c.json(await activitySharing(c.get('userId'))))
  app.put('/hub/sharing', requireUser, async (c) => {
    await setActivitySharing(c.get('userId'), (await c.req.json().catch(() => ({}))).hidden)
    return c.json(await activitySharing(c.get('userId')))
  })

  // Announcements from the admin dashboard showing in Lingora right now (public).
  app.get('/ops/announcements', async (c) => c.json(await activeAnnouncements()))

  // Reports (server/ops.ts): { kind: "user" | "dm" | "group", userId?, messageId?, reason, note? }
  app.post('/reports', requireUser, async (c) => {
    const r = await fileReport(c.get('userId'), await c.req.json().catch(() => ({})))
    if (!r.ok) fail(r.status as 400, r.message)
    return c.json({ ok: true })
  })

  app.put('/blocks/:userId', requireUser, async (c) => {
    const me = c.get('userId')
    const them = c.req.param('userId')
    if (them === me) fail(400, 'You can’t block yourself.')
    const s = db()
    const [u] = await s`select 1 from users where id = ${them}`
    if (!u) fail(404, 'No one with that name.')
    try {
      await s.transaction([
        s`insert into chat.blocks (user_id, blocked_id) values (${me}, ${them}) on conflict do nothing`,
        s`delete from friendships where (requester_id = ${me} and addressee_id = ${them}) or (requester_id = ${them} and addressee_id = ${me})`,
      ])
    } catch (err) {
      if ((err as { code?: string }).code === '42P01') fail(503, 'Blocking isn’t ready yet: open Banter once to set it up.')
      throw err
    }
    return c.json({ ok: true })
  })

  app.delete('/blocks/:userId', requireUser, async (c) => {
    await db()`delete from chat.blocks where user_id = ${c.get('userId')} and blocked_id = ${c.req.param('userId')}`.catch(() => [])
    return c.json({ ok: true })
  })
}
