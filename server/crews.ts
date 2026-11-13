import type { Hono } from 'hono'
import { fail, rateLimit, requireUser, type Env } from './http'
import { claimTrio, crewView, friendStreaks, recapFor, setCrewWars, todayFor } from './ops'
import { crewStudyRoom } from './study'

/* Crews (server/ops.ts): your Wordle clan, its weekly score across the apps, and crew wars. */
export function registerCrewRoutes(app: Hono<Env>) {
  // Your monthly (YYYY-MM) or yearly (YYYY) recap: only yours.
  app.get('/recap/:period', requireUser, async (c) => {
    const r = await recapFor(c.get('userId'), c.req.param('period'))
    if (!r) fail(404, 'No recap for that month.')
    return c.json(r)
  })
  // Your day across the three apps, and the daily trio reward.
  // Your streak with each friend (days in a row you've both done something).
  app.get('/friend-streaks', requireUser, async (c) => c.json(await friendStreaks(c.get('userId'))))
  app.get('/today', requireUser, async (c) => c.json(await todayFor(c.get('userId'))))
  app.post('/today/claim', requireUser, async (c) => {
    const r = await claimTrio(c.get('userId'))
    if ('error' in r) fail(409, r.error)
    return c.json({ ...r, today: await todayFor(c.get('userId')) })
  })
  app.get('/crew', requireUser, async (c) => c.json(await crewView(c.get('userId'))))
  // { on }: owners and officers
  app.put('/crew/wars', requireUser, async (c) => {
    const body = await c.req.json().catch(() => ({}))
    const r = await setCrewWars(c.get('userId'), body.on === true)
    if ('error' in r) fail(403, r.error)
    return c.json(await crewView(c.get('userId')))
  })
  app.post('/crew/study', requireUser, async (c) => {
    rateLimit(c, `crew-study:${c.get('userId')}`, 30, 60_000, 'Slow down a little.')
    return c.json({ id: await crewStudyRoom(c.get('userId')) })
  })
}
