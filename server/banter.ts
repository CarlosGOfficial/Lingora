import type { Hono } from 'hono'
import type { Sql } from './db'
import { db, fail, requireUser, str, type Env } from './http'

/*
 * Banter (the chat app) and Wordle Unlimited share this database. From here Lingora reads:
 * who's on Banter and how they've styled their profile (chat.profiles), Banter server
 * invites (chat.servers, for invite cards), and Wordle profile pictures (profile_pictures).
 * Lingora never writes to their tables.
 */

export const BANTER_URL = (process.env.BANTER_URL || 'https://chat-vdwd.onrender.com').replace(/\/$/, '')
export const WORDLE_URL = (process.env.WORDLE_URL || 'https://wordle-unlimited-u1dj.onrender.com').replace(/\/$/, '')

/** Wordle profile pictures are served here too (same table, same path), so the URLs work as-is. */
export function avatarUrl(url: unknown): string | null {
  const u = str(url)
  return u.startsWith('/api/avatars/') || /^https:\/\//.test(u) ? u : null
}

const HEX = /^#[0-9a-f]{6}$/i
const PRESETS: Record<string, string> = {
  grape: 'linear-gradient(120deg, #7c3aed 0%, #c026d3 100%)',
  sunrise: 'linear-gradient(120deg, #f59e0b 0%, #ef4444 60%, #c026d3 100%)',
  unlimited: 'linear-gradient(110deg, #7c3aed 0%, #f59e0b 100%)',
  tiles: 'repeating-linear-gradient(90deg, #6aaa64 0 40px, #c9b458 40px 80px, #787c7e 80px 120px)',
  meadow: 'linear-gradient(120deg, #16a34a 0%, #6aaa64 50%, #c9b458 100%)',
  ocean: 'linear-gradient(120deg, #0ea5e9 0%, #6366f1 100%)',
  midnight: 'linear-gradient(120deg, #0f172a 0%, #312e81 60%, #7c3aed 100%)',
  candy: 'linear-gradient(120deg, #f472b6 0%, #a78bfa 50%, #60a5fa 100%)',
  ember: 'radial-gradient(circle at 20% 120%, #f97316 0%, #b91c1c 45%, #1c1917 100%)',
  mint: 'linear-gradient(120deg, #34d399 0%, #22d3ee 100%)',
}

function gradient(g: unknown): string | null {
  const x = g as { colors?: unknown; angle?: unknown } | null
  const colors = Array.isArray(x?.colors) ? x!.colors.filter((c): c is string => typeof c === 'string' && HEX.test(c)).slice(0, 3) : []
  const angle = Number(x?.angle)
  return colors.length >= 2 && Number.isFinite(angle) ? `linear-gradient(${Math.round(angle) % 360}deg, ${colors.join(', ')})` : null
}

/** What Lingora shows of someone's Banter profile. Everything is re-checked: it ends up in CSS. */
export type BanterLook = {
  banner: { css: string } | { image: string }
  accent: string
  card: string | null
  status: { emoji: string; text: string } | null
  pronouns: string | null
}

function lookOf(style: unknown): BanterLook {
  const s = (style ?? {}) as Record<string, any>
  const b = s.banner ?? {}
  let banner: BanterLook['banner'] = { css: PRESETS.unlimited }
  if (b.kind === 'preset' && PRESETS[b.id]) banner = { css: PRESETS[b.id] }
  else if (b.kind === 'color' && HEX.test(str(b.color))) banner = { css: b.color }
  else if (b.kind === 'gradient' && gradient(b.gradient)) banner = { css: gradient(b.gradient)! }
  else if (b.kind === 'image' && /^[0-9a-f-]{36}$/.test(str(b.imageId))) banner = { image: `/api/chat-images/${b.imageId}` }
  const status = s.status && (str(s.status.emoji) || str(s.status.text)) ? { emoji: str(s.status.emoji).slice(0, 16), text: str(s.status.text).slice(0, 60) } : null
  return {
    banner,
    accent: HEX.test(str(s.accent)) ? s.accent : '#7c3aed',
    card: gradient(s.card),
    status,
    pronouns: str(s.pronouns).slice(0, 24) || null,
  }
}

/** id → their Banter look, for the people who have opened Banter. */
export async function banterLooks(s: Sql, ids: string[]): Promise<Map<string, BanterLook>> {
  const out = new Map<string, BanterLook>()
  if (!ids.length) return out
  try {
    const rows = await s`select user_id, style from chat.profiles where user_id = any(${[...new Set(ids)]}::text[])`
    for (const r of rows) out.set(r.user_id as string, lookOf(r.style))
  } catch { /* Banter's tables aren't in this database */ }
  return out
}

/** People who chose Invisible in Banter: offline here too. */
export async function invisibleIds(s: Sql, ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set()
  try {
    const rows = await s`select user_id from chat.profiles where user_id = any(${[...new Set(ids)]}::text[]) and style->>'presence' = 'invisible'`
    return new Set(rows.map((r) => r.user_id as string))
  } catch {
    return new Set()
  }
}

/** Friends in a Wordle Unlimited game right now (its players/rooms tables): room code and lobby/playing. */
export async function wordleGames(s: Sql, ids: string[]): Promise<Map<string, { code: string; status: string }>> {
  const out = new Map<string, { code: string; status: string }>()
  if (!ids.length) return out
  try {
    const rows = await s`select p.user_id, r.code, r.status from players p join rooms r on r.id = p.room_id
      where p.user_id = any(${[...new Set(ids)]}::text[]) and p.last_seen > now() - interval '45 seconds' order by p.last_seen desc`
    for (const r of rows) if (!out.has(r.user_id as string)) out.set(r.user_id as string, { code: r.code as string, status: r.status as string })
  } catch { /* no Wordle tables */ }
  return out
}

export function registerBanterRoutes(app: Hono<Env, any, any>) {
  // Where the other two apps live (for links like "Open in Banter").
  app.get('/config', (c) => c.json({ banterUrl: BANTER_URL, wordleUrl: WORDLE_URL }))

  // Wordle profile pictures (its profile_pictures table).
  app.get('/avatars/:userId', async (c) => {
    try {
      const [row] = await db()`select mime, data from profile_pictures where user_id = ${c.req.param('userId')}`
      if (!row) return c.body(null, 404)
      return c.body(Buffer.from(row.data as string, 'base64'), 200, {
        'Content-Type': row.mime as string,
        'Cache-Control': 'public, max-age=31536000, immutable', // URLs carry ?v=<upload time>
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
      })
    } catch {
      return c.body(null, 404)
    }
  })

  // Voice messages sent from Banter (chat.voice_notes). Ids are random: only people who got the message can find them.
  app.get('/voice-notes/:id', requireUser, async (c) => {
    try {
      const [row] = await db()`select mime, data from chat.voice_notes where id = ${c.req.param('id')}`
      if (!row) return c.body(null, 404)
      return c.body(Buffer.from(row.data as string, 'base64'), 200, {
        'Content-Type': row.mime as string, 'Cache-Control': 'private, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff',
      })
    } catch {
      return c.body(null, 404)
    }
  })

  // Files sent from Banter (chat.files): always downloaded, never shown inline.
  app.get('/files/:id', requireUser, async (c) => {
    try {
      const [row] = await db()`select name, data from chat.files where id = ${c.req.param('id')}`
      if (!row) return c.body(null, 404)
      return c.body(Buffer.from(row.data as string, 'base64'), 200, {
        'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(row.name as string)}`,
        'Cache-Control': 'private, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox",
      })
    } catch {
      return c.body(null, 404)
    }
  })

  // A Banter server invite, for the card in chats: name, icon and size.
  app.get('/banter/invites/:code', requireUser, async (c) => {
    const code = c.req.param('code')
    if (!/^[A-Za-z0-9]{4,16}$/.test(code)) fail(404, 'That invite is invalid or has expired.')
    let row: Record<string, any> | undefined
    try {
      ;[row] = await db()`select s.name, s.color, s.emoji, s.icon_image_id, s.banner_image_id,
          (select count(*)::int from chat.members m where m.server_id = s.id) as members,
          exists(select 1 from chat.members m where m.server_id = s.id and m.user_id = ${c.get('userId')}) as joined
        from chat.servers s where s.invite_code = ${code}`
    } catch { /* no Banter tables */ }
    if (!row) fail(404, 'That invite is invalid or has expired.')
    return c.json({
      name: row!.name, color: HEX.test(str(row!.color)) ? row!.color : '#0d9488', emoji: row!.emoji ?? null,
      icon: row!.icon_image_id ? `/api/chat-images/${row!.icon_image_id}` : null,
      banner: row!.banner_image_id ? `/api/chat-images/${row!.banner_image_id}` : null,
      members: row!.members, joined: row!.joined, url: `${BANTER_URL}/invite/${code}`,
    })
  })
}
