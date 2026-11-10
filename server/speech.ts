import type { Hono } from 'hono'
import { db, rateLimit, requireUser, str, type Env } from './http'
import { SPEAK_CLOSE_THRESHOLD, SPEAK_PASS_THRESHOLD } from '../src/config'

/*
 * Speaking scores: each scored try at a speaking exercise (shadowing, echo, say it, read
 * aloud), sent by the app in small batches. They give the "Tricky to say" list on the
 * mistakes page, a speaking score on the profile, and the daily speaking quest
 * (server/goals.ts). Scores are worked out in the browser (speech recognition runs there).
 */

export const SPEECH_SCHEMA = [
  `create table if not exists lingora_speech_scores (
    user_id text not null references users(id) on delete cascade,
    client_id text not null,
    item_id text not null,
    lang text not null,
    score real not null,
    at_ms bigint not null,
    primary key (user_id, client_id)
  )`,
  `create index if not exists lingora_speech_user on lingora_speech_scores (user_id, at_ms)`,
]

const LANGS = ['zh', 'ja', 'pt']
const BATCH = 50

/** Passed speaking tries in a time range (the quest), and whether they'd spoken before it. */
export async function speakingCounts(uid: string, from: number, to: number) {
  const [r] = await db()`select count(*) filter (where at_ms >= ${from} and at_ms < ${to} and score >= ${SPEAK_PASS_THRESHOLD})::int as passed,
      bool_or(at_ms < ${from} and at_ms > ${from - 14 * 86_400_000}) as before
    from lingora_speech_scores where user_id = ${uid} and at_ms > ${from - 14 * 86_400_000}`
  return { passed: r?.passed ?? 0, speaker: !!r?.before }
}

export function registerSpeechRoutes(app: Hono<Env>) {
  // { scores: [{ id, itemId, lang, score (0–1), at }] }
  app.post('/speech', requireUser, async (c) => {
    const uid = c.get('userId'), body = await c.req.json().catch(() => ({}))
    rateLimit(c, `speech:${uid}`, 120, 3_600_000, 'Too many speaking scores. Try again later.')
    const now = Date.now()
    const list = (Array.isArray(body.scores) ? body.scores : []).slice(0, BATCH).filter((x: any) =>
      str(x?.id) && str(x.id).length <= 120 && str(x?.itemId) && str(x.itemId).length <= 200 && LANGS.includes(x?.lang) &&
      typeof x?.score === 'number' && x.score >= 0 && x.score <= 1 && Number.isFinite(x?.at) && x.at > now - 30 * 86_400_000 && x.at <= now + 60_000)
    if (list.length) {
      await db()`insert into lingora_speech_scores (user_id, client_id, item_id, lang, score, at_ms)
        select ${uid}, * from unnest(${list.map((x: any) => x.id)}::text[], ${list.map((x: any) => x.itemId)}::text[], ${list.map((x: any) => x.lang)}::text[],
          ${list.map((x: any) => x.score)}::real[], ${list.map((x: any) => Math.round(x.at))}::bigint[])
        on conflict do nothing`
    }
    return c.json({ saved: list.length })
  })

  // ?lang= → your speaking score (last 30 days) and the items that are hardest to say.
  app.get('/speech', requireUser, async (c) => {
    const uid = c.get('userId'), lang = LANGS.includes(c.req.query('lang') ?? '') ? c.req.query('lang')! : null
    const since = Date.now() - 30 * 86_400_000
    const [[all], tricky] = await Promise.all([
      db()`select count(*)::int as attempts, coalesce(avg(score), 0)::float as avg, count(*) filter (where score >= ${SPEAK_PASS_THRESHOLD})::int as passed
        from lingora_speech_scores where user_id = ${uid} and at_ms > ${since} and (${lang}::text is null or lang = ${lang})`,
      db()`select item_id, lang, count(*)::int as attempts, avg(score)::float as avg, max(score)::float as best, max(at_ms)::bigint as last
        from lingora_speech_scores where user_id = ${uid} and at_ms > ${since} and (${lang}::text is null or lang = ${lang})
        group by item_id, lang having avg(score) < ${SPEAK_PASS_THRESHOLD} order by avg(score) limit 20`,
    ])
    return c.json({
      attempts: all.attempts, avg: all.avg, passed: all.passed,
      tricky: tricky.map((t) => ({ itemId: t.item_id, lang: t.lang, attempts: t.attempts, avg: t.avg, best: t.best, last: Number(t.last), close: t.avg >= SPEAK_CLOSE_THRESHOLD })),
    })
  })
}
