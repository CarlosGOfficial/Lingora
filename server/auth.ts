import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

/*
 * Password hashes use the exact format of Wordle Unlimited (server/auth/index.ts in
 * that project): "<hex salt>:<hex scrypt key>", with the hex salt string passed to
 * scrypt as-is. Both apps share the `users` table, so one account works in both.
 */
const scrypt = promisify(scryptCb) as (password: string, salt: string, keylen: number) => Promise<Buffer>

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = await scrypt(password, salt, 64)
  return `${salt}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const derived = await scrypt(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return expected.length === derived.length && timingSafeEqual(expected, derived)
}

/** Same rule as Wordle Unlimited, so usernames are valid in both apps. */
export const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/

/** Session tokens go to the browser; only their SHA-256 is stored. */
export const newSessionToken = () => randomBytes(32).toString('base64url')
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
