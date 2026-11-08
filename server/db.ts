import { neon, neonConfig } from '@neondatabase/serverless'
import { DATABASE_URL } from './env'

// Development only: point the driver at a local Postgres through scripts/neon-local.mjs.
if (process.env.NEON_FETCH_ENDPOINT) neonConfig.fetchEndpoint = process.env.NEON_FETCH_ENDPOINT

/** Neon HTTP driver; null until DATABASE_URL is configured. */
export const sql = DATABASE_URL ? neon(DATABASE_URL) : null

export type Sql = NonNullable<typeof sql>
