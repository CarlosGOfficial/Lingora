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

/* ---------- Reports ---------- */

export const REPORT_REASONS = ["spam", "harassment", "hate", "sexual", "violence", "self_harm", "impersonation", "cheating", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportKind = "user" | "dm" | "group" | "channel";
export type ReportInput = { kind?: unknown; userId?: unknown; messageId?: unknown; reason?: unknown; note?: unknown };
/** What Banter works out for a server-channel message (it checks the reporter can see it). */
export type ChannelTarget = { messageId: number; senderId: string | null; content: string; serverId: number };
export type ReportResult = { ok: true; id: number } | { ok: false; status: number; message: string };

const REPORTS_PER_HOUR = 10;
const MESSAGE_TABLE: Record<Exclude<ReportKind, "user">, string> = { dm: "direct_messages", group: "group_messages", channel: "chat.messages" };

/**
 * File a report about a person or a message they sent. DMs and group messages are checked
 * here (the reporter must be in that conversation); channel messages are checked by Banter,
 * which passes the result as `channel`.
 */
export async function fileReport(reporterId: string, input: ReportInput, channel?: ChannelTarget): Promise<ReportResult> {
  if (!query) return { ok: false, status: 503, message: "Reports aren't available right now." };
  const no = (status: number, message: string): ReportResult => ({ ok: false, status, message });
  const kind = String(input.kind ?? "") as ReportKind;
  const reason = String(input.reason ?? "") as ReportReason;
  if (!["user", "dm", "group", "channel"].includes(kind)) return no(400, "Choose what you're reporting.");
  if (!REPORT_REASONS.includes(reason)) return no(400, "Choose a reason.");
  const note = String(input.note ?? "").trim().slice(0, 500) || null;
  const [{ n }] = await query(`select count(*)::int as n from ops.reports where reporter_id = $1 and created_at > now() - interval '1 hour'`, [reporterId]);
  if (n >= REPORTS_PER_HOUR) return no(429, "You've sent a lot of reports. Try again in a while.");

  let target: string | null = null, messageId: number | null = null, excerpt: string | null = null, serverId: number | null = null;
  if (kind === "user") {
    target = String(input.userId ?? "");
    if (!target || target === reporterId) return no(400, "Choose someone to report.");
    if (!(await query(`select 1 from users where id = $1`, [target])).length) return no(404, "That person isn't here any more.");
  } else {
    messageId = Number(input.messageId);
    if (!Number.isInteger(messageId) || messageId <= 0) return no(400, "Choose a message to report.");
    let row: { sender: string | null; content: string } | undefined;
    if (kind === "dm") {
      [row] = await query(`select from_user_id as sender, content from direct_messages where id = $1 and deleted_at is null and (from_user_id = $2 or to_user_id = $2)`, [messageId, reporterId]);
    } else if (kind === "group") {
      [row] = await query(`select m.from_user_id as sender, m.content from group_messages m join group_members gm on gm.group_id = m.group_id and gm.user_id = $2
        where m.id = $1 and m.deleted_at is null`, [messageId, reporterId]);
    } else if (channel && channel.messageId === messageId) {
      row = { sender: channel.senderId, content: channel.content };
      serverId = channel.serverId;
    }
    if (!row) return no(404, "That message is gone.");
    if (row.sender === reporterId) return no(400, "You can't report your own message.");
    target = row.sender;
    excerpt = row.content.slice(0, 500);
  }
  const dupe = await query(
    `select 1 from ops.reports where reporter_id = $1 and status = 'open' and kind = $2 and (message_id = $3 or ($3::bigint is null and target_user_id = $4))`,
    [reporterId, kind, messageId, target],
  );
  if (dupe.length) return no(409, "You've already reported this. Thanks, we're looking into it.");
  const [r] = await query(
    `insert into ops.reports (reporter_id, target_user_id, app, kind, message_id, server_id, excerpt, reason, note) values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id`,
    [reporterId, target, thisApp, kind, messageId, serverId, excerpt, reason, note],
  );
  return { ok: true, id: Number(r.id) };
}

export type ReportAction = "dismiss" | "delete_message" | "actioned";

/**
 * Close a report. "delete_message" also removes the reported message (as a deletion by
 * moderators). With `serverId`, only that Banter server's reports can be handled.
 */
export async function handleReport(reportId: number, byId: string, action: ReportAction, serverId?: number): Promise<ReportResult> {
  if (!query) return { ok: false, status: 503, message: "Reports aren't available right now." };
  if (!["dismiss", "delete_message", "actioned"].includes(action)) return { ok: false, status: 400, message: "Unknown action." };
  const [rep] = await query(`select id, kind, message_id, server_id, status from ops.reports where id = $1`, [reportId]);
  if (!rep || (serverId !== undefined && Number(rep.server_id) !== serverId)) return { ok: false, status: 404, message: "That report is gone." };
  if (action === "delete_message") {
    const table = MESSAGE_TABLE[rep.kind as Exclude<ReportKind, "user">];
    if (!table || !rep.message_id) return { ok: false, status: 400, message: "This report isn't about a message." };
    await query(`update ${table} set deleted_at = coalesce(deleted_at, now()) where id = $1`, [rep.message_id]);
  }
  await query(`update ops.reports set status = $2, action = $3, handled_by = $4, handled_at = now() where id = $1`,
    [reportId, action === "dismiss" ? "dismissed" : "actioned", action, byId]);
  await audit(byId, `report.${action}`, null, { reportId, kind: rep.kind, messageId: rep.message_id, serverId: rep.server_id });
  return { ok: true, id: reportId };
}
