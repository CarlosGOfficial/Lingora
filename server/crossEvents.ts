import type { Hono } from 'hono'
import { fail, requireUser, type Env } from './http'
import { buySeasonPremium, claimCrossEvent, claimSeasonTier, crossEvents, seasonView } from './ops'

/** Cross-app events (server/ops.ts, the same in all three apps): progress and claiming the reward. */
export function registerCrossEventRoutes(app: Hono<Env>) {
  app.get('/cross-events', requireUser, async (c) => c.json(await crossEvents(c.get('userId')).catch(() => [])))
  app.post('/cross-events/:id/claim', requireUser, async (c) => {
    const r = await claimCrossEvent(c.get('userId'), Number(c.req.param('id')) || 0)
    if ('error' in r) fail(409, r.error)
    return c.json(r)
  })
  // Season pass (also server/ops.ts).
  app.get('/season', requireUser, async (c) => c.json(await seasonView(c.get('userId')).catch(() => null)))
  app.post('/season/claim', requireUser, async (c) => {
    const body = await c.req.json().catch(() => ({}))
    const r = await claimSeasonTier(c.get('userId'), Number(body.tier), body.track === 'premium' ? 'premium' : 'free')
    if ('error' in r) fail(409, r.error)
    return c.json(r)
  })
  app.post('/season/premium', requireUser, async (c) => {
    const r = await buySeasonPremium(c.get('userId'))
    if ('error' in r) fail(409, r.error)
    return c.json(r)
  })
}
