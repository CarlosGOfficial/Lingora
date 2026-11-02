// Load .env.local, then .env (Node 21.7+; existing variables are never overwritten, so
// .env.local wins). Real environments set variables directly. A copy of Wordle
// Unlimited's .env works as-is: only DATABASE_URL is read.
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file)
  } catch {
    /* file missing — fine */
  }
}

export const DATABASE_URL = process.env.DATABASE_URL ?? ''
export const PORT = Number(process.env.API_PORT ?? process.env.PORT ?? 8787)
/** Enables the AI conversation mode. Server-side only — never expose it to the client. */
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? ''
export const CHAT_MODEL = process.env.LINGORA_CHAT_MODEL || 'claude-opus-5-5'
/** Optional GIF search in chats (the same key Wordle Unlimited uses). */
export const GIPHY_API_KEY = process.env.GIPHY_API_KEY ?? ''
export const IS_PROD = process.argv.includes('--prod') || process.env.NODE_ENV === 'production'
