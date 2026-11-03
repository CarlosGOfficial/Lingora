import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { hashToken } from './auth'
import { sql, type Sql } from './db'

/** Helpers shared by every route module. */

export type Env = { Variables: { userId: string } }

export const SESSION_COOKIE = 'lg_sid'

export const fail = (status: 400 | 401 | 403 | 404 | 409 | 413 | 429 | 502 | 503, message: string): never => {
  throw new HTTPException(status, { message })
}

export function db(): Sql {
  return sql ?? fail(503, 'The database isn’t configured yet.')
}

export const str = (v: unknown) => (typeof v === 'string' ? v : '')

/* ---------- In-memory rate limits ---------- */
const hits = new Map<string, { n: number; reset: number }>()
export function rateLimit(c: Context, bucket: string, max: number, windowMs: number, message: string) {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? 'local'
  const key = `${bucket}:${ip}`
  const now = Date.now()
  const h = hits.get(key)
  if (!h || h.reset < now) hits.set(key, { n: 1, reset: now + windowMs })
  else if (++h.n > max) fail(429, message)
}

/**
 * Counts failures only (for PIN sign-in): blocked once `max` failures happened within
 * the window. In memory, so it resets on restart; that's fine for slowing down guessing.
 */
export class FailureLimiter {
  private hits = new Map<string, number[]>()
  constructor(private max: number, private windowMs: number) {}
  private recent(key: string) {
    const cutoff = Date.now() - this.windowMs
    const list = (this.hits.get(key) ?? []).filter((t) => t > cutoff)
    if (list.length) this.hits.set(key, list)
    else this.hits.delete(key)
    return list
  }
  blocked(key: string) {
    return this.recent(key).length >= this.max
  }
  fail(key: string) {
    this.hits.set(key, [...this.recent(key), Date.now()])
  }
}

export const clientIp = (c: Context) => c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? 'local'

/* ---------- Sessions ---------- */
export const requireUser = createMiddleware<Env>(async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) fail(401, 'Please sign in.')
  const rows = await db()`select user_id from lingora_sessions where token_hash = ${hashToken(token!)} and expires_at > now()`
  if (!rows.length) fail(401, 'Your session has expired. Please sign in again.')
  c.set('userId', rows[0].user_id as string)
  await next()
})

/** The signed-in user's id, or null (never throws). */
export async function currentUserId(c: Context): Promise<string | null> {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token || !sql) return null
  const rows = await sql`select user_id from lingora_sessions where token_hash = ${hashToken(token)} and expires_at > now()`
  return (rows[0]?.user_id as string | undefined) ?? null
}
