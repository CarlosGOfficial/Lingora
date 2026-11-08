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
import { createHash, randomBytes } from "node:crypto";

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
  // Games in Banter calls: Banter writes the game, Wordle makes its room on first open.
  `create table if not exists ops.call_games (
    id text primary key,
    call_key text not null,
    mode text not null default 'normal',
    code text,
    created_by text,
    created_at timestamptz not null default now(),
    ended_at timestamptz
  )`,
  `create table if not exists ops.game_tickets (
    token_hash text primary key,
    user_id text not null references users(id) on delete cascade,
    game_id text not null references ops.call_games(id) on delete cascade,
    expires_at timestamptz not null,
    used_at timestamptz
  )`,
  `create table if not exists ops.inbox (
    id bigserial primary key,
    user_id text not null references users(id) on delete cascade,
    kind text not null,
    title text not null,
    body text not null default '',
    url jsonb not null default '{}'::jsonb,
    tag text,
    count int not null default 1,
    from_app text not null,
    created_at timestamptz not null default now(),
    read_at timestamptz
  )`,
  `create index if not exists ops_inbox_user_idx on ops.inbox(user_id, created_at desc)`,
  `create index if not exists ops_inbox_tag_idx on ops.inbox(user_id, tag) where read_at is null and tag is not null`,
  `create table if not exists ops.activity (
    id bigserial primary key,
    user_id text not null references users(id) on delete cascade,
    kind text not null,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists ops_activity_user_idx on ops.activity(user_id, created_at desc)`,
  `create table if not exists ops.activity_prefs (
    user_id text primary key references users(id) on delete cascade,
    hidden text[] not null default '{}'
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

/**
 * Is this account suspended right now? Request checks are cached for 15 seconds per account
 * (so a suspension made in another app reaches this one within 15 s); signing in passes
 * `fresh` and always asks the database.
 */
export async function suspensionOf(userId: string, fresh = false): Promise<Suspension | null> {
  if (!query || !userId) return null;
  const hit = suspensionCache.get(userId);
  if (!fresh && hit && Date.now() - hit.at < 15_000) return hit.value;
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

/* ---------- One sign-in across the apps (handoff links) ---------- */

/*
 * A link from one app to another carries a one-time token, so you arrive signed in. The
 * token lasts 60 seconds, works once, only for the app it was made for, and only sends you
 * to a page on that app (a path, never another site). The receiving app only switches
 * accounts when it isn't signed in yet (or is already signed in as the same person).
 */
const HANDOFF_SECONDS = 60;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** A same-site path to go to after signing in, or "/". */
export function safePath(path: unknown): string {
  const p = String(path ?? "/");
  return p.startsWith("/") && !p.startsWith("//") && !p.includes("\\") && p.length <= 500 && !/[\u0000-\u001f]/.test(p) ? p : "/";
}

/** Where the three apps live: environment variables first, then each app's heartbeat. */
export async function appUrls(): Promise<Record<OpsApp, string | null>> {
  const env: Record<OpsApp, string | undefined> = {
    wordle: process.env.WORDLE_URL || process.env.VITE_WORDLE_URL,
    banter: process.env.BANTER_URL || process.env.VITE_BANTER_URL,
    lingora: process.env.LINGORA_URL || process.env.VITE_LINGORA_URL,
  };
  const beats = query ? await query(`select app, url from ops.heartbeats`).catch(() => []) : [];
  const out = {} as Record<OpsApp, string | null>;
  for (const app of OPS_APPS) {
    const url = env[app] || beats.find((b) => b.app === app)?.url || null;
    out[app] = url ? String(url).replace(/\/+$/, "") : null;
  }
  return out;
}

/** Make a handoff link into another app for this signed-in person. */
export async function createHandoff(userId: string, toApp: unknown, path: unknown): Promise<{ url: string } | { error: string }> {
  if (!query) return { error: "Not available right now." };
  if (!OPS_APPS.includes(toApp as OpsApp) || toApp === thisApp) return { error: "Unknown app." };
  const base = (await appUrls())[toApp as OpsApp];
  if (!base) return { error: "That app's address isn't known yet." };
  const token = randomBytes(32).toString("base64url");
  const target = safePath(path);
  await query(`delete from ops.handoffs where expires_at < now() - interval '1 hour'`).catch(() => {});
  await query(`insert into ops.handoffs (token_hash, user_id, to_app, path, expires_at) values ($1, $2, $3, $4, now() + make_interval(secs => $5))`,
    [sha256(token), userId, toApp, target, HANDOFF_SECONDS]);
  return { url: `${base}/api/handoff/redeem?token=${encodeURIComponent(token)}&to=${encodeURIComponent(target)}` };
}

/** Use a handoff token arriving at this app: who it's for and where to go, once. */
export async function redeemHandoff(token: unknown): Promise<{ userId: string; path: string } | null> {
  if (!query || typeof token !== "string" || token.length < 20 || token.length > 100) return null;
  const [row] = await query(
    `update ops.handoffs set used_at = now() where token_hash = $1 and to_app = $2 and used_at is null and expires_at > now() returning user_id, path`,
    [sha256(token), thisApp],
  );
  return row ? { userId: String(row.user_id), path: safePath(row.path) } : null;
}

/* ---------- Games in Banter calls ---------- */

/*
 * Starting a game in a Banter call writes ops.call_games (a random id). Each player gets a
 * single-use ticket (5 minutes) for Wordle's /embed/game/<id> page, which trades it for a seat
 * in the game's room as that account. The page lives in an iframe on Banter, where Wordle's
 * own sign-in cookie isn't sent, so the ticket stands in for it.
 */
const TICKET_SECONDS = 300;
export const CALL_GAME_MODES = ["normal", "blitz", "mystery"] as const;

export async function createCallGame(callKey: string, mode: unknown, userId: string): Promise<string | null> {
  if (!query) return null;
  const id = randomBytes(12).toString("base64url");
  const m = CALL_GAME_MODES.includes(mode as any) ? String(mode) : "normal";
  await query(`update ops.call_games set ended_at = now() where call_key = $1 and ended_at is null`, [callKey]);
  await query(`insert into ops.call_games (id, call_key, mode, created_by) values ($1, $2, $3, $4)`, [id, callKey, m, userId]);
  return id;
}

/** A link into the game for this person (Banter calls it for people in the call). */
export async function createGameTicket(userId: string, gameId: string): Promise<{ url: string } | { error: string }> {
  if (!query) return { error: "Not available right now." };
  const base = (await appUrls()).wordle;
  if (!base) return { error: "Wordle's address isn't known yet." };
  const [game] = await query(`select id from ops.call_games where id = $1 and ended_at is null`, [gameId]);
  if (!game) return { error: "That game has ended." };
  const token = randomBytes(32).toString("base64url");
  await query(`delete from ops.game_tickets where expires_at < now() - interval '1 hour'`).catch(() => {});
  await query(`insert into ops.game_tickets (token_hash, user_id, game_id, expires_at) values ($1, $2, $3, now() + make_interval(secs => $4))`,
    [sha256(token), userId, gameId, TICKET_SECONDS]);
  return { url: `${base}/embed/game/${encodeURIComponent(gameId)}#t=${token}` };
}

/** Use a ticket (Wordle): who it's for, once, for this game only. */
export async function redeemGameTicket(token: unknown, gameId: string): Promise<string | null> {
  if (!query || typeof token !== "string" || token.length < 20 || token.length > 100) return null;
  const [row] = await query(
    `update ops.game_tickets set used_at = now() where token_hash = $1 and game_id = $2 and used_at is null and expires_at > now() returning user_id`,
    [sha256(token), gameId],
  );
  return row ? String(row.user_id) : null;
}

/* ---------- Cross-app events ---------- */

/*
 * A themed week across the apps (ops.events with kind 'cross', made on Wordle's admin
 * dashboard): goals like "win 5 Wordles + finish 3 Lingora lessons + send 50 messages".
 * Progress is counted live from what each app already records, between the event's start
 * and end; the reward (coins and maybe an item) is claimed once, in one statement.
 */
export const CROSS_METRICS = {
  wordle_wins: { app: "wordle", label: "Win Wordle rounds" },
  wordle_daily: { app: "wordle", label: "Play the Wordle Daily" },
  lingora_lessons: { app: "lingora", label: "Finish Lingora lessons, stories or readers" },
  lingora_xp: { app: "lingora", label: "Earn Lingora XP" },
  lingora_reviews: { app: "lingora", label: "Review Lingora cards" },
  messages: { app: "banter", label: "Send chat messages (any app)" },
} as const;
export type CrossMetric = keyof typeof CROSS_METRICS;
export type CrossEvent = {
  id: number; name: string; emoji: string; description: string; startsAt: string; endsAt: string; live: boolean;
  goals: { metric: CrossMetric; label: string; app: OpsApp; target: number; done: number }[];
  reward: { coins: number; itemId: string | null; itemName: string | null };
  complete: boolean; claimed: boolean;
};
const CLAIM_DAYS = 7; // after the end, there's this long to claim

async function metricValue(metric: CrossMetric, userId: string, from: Date, to: Date): Promise<number> {
  if (!query) return 0;
  const ms = [from.getTime(), to.getTime()];
  const t = [from.toISOString(), to.toISOString()];
  const sqlFor: Record<CrossMetric, [string, unknown[]]> = {
    wordle_wins: [`select count(*)::int as n from round_stats where user_id = $1 and won and created_at >= ($2::timestamptz at time zone 'UTC') and created_at < ($3::timestamptz at time zone 'UTC')`, [userId, ...t]],
    wordle_daily: [`select count(*)::int as n from daily_results where user_id = $1 and finished and finished_at >= ($2::timestamptz at time zone 'UTC') and finished_at < ($3::timestamptz at time zone 'UTC')`, [userId, ...t]],
    lingora_lessons: [`select count(*)::int as n from lingora_completions where user_id = $1 and at_ms >= $2 and at_ms < $3`, [userId, ...ms]],
    lingora_xp: [`select coalesce(sum(xp), 0)::int as n from lingora_xp_events where user_id = $1 and at_ms >= $2 and at_ms < $3`, [userId, ...ms]],
    lingora_reviews: [`select count(*)::int as n from lingora_review_logs where user_id = $1 and at_ms >= $2 and at_ms < $3`, [userId, ...ms]],
    messages: [`select (
        (select count(*) from direct_messages where from_user_id = $1 and deleted_at is null and created_at >= ($2::timestamptz at time zone 'UTC') and created_at < ($3::timestamptz at time zone 'UTC'))
      + (select count(*) from group_messages where from_user_id = $1 and deleted_at is null and created_at >= ($2::timestamptz at time zone 'UTC') and created_at < ($3::timestamptz at time zone 'UTC'))
      + (select count(*) from chat.messages where from_user_id = $1 and deleted_at is null and created_at >= ($2::timestamptz at time zone 'UTC') and created_at < ($3::timestamptz at time zone 'UTC'))
    )::int as n`, [userId, ...t]],
  };
  const [text, params] = sqlFor[metric];
  const [row] = await query(text, params).catch(() => [{ n: 0 }]);
  return Number(row?.n ?? 0);
}

/** Live and upcoming (7 days) cross-app events, and recently ended ones you can still claim. */
export async function crossEvents(userId: string): Promise<CrossEvent[]> {
  if (!query) return [];
  const rows = await query(
    `select e.*, coalesce(p.tiers_paid, 0) as paid from ops.events e left join ops.event_progress p on p.event_id = e.id and p.user_id = $1
     where e.kind = 'cross' and not e.cancelled and e.starts_at < now() + interval '7 days' and e.ends_at > now() - make_interval(days => $2)
     order by e.starts_at limit 10`, [userId, CLAIM_DAYS]).catch(() => []);
  const out: CrossEvent[] = [];
  for (const e of rows) {
    const from = new Date(e.starts_at), to = new Date(e.ends_at), started = from.getTime() <= Date.now();
    const goals = [];
    for (const g of (e.goals ?? []) as { metric: CrossMetric; target: number }[]) {
      if (!CROSS_METRICS[g.metric]) continue;
      goals.push({ metric: g.metric, label: CROSS_METRICS[g.metric].label, app: CROSS_METRICS[g.metric].app as OpsApp, target: g.target, done: started ? Math.min(g.target, await metricValue(g.metric, userId, from, to)) : 0 });
    }
    const reward = ((e.tiers ?? [])[0] ?? {}) as { coins?: number; itemId?: string | null; itemName?: string | null };
    const live = started && to.getTime() > Date.now();
    // Ended and nothing to claim: leave it out.
    if (!live && started && Number(e.paid) > 0) continue;
    out.push({
      id: e.id, name: e.name, emoji: e.emoji, description: e.description, startsAt: from.toISOString(), endsAt: to.toISOString(), live,
      goals, reward: { coins: reward.coins ?? 0, itemId: reward.itemId ?? null, itemName: reward.itemName ?? null },
      complete: started && goals.length > 0 && goals.every((g) => g.done >= g.target), claimed: Number(e.paid) > 0,
    });
  }
  return out.filter((e) => e.live || !e.claimed && e.complete || new Date(e.startsAt).getTime() > Date.now());
}

/** Claim a finished event's reward (once). */
export async function claimCrossEvent(userId: string, eventId: number): Promise<{ coins: number; item: string | null } | { error: string }> {
  if (!query) return { error: "Not available right now." };
  const e = (await crossEvents(userId)).find((x) => x.id === eventId);
  if (!e) return { error: "That event isn't on." };
  if (e.claimed) return { error: "Already claimed." };
  if (!e.complete) return { error: "Finish every goal first." };
  const [row] = await query(
    `select tiers->0->>'itemType' as itemtype from ops.events where id = $1`, [eventId]).catch(() => [null]);
  const [r] = await query(
    `with claimed as (
       insert into ops.event_progress (event_id, user_id, tiers_paid) values ($1, $2, 1)
       on conflict (event_id, user_id) do update set tiers_paid = 1, updated_at = now() where ops.event_progress.tiers_paid = 0
       returning 1
     ), coins as (
       update users set coins = coins + $3 where id = $2 and exists (select 1 from claimed) and $3::int > 0 returning 1
     ), item as (
       insert into inventory (user_id, item_id, item_type) select $2, $4, $5 where exists (select 1 from claimed) and $4::text is not null
       on conflict do nothing returning 1
     )
     select exists (select 1 from claimed) as ok`,
    [eventId, userId, e.reward.coins, e.reward.itemId, row?.itemtype ?? "title"]);
  if (!r?.ok) return { error: "Already claimed." };
  return { coins: e.reward.coins, item: e.reward.itemName };
}

/* ---------- Activity hub: one inbox, and what friends have been up to ---------- */

/** What notify() sends (the same shape as PushEvent in server/push.ts). */
export type InboxEvent = { kind: string; title: string; body: string; tag?: string; url: Partial<Record<OpsApp, string>> };
const INBOX_KEEP_DAYS = 30;

/**
 * Save a notification to each person's inbox (called by notify() in server/push.ts, so every
 * notification in any app lands here, with or without push set up). An unread one with the
 * same tag is updated instead of repeated ("3 new messages from Sam").
 */
export async function recordInbox(userIds: string[], e: InboxEvent) {
  if (!query || !userIds.length) return;
  const url = JSON.stringify(e.url ?? {});
  for (const uid of userIds) {
    try {
      if (e.tag) {
        const merged = await query(
          `update ops.inbox set title = $3, body = $4, url = $5::jsonb, count = count + 1, created_at = now(), from_app = $6
           where id = (select id from ops.inbox where user_id = $1 and tag = $2 and read_at is null order by id desc limit 1) returning id`,
          [uid, e.tag, e.title.slice(0, 200), e.body.slice(0, 500), url, thisApp],
        );
        if (merged.length) continue;
      }
      await query(`insert into ops.inbox (user_id, kind, title, body, url, tag, from_app) values ($1, $2, $3, $4, $5::jsonb, $6, $7)`,
        [uid, e.kind, e.title.slice(0, 200), e.body.slice(0, 500), url, e.tag ?? null, thisApp]);
    } catch (err: any) {
      original.warn("[ops] Inbox write failed:", err?.message);
    }
  }
  if (Math.random() < 0.02) await query(`delete from ops.inbox where created_at < now() - make_interval(days => $1)`, [INBOX_KEEP_DAYS]).catch(() => {});
}

export type HubLink = { href: string; app: OpsApp; here: boolean };
export type InboxItem = { id: number; kind: string; title: string; body: string; count: number; at: string; read: boolean; link: HubLink | null };

/** Where an item opens: this app if it has a page for it, else the first app that does. */
function linkFor(url: Partial<Record<OpsApp, string>>, urls: Record<OpsApp, string | null>): HubLink | null {
  if (url[thisApp]) return { href: safePath(url[thisApp]), app: thisApp, here: true };
  for (const app of OPS_APPS) {
    const path = url[app];
    if (path && urls[app]) return { href: `${urls[app]}${safePath(path)}`, app, here: false };
  }
  return null;
}

export async function inboxOf(userId: string, limit = 40): Promise<{ items: InboxItem[]; unread: number }> {
  if (!query) return { items: [], unread: 0 };
  const [rows, [{ n }], urls] = await Promise.all([
    query(`select id, kind, title, body, url, count, created_at, read_at from ops.inbox where user_id = $1 order by created_at desc limit $2`, [userId, Math.min(100, limit)]),
    query(`select count(*)::int as n from ops.inbox where user_id = $1 and read_at is null`, [userId]),
    appUrls(),
  ]);
  return {
    unread: n,
    items: rows.map((r) => ({ id: Number(r.id), kind: r.kind, title: r.title, body: r.body, count: r.count, at: new Date(r.created_at).toISOString(), read: !!r.read_at, link: linkFor(r.url ?? {}, urls) })),
  };
}

/** Mark some (or, with no ids, all) of my inbox read. */
export async function markInboxRead(userId: string, ids?: unknown) {
  if (!query) return;
  const list = Array.isArray(ids) ? ids.map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 200) : null;
  if (list && !list.length) return;
  await query(`update ops.inbox set read_at = now() where user_id = $1 and read_at is null ${list ? "and id = any($2::bigint[])" : ""}`, list ? [userId, list] : [userId]);
}

/** Things friends can see, by kind. Everyone can hide any of them (activity_prefs.hidden). */
export const ACTIVITY_KINDS = ["wordle.daily", "wordle.level", "wordle.streak", "wordle.clan", "lingora.lesson", "lingora.level"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];
export type ActivityItem = { id: number; kind: ActivityKind; data: Record<string, unknown>; at: string; user: { id: string; name: string; avatar: string | null } };

/** Record something a person did, for their friends' feeds (unless they hide that kind). */
export async function recordActivity(userId: string, kind: ActivityKind, data: Record<string, unknown> = {}) {
  if (!query || !ACTIVITY_KINDS.includes(kind)) return;
  await query(`insert into ops.activity (user_id, kind, data) values ($1, $2, $3::jsonb)`, [userId, kind, JSON.stringify(data)])
    .catch((err) => original.warn("[ops] Activity write failed:", err?.message));
}

/** Friends' recent activity (last 7 days), without what they hide or anyone blocked either way. */
export async function activityFeed(userId: string): Promise<ActivityItem[]> {
  if (!query) return [];
  const rows = await query(
    `with friends as (
       select case when requester_id = $1 then addressee_id else requester_id end as id from friendships
       where status = 'accepted' and (requester_id = $1 or addressee_id = $1))
     select a.id, a.kind, a.data, a.created_at, u.id as user_id, u.username, u.first_name, u.profile_image_url
     from ops.activity a join friends f on f.id = a.user_id join users u on u.id = a.user_id
     left join ops.activity_prefs p on p.user_id = a.user_id
     where a.created_at > now() - interval '7 days' and not (a.kind = any(coalesce(p.hidden, '{}')))
     order by a.created_at desc limit 60`,
    [userId],
  ).catch(() => []);
  return rows.map((r) => ({
    id: Number(r.id), kind: r.kind, data: r.data ?? {}, at: new Date(r.created_at).toISOString(),
    user: { id: r.user_id, name: r.username || r.first_name || "Player", avatar: r.profile_image_url ?? null },
  }));
}

export async function activitySharing(userId: string): Promise<{ hidden: string[] }> {
  if (!query) return { hidden: [] };
  const [r] = await query(`select hidden from ops.activity_prefs where user_id = $1`, [userId]).catch(() => []);
  return { hidden: r?.hidden ?? [] };
}

export async function setActivitySharing(userId: string, hidden: unknown) {
  if (!query) return;
  const list = (Array.isArray(hidden) ? hidden : []).filter((k): k is string => ACTIVITY_KINDS.includes(k as ActivityKind));
  await query(`insert into ops.activity_prefs (user_id, hidden) values ($1, $2) on conflict (user_id) do update set hidden = $2`, [userId, list]);
  // Hiding a kind also takes back what's already in friends' feeds.
  if (list.length) await query(`delete from ops.activity where user_id = $1 and kind = any($2::text[])`, [userId, list]);
}
