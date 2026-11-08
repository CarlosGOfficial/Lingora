import type { Hono } from 'hono'
import { fail, requireUser, type Env } from './http'
import { claimCrossEvent, crossEvents } from './ops'

/** Cross-app events (server/ops.ts, the same in all three apps): progress and claiming the reward. */
export function registerCrossEventRoutes(app: Hono<Env>) {
  app.get('/cross-events', requireUser, async (c) => c.json(await crossEvents(c.get('userId')).catch(() => [])))
  app.post('/cross-events/:id/claim', requireUser, async (c) => {
    const r = await claimCrossEvent(c.get('userId'), Number(c.req.param('id')) || 0)
    if ('error' in r) fail(409, r.error)
    return c.json(r)
  })
}
