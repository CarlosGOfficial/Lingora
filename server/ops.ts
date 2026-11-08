/*
 * Ops: what the three apps (Banter, Wordle Unlimited, Lingora) share for running them.
 * KEEP THIS FILE IDENTICAL in all three repositories (server/ops.ts): `npm run check:shared`
 * in Banter compares the copies. Each app passes its own way of running a query.
 *
 * - The `ops` Postgres schema (OPS_SCHEMA): errors, heartbeats, the admin audit log,
 *   reports, account suspensions, announcements, sign-in handoffs and smoke-test runs.
 *   Every app creates it at start-up (idempotent).
 * - Error tracking: console.error is captured, labelled with the request's route, grouped
 *   and written to ops.errors in batches. The admin dashboard (Wordle /admin) shows them.
 * - A heartbeat per app (commit, start time, address) for the dashboard's Health tab.
 * - Small shared helpers: suspensions and announcements.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";

export type OpsApp = "banter" | "wordle" | "lingora";
/** Runs one SQL statement and resolves to its rows. */
export type OpsQuery = (text: string, params?: unknown[]) => Promise<any[]>;

export const OPS_APPS: OpsApp[] = ["banter", "wordle", "lingora"];

export const OPS_SCHEMA = [
  `create schema if not exists ops`,
  `create table if not exists ops.errors (
    fingerprint text primary key,
    app text not null,
    route text not null,
    message text not null,
    stack text,
    count int not null default 0,
    first_seen timestamptz not null default now(),
    last_seen timestamptz not null default now(),
    resolved_at timestamptz
  )`,
  `create index if not exists ops_errors_last_idx on ops.errors(last_seen desc)`,
  `create table if not exists ops.heartbeats (
    app text primary key,
    commit text,
    url text,
    node text,
    started_at timestamptz not null,
    last_seen timestamptz not null default now()
  )`,
  `create table if not exists ops.audit (
    id bigserial primary key,
    actor_id text,
    app text not null,
    action text not null,
    target_id text,
    detail jsonb not null default '{}'::jsonb,
    at timestamptz not null default now()
  )`,
  `create index if not exists ops_audit_target_idx on ops.audit(target_id, at desc)`,
  `create table if not exists ops.reports (
    id bigserial primary key,
    reporter_id text not null references users(id) on delete cascade,
    target_user_id text references users(id) on delete cascade,
    app text not null,
    kind text not null,
    message_id bigint,
    server_id int,
    excerpt text,
    reason text not null,
    note text,
    status text not null default 'open',
    action text,
    handled_by text,
    handled_at timestamptz,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists ops_reports_open_idx on ops.reports(status, created_at desc)`,
  `create index if not exists ops_reports_server_idx on ops.reports(server_id, status) where server_id is not null`,
  `create table if not exists ops.suspensions (
    user_id text primary key references users(id) on delete cascade,
    reason text not null,
    until timestamptz,
    by_id text,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists ops.announcements (
    id serial primary key,
    text text not null,
    tone text not null default 'info',
    apps text[] not null,
    starts_at timestamptz not null default now(),
    ends_at timestamptz not null,
    created_by text,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists ops.handoffs (
    token_hash text primary key,
    user_id text not null references users(id) on delete cascade,
    to_app text not null,
    path text not null,
    expires_at timestamptz not null,
    used_at timestamptz
  )`,
  `create table if not exists ops.smoke_runs (
    id bigserial primary key,
    trigger text not null,
    started_at timestamptz not null default now(),
    finished_at timestamptz,
    ok boolean,
    steps jsonb not null default '[]'::jsonb
  )`,
];

let query: OpsQuery | null = null;
let thisApp: OpsApp = "wordle";
const original = { error: console.error.bind(console), warn: console.warn.bind(console) };

/* ---------- Request context (so errors say which route they came from) ---------- */

const context = new AsyncLocalStorage<{ route: string }>();

/** "/api/clans/12/requests/abc-uuid" → "/api/clans/:id/requests/:id" */
export function routeOf(method: string, path: string) {
  const parts = path.split("?")[0].split("/").map((p) =>
    /^\d+$/.test(p) || /^[0-9a-f-]{20,}$/i.test(p) || /^[A-Za-z0-9_-]{24,}$/.test(p) ? ":id" : /^[A-Z0-9]{4}$/.test(p) ? ":code" : p,
  );
  return `${method.toUpperCase()} ${parts.join("/").slice(0, 200)}`;
}

/** Run the rest of a request with its route remembered (Express and Hono middleware call this). */
export const withRoute = <T>(method: string, path: string, next: () => T): T => context.run({ route: routeOf(method, path) }, next);

/* ---------- Error tracking ---------- */

type Pending = { route: string; message: string; stack: string | null; count: number; at: Date };
const pending = new Map<string, Pending>();
const MAX_PENDING = 200;

function describe(args: unknown[]) {
  const err = args.find((a): a is Error => a instanceof Error);
  const text = args.filter((a) => typeof a === "string").join(" ").trim();
  const extra = !err ? args.find((a) => a && typeof a === "object") : undefined;
  // Database libraries wrap the real problem ("Failed query: …") in err.cause.
  const inner = (err as { cause?: unknown } | undefined)?.cause;
  const cause = inner instanceof Error ? inner.message : "";
  let message = [text, err?.message ?? (extra ? JSON.stringify(extra).slice(0, 300) : ""), cause && `(cause: ${cause})`]
    .filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  if (!message) message = "(no message)";
  return { message: message.slice(0, 1000), stack: err?.stack?.slice(0, 4000) ?? null };
}

/** Same kind of error = same group: numbers, ids and quoted values don't split groups. */
function fingerprint(route: string, message: string, stack: string | null) {
  const shape = message.replace(/"[^"]*"|'[^']*'/g, "…").replace(/[0-9a-f]{8,}(-[0-9a-f]{4,})*/gi, "#").replace(/\d+/g, "#");
  const frame = stack?.split("\n").find((l) => l.trim().startsWith("at ") && !l.includes("node_modules")) ?? "";
  return createHash("sha1").update(`${thisApp}|${route}|${shape}|${frame.replace(/:\d+:\d+\)?$/, "")}`).digest("hex");
}

/** Record an error for the dashboard (console.error does this for you). */
export function trackError(args: unknown[]) {
  if (!query) return;
  const { message, stack } = describe(args);
  if (message.startsWith("[ops]")) return; // our own problems, never loop
  const route = context.getStore()?.route ?? "(background)";
  const key = fingerprint(route, message, stack);
  const p = pending.get(key);
  if (p) { p.count++; p.at = new Date(); p.message = message; p.stack = stack ?? p.stack; return; }
  if (pending.size >= MAX_PENDING) return;
  pending.set(key, { route, message, stack, count: 1, at: new Date() });
}

async function flushErrors() {
  if (!query || !pending.size) return;
  const batch = Array.from(pending.entries());
  pending.clear();
  for (const [key, p] of batch) {
    await query(
      `insert into ops.errors (fingerprint, app, route, message, stack, count, first_seen, last_seen) values ($1, $2, $3, $4, $5, $6, $7, $7)
       on conflict (fingerprint) do update set count = ops.errors.count + excluded.count, last_seen = excluded.last_seen,
         message = excluded.message, stack = coalesce(excluded.stack, ops.errors.stack), resolved_at = null`,
      [key, thisApp, p.route, p.message, p.stack, p.count, p.at],
    ).catch((err) => original.warn("[ops] Couldn't save an error:", err?.message));
  }
}

/* ---------- Heartbeat ---------- */

const startedAt = new Date();
async function heartbeat() {
  if (!query) return;
  const commit = process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || null;
  const url = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || null;
  await query(
    `insert into ops.heartbeats (app, commit, url, node, started_at, last_seen) values ($1, $2, $3, $4, $5, now())
     on conflict (app) do update set commit = $2, url = coalesce($3, ops.heartbeats.url), node = $4, started_at = $5, last_seen = now()`,
    [thisApp, commit, url, process.version, startedAt],
  ).catch((err) => original.warn("[ops] Heartbeat failed:", err?.message));
}

/* ---------- Start ---------- */

let started = false;
/** Create the ops tables, start capturing errors and sending heartbeats. Safe to call once at start-up. */
export async function startOps(app: OpsApp, run: OpsQuery) {
  if (started) return;
  started = true;
  thisApp = app;
  for (const statement of OPS_SCHEMA) {
    try { await run(statement); } catch (err: any) { original.warn("[ops] Setting up the ops tables failed:", err?.message); return; }
  }
  query = run;
  console.error = (...args: unknown[]) => { original.error(...args); trackError(args); };
  void heartbeat();
  setInterval(() => void heartbeat(), 60_000).unref();
  setInterval(() => void flushErrors(), 10_000).unref();
}

/** Write any errors still waiting (tests, shutdown). */
export const flushOps = flushErrors;

/* ---------- Suspensions ---------- */

export type Suspension = { reason: string; until: string | null };
const suspensionCache = new Map<string, { at: number; value: Suspension | null }>();

/** Is this account suspended right now? Cached for 30 seconds per account. */
export async function suspensionOf(userId: string): Promise<Suspension | null> {
  if (!query || !userId) return null;
  const hit = suspensionCache.get(userId);
  if (hit && Date.now() - hit.at < 30_000) return hit.value;
  const rows = await query(`select reason, until from ops.suspensions where user_id = $1 and (until is null or until > now())`, [userId]).catch(() => []);
  const value = rows[0] ? { reason: String(rows[0].reason), until: rows[0].until ? new Date(rows[0].until).toISOString() : null } : null;
  suspensionCache.set(userId, { at: Date.now(), value });
  if (suspensionCache.size > 5000) suspensionCache.clear();
  return value;
}
/** Forget a cached answer (after suspending or lifting a suspension in this process). */
export const forgetSuspension = (userId: string) => suspensionCache.delete(userId);

/** The message shown to a suspended account. */
export const suspendedMessage = (s: Suspension) =>
  `This account is suspended${s.until ? ` until ${s.until.slice(0, 16).replace("T", " ")} UTC` : ""}: ${s.reason}`;

/* ---------- Announcements ---------- */

export type Announcement = { id: number; text: string; tone: "info" | "warn" | "celebrate"; endsAt: string };
let announcementCache: { at: number; list: Announcement[] } | null = null;

/** Announcements showing now in this app (cached for 30 seconds). */
export async function activeAnnouncements(): Promise<Announcement[]> {
  if (!query) return [];
  if (announcementCache && Date.now() - announcementCache.at < 30_000) return announcementCache.list;
  const rows = await query(
    `select id, text, tone, ends_at from ops.announcements where $1 = any(apps) and starts_at <= now() and ends_at > now() order by starts_at desc limit 3`,
    [thisApp],
  ).catch(() => []);
  const list = rows.map((r) => ({ id: Number(r.id), text: String(r.text), tone: r.tone, endsAt: new Date(r.ends_at).toISOString() }));
  announcementCache = { at: Date.now(), list };
  return list;
}

/** Write an entry to the shared admin audit log. */
export async function audit(actorId: string | null, action: string, targetId: string | null, detail: Record<string, unknown> = {}) {
  if (!query) return;
  await query(`insert into ops.audit (actor_id, app, action, target_id, detail) values ($1, $2, $3, $4, $5::jsonb)`, [actorId, thisApp, action, targetId, JSON.stringify(detail)])
    .catch((err) => original.warn("[ops] Audit log failed:", err?.message));
}
