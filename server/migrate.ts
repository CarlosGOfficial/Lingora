import { sql } from './db'
import { SCHEMA } from './schema'

if (!sql) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.')
  process.exit(1)
}

const before = new Set((await sql.query(`select table_name from information_schema.tables where table_schema = 'public'`)).map((t) => t.table_name))
for (const name of ['users', 'saved_themes']) {
  console.log(before.has(name) ? `• ${name}: already exists (shared with Wordle Unlimited, left untouched)` : `• ${name}: missing, creating it`)
}
for (const statement of SCHEMA) await sql.query(statement)
const lingora = await sql.query(`select table_name from information_schema.tables where table_schema = 'public' and table_name like 'lingora\\_%' order by table_name`)
console.log(`Migration complete. Lingora tables: ${lingora.map((t) => t.table_name).join(', ')}`)
