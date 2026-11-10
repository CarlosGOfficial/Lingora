import type { Hono } from 'hono'
import { ACHIEVEMENTS, DIVISIONS, DIVISION_ICONS } from '../src/content/goals'
import { COURSES } from '../src/content'
import { currentUserId, fail, rateLimit, requireUser, type Env } from './http'
import { pinTrophies, startTrophies, touchTrophies, trophyCase, type TrophyDef, type TrophyRule, type TrophyTier } from './ops'

/*
 * Lingora's shelf in the trophy case (server/ops.ts keeps the shared part): achievements,
 * league divisions reached, duel ratings and lessons finished per course. Synced at
 * start-up, hourly, and soon after a sync or a duel (noteTrophies).
 */

const byCoins = (coins: number): TrophyTier => (coins >= 300 ? 'gold' : coins >= 100 ? 'silver' : 'bronze')
const mine = (col: string) => `($1::text is null or ${col} = $1)`
const values = (rows: (string | number)[][]) => rows.map((r) => `(${r.map((v) => (typeof v === 'number' ? v : `'${v}'`)).join(', ')})`).join(', ')

const DIV_TIER = (d: number): TrophyTier => (d >= 7 ? 'special' : d >= 6 ? 'gold' : d >= 4 ? 'silver' : 'bronze')
const DUEL_RATINGS: [number, TrophyTier][] = [[1200, 'bronze'], [1400, 'silver'], [1600, 'gold']]
const LESSON_MILESTONES: [number, TrophyTier][] = [[10, 'bronze'], [50, 'silver'], [150, 'gold']]
const DECK_MAKER: [number, TrophyTier][] = [[25, 'silver'], [100, 'gold']]
const FLAGS: Record<string, string> = { zh: '🇨🇳', ja: '🇯🇵', pt: '🇧🇷' }
const courses = Object.values(COURSES).map((c) => ({ lang: c.lang as string, name: c.name, flag: FLAGS[c.lang] ?? '🗺️' }))

export const LINGORA_TROPHIES: TrophyRule[] = [
  {
    defs: ACHIEVEMENTS.map((a): TrophyDef => ({ key: `ach:${a.id}`, name: a.name, icon: a.icon, tier: a.id === 'streak_100' ? 'special' : byCoins(a.coins), detail: a.description })),
    earned: `select user_id, 'ach:' || achievement_id as key, unlocked_at as earned_at from lingora_achievements where ${mine('user_id')}`,
  },
  {
    // Promoted into Gold or above (Bronze and Silver are where everyone starts).
    defs: DIVISIONS.map((d, i) => ({ key: `league:${i}`, name: `${d} league`, icon: DIVISION_ICONS[i], tier: DIV_TIER(i), detail: `Get promoted to the ${d} league.` })).slice(2),
    earned: `select user_id, 'league:' || next_division as key, now() as earned_at from lingora_league_members
      where moved = 'up' and next_division >= 2 and ${mine('user_id')}`,
  },
  {
    defs: DUEL_RATINGS.map(([r, tier]) => ({ key: `duel:${r}`, name: `Duelist ${r}`, icon: r >= 1600 ? '🗡️' : '⚔️', tier, detail: `Reach a ${r} duel rating in any language.` })),
    earned: `select d.user_id, 'duel:' || m.r as key, now() as earned_at from lingora_duel_ratings d
      join (values ${values(DUEL_RATINGS.map(([r]) => [r]))}) as m(r) on d.rating >= m.r where ${mine('d.user_id')} group by 1, 2`,
  },
  {
    defs: courses.flatMap((c) => LESSON_MILESTONES.map(([n, tier]) => ({ key: `lessons:${c.lang}:${n}`, name: `${c.name}: ${n} lessons`, icon: c.flag, tier, detail: `Finish ${n} ${c.name} lessons.` }))),
    earned: `select user_id, 'lessons:' || lang || ':' || m.n as key, to_timestamp(max(at_ms) / 1000.0) as earned_at
      from lingora_completions join (values ${values(LESSON_MILESTONES.map(([n]) => [n]))}) as m(n) on true
      where kind = 'lesson' and ${mine('user_id')}
      group by user_id, lang, m.n having count(*) >= m.n`,
  },
  {
    defs: DECK_MAKER.map(([n, tier]) => ({ key: `deckmaker:${n}`, name: n >= 100 ? 'Deck legend' : 'Deck maker', icon: n >= 100 ? '🗂️' : '🃏', tier, detail: `Make a community deck that ${n} people follow.` })),
    earned: `select d.owner_id as user_id, 'deckmaker:' || m.n as key, now() as earned_at
      from (select owner_id, max((select count(*) from lingora_deck_subs s where s.deck_id = x.id)) as subs from lingora_decks x where ${mine('owner_id')} group by owner_id) d
      join (values ${values(DECK_MAKER.map(([n]) => [n]))}) as m(n) on d.subs >= m.n`,
  },
]

/** Something happened that might earn a trophy: sync this person's shelf soon. */
export const noteTrophies = (userId: string) => touchTrophies(LINGORA_TROPHIES, userId)

export function registerTrophyRoutes(app: Hono<Env>) {
  startTrophies(LINGORA_TROPHIES)

  app.get('/trophies/:userId', async (c) => {
    const tc = await trophyCase(c.req.param('userId'), await currentUserId(c), LINGORA_TROPHIES)
    if (!tc) fail(404, 'Not found.')
    return c.json(tc)
  })

  // { ids: ['lingora:ach:first_lesson', …] } (up to 6, in order)
  app.put('/trophies/pins', requireUser, async (c) => {
    const uid = c.get('userId')
    rateLimit(c, `trophy-pins:${uid}`, 30, 60_000, 'Slow down a little.')
    const body = await c.req.json().catch(() => ({}))
    return c.json({ pinned: await pinTrophies(uid, body.ids) })
  })
}
