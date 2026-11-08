#!/usr/bin/env node
/*
 * Run Lingora against a plain local Postgres (no Neon account needed).
 *
 * Lingora's server talks to the database through Neon's HTTP driver, which can't reach an
 * ordinary Postgres. This tiny server speaks the same HTTP protocol and runs each query
 * on Postgres with `pg`:
 *
 *   node scripts/neon-local.mjs                       # listens on http://localhost:4444/sql
 *   DATABASE_URL=postgresql://user:pass@localhost:5432/db \
 *   NEON_FETCH_ENDPOINT=http://localhost:4444/sql npm start
 *
 * The database to use comes from each request's connection string (DATABASE_URL), so one
 * proxy serves any number of local databases. For development and tests only.
 */
import { createServer } from "node:http";
import pg from "pg";

const PORT = Number(process.env.NEON_LOCAL_PORT ?? 4444);
const pools = new Map();
const poolFor = (cs) => {
  if (!pools.has(cs)) pools.set(cs, new pg.Pool({ connectionString: cs, max: 10 }));
  return pools.get(cs);
};
// The driver expects every value as Postgres text and parses it itself.
const asText = { getTypeParser: () => (v) => v };

async function run(client, { query, params }) {
  const r = await client.query({ text: query, values: params ?? [], rowMode: "array", types: asText });
  return { command: r.command, rowCount: r.rowCount, rows: r.rows, fields: r.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })) };
}

createServer(async (req, res) => {
  if (req.method !== "POST") { res.writeHead(404).end(); return; }
  let body = "";
  for await (const chunk of req) body += chunk;
  const cs = req.headers["neon-connection-string"];
  const client = await poolFor(String(cs)).connect().catch((err) => { res.writeHead(500).end(String(err.message)); return null; });
  if (!client) return;
  try {
    const payload = JSON.parse(body);
    let out;
    if (Array.isArray(payload.queries)) {
      await client.query("begin");
      try {
        const results = [];
        for (const q of payload.queries) results.push(await run(client, q));
        await client.query("commit");
        out = { results };
      } catch (err) {
        await client.query("rollback");
        throw err;
      }
    } else {
      out = await run(client, payload);
    }
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(out));
  } catch (err) {
    // Neon answers query errors with 400 and the Postgres error's fields.
    res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({
      message: err.message, code: err.code, detail: err.detail, constraint: err.constraint, table: err.table, column: err.column, severity: err.severity,
    }));
  } finally {
    client.release();
  }
}).listen(PORT, () => console.log(`Neon-compatible proxy on http://localhost:${PORT}/sql`));
