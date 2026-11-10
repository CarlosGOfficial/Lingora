import type { Hono } from 'hono'
import { randomInt } from 'crypto'
import type { Sql } from './db'
import { currentUserId, db, fail, rateLimit, requireUser, str, type Env } from './http'
import { audit, fileReport } from './ops'
import { noteTrophies } from './trophies'
import { DECK_CARD_FIELDS, DECK_LIMITS, deckItemId, type DeckCard, type DeckDetail, type DeckSummary } from '../src/social/decks'

/*
 * Community decks: make a deck of flashcards (a word, its reading, its meaning, an example),
 * keep it private, share it by link, or publish it for everyone to browse. Subscribing to
 * a deck lets you learn its cards; once learned they're ordinary review cards (ids like
 * "pt-deck12-345", see deckItemId), so reviews, sync, the mistakes notebook and practice
 * all work unchanged. Unsubscribing hides them but keeps their history.
 *
 * Neon's HTTP driver has no interactive transactions, so each change is one statement
 * (saving a deck's cards is an upsert plus a delete of the ones removed).
 */

export const DECKS_SCHEMA = [
  `create table if not exists lingora_decks (
    id serial primary key,
    owner_id text not null references users(id) on delete cascade,
    lang text not null,
    title text not null,
    description text not null default '',
    public boolean not null default false,
    share_code text not null unique,
    hidden_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`,
  `create index if not exists lingora_decks_public on lingora_decks (lang, public) where hidden_at is null`,
  `create table if not exists lingora_deck_cards (
    id serial primary key,
    deck_id integer not null references lingora_decks(id) on delete cascade,
    position integer not null default 0,
    target text not null,
    reading text,
    meaning text not null,
    example text
  )`,
  `create index if not exists lingora_deck_cards_deck on lingora_deck_cards (deck_id, position)`,
  `create table if not exists lingora_deck_subs (
    deck_id integer not null references lingora_decks(id) on delete cascade,
    user_id text not null references users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (deck_id, user_id)
  )`,
  `create table if not exists lingora_deck_ratings (
    deck_id integer not null references lingora_decks(id) on delete cascade,
    user_id text not null references users(id) on delete cascade,
    stars integer not null check (stars between 1 and 5),
    primary key (deck_id, user_id)
  )`,
]

const LANGS = ['zh', 'ja', 'pt']
const CODE_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789'
const newCode = () => Array.from({ length: 10 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join('')
const clean = (v: unknown, max: number) => str(v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)

const SUMMARY = (uid: string | null) => `
  d.id, d.lang, d.title, d.description, d.public, d.owner_id, d.updated_at, d.hidden_at is not null as hidden,
  coalesce(u.username, u.first_name, 'Learner') as owner_name,
  (select count(*)::int from lingora_deck_cards c where c.deck_id = d.id) as cards,
  (select count(*)::int from lingora_deck_subs s where s.deck_id = d.id) as subscribers,
  (select round(avg(stars)::numeric, 1)::float from lingora_deck_ratings r where r.deck_id = d.id) as rating,
  (select count(*)::int from lingora_deck_ratings r where r.deck_id = d.id) as ratings,
  ${uid ? `exists (select 1 from lingora_deck_subs s where s.deck_id = d.id and s.user_id = '${uid.replace(/'/g, "''")}')` : 'false'} as subscribed`
const summary = (r: any, uid: string | null): DeckSummary => ({
  id: r.id, lang: r.lang, title: r.title, description: r.description, public: r.public, hidden: r.hidden,
  owner: { id: r.owner_id, name: r.owner_name }, mine: r.owner_id === uid, cardCount: r.cards, subscribers: r.subscribers,
  rating: r.rating, ratings: r.ratings, subscribed: r.subscribed, updatedAt: new Date(r.updated_at).toISOString(),
})

/** The deck if `uid` may see it: public, theirs, subscribed, or opened with its share code. */
async function visibleDeck(s: Sql, id: number, uid: string | null, code: string | null) {
  const [d] = await s.query(`select d.share_code, ${SUMMARY(uid)} from lingora_decks d join users u on u.id = d.owner_id where d.id = $1`, [id])
  if (!d) fail(404, 'Deck not found.')
  const mine = d.owner_id === uid
  const ok = mine || d.subscribed || (code && code === d.share_code) || (d.public && !d.hidden)
  if (!ok) fail(404, 'Deck not found.')
  return d
}

/** Cards from a request: trimmed, empty rows dropped, at most DECK_LIMITS.cards. */
function cardsFrom(body: any): (Omit<DeckCard, 'id'> & { id: number | null })[] {
  const list = Array.isArray(body?.cards) ? body.cards : []
  if (list.length > DECK_LIMITS.cards) fail(400, `A deck can have up to ${DECK_LIMITS.cards} cards.`)
  return list
    .map((c: any) => ({
      id: Number.isInteger(c?.id) && c.id > 0 ? c.id : null,
      target: clean(c?.target, DECK_CARD_FIELDS.target),
      reading: clean(c?.reading, DECK_CARD_FIELDS.reading) || null,
      meaning: clean(c?.meaning, DECK_CARD_FIELDS.meaning),
      example: clean(c?.example, DECK_CARD_FIELDS.example) || null,
    }))
    .filter((c: { target: string; meaning: string }) => c.target && c.meaning)
}

async function saveCards(s: Sql, deckId: number, cards: ReturnType<typeof cardsFrom>) {
  // Keep card ids (they're the review cards' ids): update the ones sent with an id that
  // belongs to this deck, insert the rest, then delete any not sent.
  const kept = await s.query(
    `with input as (
       select * from unnest($2::int[], $3::text[], $4::text[], $5::text[], $6::text[], $7::int[]) as x(id, target, reading, meaning, example, position)
     ), upd as (
       update lingora_deck_cards c set target = i.target, reading = nullif(i.reading, ''), meaning = i.meaning, example = nullif(i.example, ''), position = i.position
       from input i where c.id = i.id and c.deck_id = $1 returning c.id
     ), ins as (
       insert into lingora_deck_cards (deck_id, target, reading, meaning, example, position)
       select $1, i.target, nullif(i.reading, ''), i.meaning, nullif(i.example, ''), i.position from input i
       where i.id is null or not exists (select 1 from lingora_deck_cards c where c.id = i.id and c.deck_id = $1)
       returning id
     )
     select id from upd union all select id from ins`,
    [deckId, cards.map((c) => c.id), cards.map((c) => c.target), cards.map((c) => c.reading ?? ''), cards.map((c) => c.meaning), cards.map((c) => c.example ?? ''), cards.map((_, i) => i)],
  )
  await s.query(`delete from lingora_deck_cards where deck_id = $1 and not (id = any($2::int[]))`, [deckId, kept.map((k: any) => k.id)])
}

async function detail(s: Sql, d: any, uid: string | null): Promise<DeckDetail> {
  const cards = await s.query(`select id, target, reading, meaning, example from lingora_deck_cards where deck_id = $1 order by position, id`, [d.id])
  const [mine] = uid ? await s.query(`select stars from lingora_deck_ratings where deck_id = $1 and user_id = $2`, [d.id, uid]) : []
  return {
    ...summary(d, uid),
    shareCode: d.owner_id === uid ? d.share_code : undefined,
    cards: cards.map((c: any) => ({ id: c.id, target: c.target, reading: c.reading, meaning: c.meaning, example: c.example })),
    myRating: mine?.stars ?? null,
  }
}

export function registerDeckRoutes(app: Hono<Env>) {
  // Browse public decks: ?lang=&q=&sort=top|new
  app.get('/decks', async (c) => {
    const s = db(), uid = await currentUserId(c)
    const lang = LANGS.includes(c.req.query('lang') ?? '') ? c.req.query('lang')! : null
    const q = clean(c.req.query('q'), 60).toLowerCase()
    const order = c.req.query('sort') === 'new' ? 'd.updated_at desc' : 'subscribers desc, rating desc nulls last, d.updated_at desc'
    const rows = await s.query(
      `select * from (select ${SUMMARY(uid)} from lingora_decks d join users u on u.id = d.owner_id
         where d.public and d.hidden_at is null and ($1::text is null or d.lang = $1)
           and ($2 = '' or lower(d.title) like '%' || $2 || '%' or lower(d.description) like '%' || $2 || '%')) d
       where cards > 0 order by ${order} limit 60`,
      [lang, q.replace(/[%_\\]/g, '')],
    )
    return c.json(rows.map((r: any) => summary(r, uid)))
  })

  // Yours and the ones you subscribe to, with their cards (the app learns and reviews these).
  app.get('/decks/mine', requireUser, async (c) => {
    const s = db(), uid = c.get('userId')
    const rows = await s.query(
      `select ${SUMMARY(uid)} from lingora_decks d join users u on u.id = d.owner_id
       where d.owner_id = $1 or exists (select 1 from lingora_deck_subs x where x.deck_id = d.id and x.user_id = $1)
       order by d.updated_at desc`,
      [uid],
    )
    const cards = rows.length ? await s.query(`select id, deck_id, target, reading, meaning, example from lingora_deck_cards where deck_id = any($1::int[]) order by position, id`, [rows.map((r: any) => r.id)]) : []
    return c.json(rows.map((r: any) => ({ ...summary(r, uid), cards: cards.filter((x: any) => x.deck_id === r.id).map(({ deck_id: _d, ...x }: any) => x) })))
  })

  app.get('/decks/:id', async (c) => {
    const s = db(), uid = await currentUserId(c)
    const d = await visibleDeck(s, Number(c.req.param('id')) || 0, uid, c.req.query('code') ?? null)
    return c.json(await detail(s, d, uid))
  })

  // { lang, title, description, public, cards: [{ target, reading, meaning, example }] }
  app.post('/decks', requireUser, async (c) => {
    const s = db(), uid = c.get('userId'), body = await c.req.json().catch(() => ({}))
    rateLimit(c, `deck-new:${uid}`, 10, 3_600_000, 'Too many new decks. Try again later.')
    const lang = str(body.lang)
    if (!LANGS.includes(lang)) fail(400, 'Pick a language.')
    const title = clean(body.title, DECK_LIMITS.title)
    if (!title) fail(400, 'Give the deck a name.')
    const cards = cardsFrom(body)
    const [d] = await s.query(
      `insert into lingora_decks (owner_id, lang, title, description, public, share_code)
       select $1, $2, $3, $4, $5, $6 where (select count(*) from lingora_decks where owner_id = $1) < $7 returning id`,
      [uid, lang, title, clean(body.description, DECK_LIMITS.description), body.public === true, newCode(), DECK_LIMITS.decks],
    )
    if (!d) fail(409, `You can have up to ${DECK_LIMITS.decks} decks.`)
    if (cards.length) await saveCards(s, d.id, cards)
    return c.json(await detail(s, await visibleDeck(s, d.id, uid, null), uid), 201)
  })

  app.put('/decks/:id', requireUser, async (c) => {
    const s = db(), uid = c.get('userId'), body = await c.req.json().catch(() => ({}))
    rateLimit(c, `deck-save:${uid}`, 60, 3_600_000, 'Too many changes. Try again later.')
    const id = Number(c.req.param('id')) || 0
    const title = clean(body.title, DECK_LIMITS.title)
    if (!title) fail(400, 'Give the deck a name.')
    const cards = cardsFrom(body)
    const [d] = await s.query(`update lingora_decks set title = $3, description = $4, public = $5, updated_at = now() where id = $1 and owner_id = $2 returning id`,
      [id, uid, title, clean(body.description, DECK_LIMITS.description), body.public === true])
    if (!d) fail(404, 'Deck not found.')
    await saveCards(s, id, cards)
    return c.json(await detail(s, await visibleDeck(s, id, uid, null), uid))
  })

  app.delete('/decks/:id', requireUser, async (c) => {
    await db().query(`delete from lingora_decks where id = $1 and owner_id = $2`, [Number(c.req.param('id')) || 0, c.get('userId')])
    return c.json({ ok: true })
  })

  // Subscribe ({ code } for a private deck shared by link) / unsubscribe.
  app.post('/decks/:id/subscribe', requireUser, async (c) => {
    const s = db(), uid = c.get('userId'), body = await c.req.json().catch(() => ({}))
    const d = await visibleDeck(s, Number(c.req.param('id')) || 0, uid, str(body.code) || null)
    if (d.owner_id === uid) fail(400, 'It’s your own deck.')
    const [{ n }] = await s.query(`select count(*)::int as n from lingora_deck_subs where user_id = $1`, [uid])
    if (n >= DECK_LIMITS.subscriptions) fail(409, `You can follow up to ${DECK_LIMITS.subscriptions} decks.`)
    await s.query(`insert into lingora_deck_subs (deck_id, user_id) values ($1, $2) on conflict do nothing`, [d.id, uid])
    noteTrophies(d.owner_id)
    return c.json(await detail(s, await visibleDeck(s, d.id, uid, null), uid))
  })
  app.delete('/decks/:id/subscribe', requireUser, async (c) => {
    await db().query(`delete from lingora_deck_subs where deck_id = $1 and user_id = $2`, [Number(c.req.param('id')) || 0, c.get('userId')])
    return c.json({ ok: true })
  })

  // { stars }: once you've reviewed at least DECK_LIMITS.rateAfter of its cards.
  app.post('/decks/:id/rate', requireUser, async (c) => {
    const s = db(), uid = c.get('userId'), body = await c.req.json().catch(() => ({}))
    const d = await visibleDeck(s, Number(c.req.param('id')) || 0, uid, null)
    if (d.owner_id === uid) fail(400, 'You can’t rate your own deck.')
    const stars = Number(body.stars)
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) fail(400, 'Pick 1 to 5 stars.')
    const [{ n }] = await s.query(`select count(distinct item_id)::int as n from lingora_review_logs where user_id = $1 and item_id like $2`, [uid, `${d.lang}-deck${d.id}-%`])
    if (n < DECK_LIMITS.rateAfter) fail(409, `Study ${DECK_LIMITS.rateAfter} of its cards first (${n} so far).`)
    await s.query(`insert into lingora_deck_ratings (deck_id, user_id, stars) values ($1, $2, $3) on conflict (deck_id, user_id) do update set stars = $3`, [d.id, uid, stars])
    return c.json(await detail(s, await visibleDeck(s, d.id, uid, null), uid))
  })

  // { reason, note }: goes to the admin dashboard's reports queue, about the deck's owner.
  app.post('/decks/:id/report', requireUser, async (c) => {
    const s = db(), uid = c.get('userId'), body = await c.req.json().catch(() => ({}))
    const d = await visibleDeck(s, Number(c.req.param('id')) || 0, uid, str(body.code) || null)
    const r = await fileReport(uid, { kind: 'user', userId: d.owner_id, reason: body.reason, note: `Deck #${d.id} “${d.title}”: ${clean(body.note, 300)}`.slice(0, 500) })
    if (!r.ok) fail(r.status as 400, r.message)
    return c.json({ ok: true })
  })

  // Admins: take a public deck down (or put it back).
  app.post('/decks/:id/hide', requireUser, async (c) => {
    const s = db(), uid = c.get('userId'), body = await c.req.json().catch(() => ({}))
    const [admin] = await s.query(`select 1 from users where id = $1 and is_admin`, [uid])
    if (!admin) fail(403, 'Admins only.')
    const id = Number(c.req.param('id')) || 0
    await s.query(`update lingora_decks set hidden_at = case when $2 then now() else null end where id = $1`, [id, body.hidden !== false])
    await audit(uid, body.hidden !== false ? 'deck.hide' : 'deck.unhide', null, { deck: id })
    return c.json({ ok: true })
  })
}

export { deckItemId }
