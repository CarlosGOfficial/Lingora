import type { Hono } from 'hono'
import Anthropic from '@anthropic-ai/sdk'
import { COURSES } from '../src/content'
import type { LangCode } from '../src/content/types'
import { KNOWN_MIN, knownItems, knownRatio, knownSet, validEpisodeBody, type Episode } from '../src/podcast/episode'
import { db, fail, rateLimit, requireUser, type Env } from './http'
import { ANTHROPIC_API_KEY, CHAT_MODEL } from './env'

/*
 * Listening podcasts written by Claude: a 2-4 minute two-voice episode for a point in the
 * course (after unit X), using only what a learner there knows. An episode is kept only if
 * at least 95% of it is known (src/podcast/episode.ts, checked here, never trusted from the
 * model); one retry tells the model which words to swap out. Episodes are stored and shared
 * by everyone at that unit, so each one is generated once.
 */

export const PODCASTS_SCHEMA = [
  `create table if not exists lingora_podcasts (
    id serial primary key,
    lang text not null,
    unit_id text not null,
    data jsonb not null,
    known real not null,
    created_by text,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists lingora_podcasts_unit on lingora_podcasts (lang, unit_id, created_at desc)`,
]

const enabled = !!ANTHROPIC_API_KEY
const client = enabled ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null

const LANG_NAME: Record<LangCode, string> = { zh: 'Mandarin Chinese (Simplified)', ja: 'Japanese', pt: 'Brazilian Portuguese' }
const READING: Record<LangCode, string> = {
  zh: 'the line in pinyin with tone marks',
  ja: 'the line in hiragana/katakana (no kanji)',
  pt: 'an empty string',
}

const LINE = {
  type: 'object',
  additionalProperties: false,
  required: ['speaker', 'target', 'reading', 'translation'],
  properties: { speaker: { type: 'integer', enum: [0, 1] }, target: { type: 'string' }, reading: { type: 'string' }, translation: { type: 'string' } },
} as const
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'summary', 'lines', 'questions'],
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    lines: { type: 'array', items: LINE },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['q', 'options', 'answer'],
        properties: { q: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, answer: { type: 'integer' } },
      },
    },
  },
} as const

type Body = Pick<Episode, 'title' | 'summary' | 'lines' | 'questions'>

function prompt(lang: LangCode, unitIndex: number): string {
  const course = COURSES[lang]
  const units = course.units.slice(0, unitIndex + 1)
  const unit = units[unitIndex]
  // Newest words first: they're what the episode should practise; older ones fill in.
  const words = knownItems(units).filter((i) => i.kind === 'word').reverse().slice(0, 300)
  return `You write short listening episodes for Lingora, a language-learning app. The listener is learning ${LANG_NAME[lang]} and has just finished the unit "${unit.title}" (${unit.level}).

Write one episode: a natural, warm conversation between two friends (speaker 0 and speaker 1) about something to do with "${unit.title}". It should take 2 to 4 minutes to listen to: 18 to 30 lines, each one or two short sentences.

The listener must understand nearly everything. Use only the words listed below, plus the most basic glue (particles, pronouns, "is", numbers). Never use any other content word. Repeat the unit's newest words several times. ${lang === 'pt' ? 'Use Brazilian spelling and você.' : lang === 'ja' ? 'Use polite です/ます forms, and write words in the same script as the list.' : 'Use simplified characters.'}

Fields:
- title: a short, friendly English title. summary: one English sentence about the episode.
- lines: speaker (0 or 1), target (${LANG_NAME[lang]}), reading (${READING[lang]}), translation (natural English).
- questions: exactly 3 English comprehension questions about what was said, each with 4 short English options and the index of the right one (vary the position of the right answer).

Words the listener knows (${LANG_NAME[lang]} = English):
${words.map((w) => `${w.target}${w.reading ? ` (${w.reading})` : ''} = ${w.meaning}`).join('\n')}`
}

async function write(system: string, retryNote: string | null): Promise<Body> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: 'Write the episode.' }]
  if (retryNote) messages.push({ role: 'user', content: retryNote })
  const res = await client!.beta.messages.create({
    model: CHAT_MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    cache_control: { type: 'ephemeral' },
    system,
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA as unknown as Record<string, unknown> } },
    messages,
  })
  if (res.stop_reason === 'refusal') throw new Error('refusal')
  const text = res.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')?.text
  if (!text || res.stop_reason === 'max_tokens') throw new Error('empty')
  return JSON.parse(text) as Body
}

/** Writes an episode that passes the known-words check (two tries), or throws. */
export async function makeEpisode(lang: LangCode, unitIndex: number): Promise<{ body: Body; known: number }> {
  const course = COURSES[lang]
  const known = knownSet(lang, knownItems(course.units.slice(0, unitIndex + 1)))
  const system = prompt(lang, unitIndex)
  let note: string | null = null
  for (let attempt = 0; attempt < 2; attempt++) {
    const body = await write(system, note)
    if (!validEpisodeBody(body)) {
      note = 'That episode had the wrong shape: write 18-30 lines and exactly 3 questions with 4 options each.'
      continue
    }
    const r = knownRatio(lang, body.lines, known)
    if (r.ratio >= KNOWN_MIN) return { body, known: r.ratio }
    note = `Too many unknown words (${Math.round(r.ratio * 100)}% known; it must be at least ${KNOWN_MIN * 100}%). Rewrite the whole episode without these: ${r.unknown.slice(0, 60).join(', ')}.`
  }
  throw new Error('unknown-words')
}

const LANGS: LangCode[] = ['zh', 'ja', 'pt']
const toEpisode = (r: { id: number; lang: LangCode; unit_id: string; data: Body; known: number }): Episode => ({
  id: `ai-${r.id}`, lang: r.lang, unitId: r.unit_id, source: 'ai', known: r.known, ...r.data,
})

export function registerPodcastRoutes(app: Hono<Env>) {
  // Episodes for a point in the course: ?lang=&unit=<unit id> (and the two units before it).
  app.get('/podcasts', async (c) => {
    const lang = c.req.query('lang') as LangCode
    if (!LANGS.includes(lang)) fail(400, 'Pick a course.')
    const units = COURSES[lang].units
    const at = units.findIndex((u) => u.id === c.req.query('unit'))
    const ids = at < 0 ? [] : units.slice(Math.max(0, at - 2), at + 1).map((u) => u.id)
    const rows = ids.length
      ? await db().query(`select id, lang, unit_id, data, known from lingora_podcasts where lang = $1 and unit_id = any($2) order by created_at desc limit 12`, [lang, ids])
      : []
    return c.json({ canMake: enabled, episodes: rows.map((r) => toEpisode(r as never)) })
  })

  // A new episode for { lang, unit } (shared with everyone at that unit afterwards).
  app.post('/podcasts', requireUser, async (c) => {
    if (!enabled) fail(503, 'New episodes aren’t set up on this server yet. The course episodes are all here.')
    const uid = c.get('userId')
    const b = (await c.req.json().catch(() => ({}))) as { lang?: string; unit?: string }
    const lang = b.lang as LangCode
    if (!LANGS.includes(lang)) fail(400, 'Pick a course.')
    const at = COURSES[lang].units.findIndex((u) => u.id === b.unit)
    if (at < 0) fail(400, 'Finish a unit first.')
    rateLimit(c, `podcast-day:${uid}`, 4, 86_400_000, 'You’ve made today’s new episodes. Listen to the others, or come back tomorrow!')
    // Plenty already for this unit? Use those (episodes are shared).
    const [{ n }] = await db().query(`select count(*)::int as n from lingora_podcasts where lang = $1 and unit_id = $2`, [lang, b.unit])
    if (n >= 8) fail(409, 'This unit already has plenty of episodes. Try one of those!')
    try {
      const { body, known } = await makeEpisode(lang, at)
      const [row] = await db().query(`insert into lingora_podcasts (lang, unit_id, data, known, created_by) values ($1, $2, $3, $4, $5) returning id, lang, unit_id, data, known`, [lang, b.unit, JSON.stringify(body), known, uid])
      return c.json(toEpisode(row as never))
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) fail(429, 'The writer is busy right now. Try again in a moment.')
      if ((e as Error).message === 'unknown-words') fail(502, 'That episode came out too hard. Try again.')
      console.error('podcast failed:', e)
      return fail(502, 'The episode couldn’t be written. Try again.')
    }
  })
}
