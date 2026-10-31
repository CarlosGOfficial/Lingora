import { neon } from '@neondatabase/serverless'
import { DATABASE_URL } from './env'

/** Neon HTTP driver; null until DATABASE_URL is configured. */
export const sql = DATABASE_URL ? neon(DATABASE_URL) : null

export type Sql = NonNullable<typeof sql>
