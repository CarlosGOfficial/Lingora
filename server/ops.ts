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
 * - Shared features: the activity hub, cross-app events, the season pass and the trophy case.
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
  // Season pass (made on Wordle's admin dashboard, shown in all three apps).
  `create table if not exists ops.seasons (
    id serial primary key,
    name text not null,
    starts_at timestamptz not null,
    ends_at timestamptz not null,
    premium_price integer not null default 1500,
    tiers jsonb not null default '[]'::jsonb,
    created_by text,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists ops.season_pass (
    season_id integer not null references ops.seasons(id) on delete cascade,
    user_id text not null references users(id) on delete cascade,
    premium boolean not null default false,
    claimed_free integer[] not null default '{}',
    claimed_premium integer[] not null default '{}',
    bought_at timestamptz,
    primary key (season_id, user_id)
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
  // Trophy case: what each person has earned in any of the apps (each app writes its own).
  `create table if not exists ops.trophies (
    user_id text not null references users(id) on delete cascade,
    app text not null,
    key text not null,
    name text not null,
    icon text not null,
    tier text not null default 'bronze',
    detail text not null default '',
    earned_at timestamptz not null default now(),
    primary key (user_id, app, key)
  )`,
  `create table if not exists ops.trophy_pins (
    user_id text primary key references users(id) on delete cascade,
    ids text[] not null default '{}'
  )`,
  // Crews (Wordle clans, in all three apps): who opted into weekly wars, and the wars.
  `create table if not exists ops.crew_settings (
    clan_id integer primary key,
    wars boolean not null default false
  )`,
  `create table if not exists ops.crew_war_weeks (
    week text primary key,
    paired_at timestamptz not null default now()
  )`,
  `create table if not exists ops.crew_wars (
    id serial primary key,
    week text not null,
    clan_a integer not null,
    clan_b integer not null,
    score_a integer,
    score_b integer,
    winner integer,
    settled_at timestamptz,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists ops_crew_wars_week on ops.crew_wars(week)`,
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
let markReady: () => void = () => {};
/** Resolves once startOps() has set up the tables (never, if they couldn't be). */
export const opsReady = new Promise<void>((resolve) => { markReady = resolve; });
/** Create the ops tables, start capturing errors and sending heartbeats. Safe to call once at start-up. */
export async function startOps(app: OpsApp, run: OpsQuery) {
  if (started) return;
  started = true;
  thisApp = app;
  for (const statement of OPS_SCHEMA) {
    try { await run(statement); } catch (err: any) { original.warn("[ops] Setting up the ops tables failed:", err?.message); return; }
  }
  query = run;
  markReady();
  console.error = (...args: unknown[]) => { original.error(...args); trackError(args); };
  void heartbeat();
  setInterval(() => void heartbeat(), 60_000).unref();
  setInterval(() => void crewTick(), 5 * 60_000).unref();
  setTimeout(() => void crewTick(), 20_000).unref();
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

/** "chat-x.onrender.com" or "https://chat-x.onrender.com/" → "https://chat-x.onrender.com" ("" if unset). */
export function siteUrl(v: unknown): string {
  const t = String(v ?? "").trim().replace(/\/+$/, "");
  return !t ? "" : /^https?:\/\//i.test(t) ? t : `https://${t}`;
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
    out[app] = siteUrl(url) || null;
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

/* ---------- Season pass ---------- */

/*
 * One season at a time (about 8 weeks, 50 tiers of SEASON_TIER_XP). Season XP comes from all
 * three apps, counted live from what they already record, at most SEASON_DAY_CAP a day (UTC):
 *   Wordle: 20 a round won, 30 a Daily finished · Lingora: its own XP · Chat: 2 a message
 *   (any app, at most 60 a day). Each tier has a free reward and a premium one; premium is
 * unlocked with coins from the shared wallet. Every claim and the purchase are one statement.
 */
export const SEASON_TIER_XP = 300;
export const SEASON_TIERS = 50;
export const SEASON_DAY_CAP = 400;
export type SeasonReward = { coins: number; itemId: string | null; itemName: string | null; itemType: string | null };
export type SeasonView = {
  id: number; name: string; startsAt: string; endsAt: string; premiumPrice: number;
  xp: number; today: number; tier: number; tiers: { free: SeasonReward; premium: SeasonReward }[];
  premium: boolean; claimedFree: number[]; claimedPremium: number[];
  rules: { tierXp: number; dayCap: number };
};

async function currentSeason(): Promise<any | null> {
  if (!query) return null;
  const [s] = await query(`select * from ops.seasons where starts_at <= now() and ends_at > now() - interval '3 days' order by starts_at desc limit 1`).catch(() => []);
  return s ?? null;
}

/** Season XP: per UTC day, everything earned that day, capped. */
async function seasonXp(userId: string, from: Date, to: Date): Promise<{ total: number; today: number }> {
  if (!query) return { total: 0, today: 0 };
  const t = [from.toISOString(), to.toISOString()];
  const [r] = await query(
    `with d as (
       select (created_at at time zone 'UTC')::date as day, 20 as xp from round_stats where user_id = $1 and won and created_at >= ($2::timestamptz at time zone 'UTC') and created_at < ($3::timestamptz at time zone 'UTC')
       union all select (finished_at at time zone 'UTC')::date, 30 from daily_results where user_id = $1 and finished and finished_at >= ($2::timestamptz at time zone 'UTC') and finished_at < ($3::timestamptz at time zone 'UTC')
       union all select (to_timestamp(at_ms / 1000.0) at time zone 'UTC')::date, xp from lingora_xp_events where user_id = $1 and at_ms >= $4 and at_ms < $5
       union all select day, least(60, n * 2) from (
         select (created_at at time zone 'UTC')::date as day, count(*)::int as n from (
           select created_at from direct_messages where from_user_id = $1 and deleted_at is null and created_at >= ($2::timestamptz at time zone 'UTC') and created_at < ($3::timestamptz at time zone 'UTC')
           union all select created_at from group_messages where from_user_id = $1 and deleted_at is null and created_at >= ($2::timestamptz at time zone 'UTC') and created_at < ($3::timestamptz at time zone 'UTC')
           union all select created_at from chat.messages where from_user_id = $1 and deleted_at is null and created_at >= ($2::timestamptz at time zone 'UTC') and created_at < ($3::timestamptz at time zone 'UTC')
         ) m group by 1
       ) chat
     ), days as (select day, least($6, sum(xp))::int as xp from d group by day)
     select coalesce(sum(xp), 0)::int as total, coalesce(sum(xp) filter (where day = (now() at time zone 'UTC')::date), 0)::int as today from days`,
    [userId, ...t, from.getTime(), to.getTime(), SEASON_DAY_CAP]).catch((err) => { original.warn("[ops] Season XP:", err?.message); return [{ total: 0, today: 0 }]; });
  return { total: Number(r?.total ?? 0), today: Number(r?.today ?? 0) };
}

export async function seasonView(userId: string): Promise<SeasonView | null> {
  const s = await currentSeason();
  if (!s) return null;
  const { total, today } = await seasonXp(userId, new Date(s.starts_at), new Date(s.ends_at));
  const [p] = await query!(`select * from ops.season_pass where season_id = $1 and user_id = $2`, [s.id, userId]).catch(() => []);
  return {
    id: s.id, name: s.name, startsAt: new Date(s.starts_at).toISOString(), endsAt: new Date(s.ends_at).toISOString(), premiumPrice: s.premium_price,
    xp: total, today, tier: Math.min(SEASON_TIERS, Math.floor(total / SEASON_TIER_XP)), tiers: s.tiers,
    premium: !!p?.premium, claimedFree: p?.claimed_free ?? [], claimedPremium: p?.claimed_premium ?? [],
    rules: { tierXp: SEASON_TIER_XP, dayCap: SEASON_DAY_CAP },
  };
}

/** Claim tier n (1-based) on a track: once, only when reached, premium only with the pass. */
export async function claimSeasonTier(userId: string, tier: number, track: "free" | "premium"): Promise<{ reward: SeasonReward } | { error: string }> {
  const v = await seasonView(userId);
  if (!v) return { error: "There's no season on right now." };
  if (!Number.isInteger(tier) || tier < 1 || tier > SEASON_TIERS) return { error: "No such tier." };
  if (tier > v.tier) return { error: "You haven't reached that tier yet." };
  if (track === "premium" && !v.premium) return { error: "Unlock the premium track first." };
  const reward = v.tiers[tier - 1]?.[track];
  if (!reward) return { error: "No reward there." };
  const col = track === "premium" ? "claimed_premium" : "claimed_free";
  await query!(`insert into ops.season_pass (season_id, user_id) values ($1, $2) on conflict do nothing`, [v.id, userId]);
  const [r] = await query!(
    `with claimed as (
       update ops.season_pass set ${col} = array_append(${col}, $3) where season_id = $1 and user_id = $2 and not ($3 = any(${col}))
       ${track === "premium" ? "and premium" : ""} returning 1
     ), coins as (
       update users set coins = coins + $4 where id = $2 and exists (select 1 from claimed) and $4::int > 0 returning 1
     ), item as (
       insert into inventory (user_id, item_id, item_type) select $2, $5, $6 where exists (select 1 from claimed) and $5::text is not null
       on conflict do nothing returning 1
     )
     select exists (select 1 from claimed) as ok`,
    [v.id, userId, tier, reward.coins ?? 0, reward.itemId, reward.itemType ?? "title"]);
  if (r?.ok && reward.itemType === "title") await syncSeasonTrophies(userId).catch(() => {});
  return r?.ok ? { reward } : { error: "Already claimed." };
}

/** Unlock the premium track with coins (once a season). */
export async function buySeasonPremium(userId: string): Promise<{ ok: true } | { error: string }> {
  const v = await seasonView(userId);
  if (!v) return { error: "There's no season on right now." };
  if (v.premium) return { error: "You already have it." };
  if (new Date(v.endsAt).getTime() < Date.now()) return { error: "This season has ended." };
  await query!(`insert into ops.season_pass (season_id, user_id) values ($1, $2) on conflict do nothing`, [v.id, userId]);
  const [r] = await query!(
    // The pass row is updated first: a second click waits on its lock, then sees it's premium already.
    `with pass as (
       update ops.season_pass set premium = true, bought_at = now() where season_id = $1 and user_id = $2 and not premium
         and (select coins from users where id = $2) >= $3 returning 1
     ), pay as (
       update users set coins = coins - $3 where id = $2 and exists (select 1 from pass) returning 1
     )
     select exists (select 1 from pass) as ok`,
    [v.id, userId, v.premiumPrice]);
  return r?.ok ? { ok: true } : { error: `You need ${v.premiumPrice} coins.` };
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

/* ---------- Trophy case: one shelf of everything earned across the apps ---------- */
/*
 * Each app describes its trophies as rules: a catalog (key → name, icon, tier) and a SQL
 * query listing (user_id, key, earned_at) for everyone who has earned one, taking $1 = a
 * user id or null for everyone (use it inside the query to keep one person's sync cheap). syncTrophies() turns that into ops.trophies rows in one
 * statement, so it's safe to run at start-up, on a timer and after anything that might
 * earn one. Season titles (from the season pass) are kept by this file itself.
 */
export const TROPHY_TIERS = ["special", "gold", "silver", "bronze"] as const;
export type TrophyTier = (typeof TROPHY_TIERS)[number];
export type TrophyApp = OpsApp | "season";
export type TrophyDef = { key: string; name: string; icon: string; tier: TrophyTier; detail: string };
/** With no defs, `earned` also returns name, icon, tier and detail itself (for trophies made from data, like events). */
export type TrophyRule = { defs: TrophyDef[]; earned: string };
export type Trophy = TrophyDef & { id: string; app: TrophyApp; earnedAt: string };
export type TrophyStats = { wordleWins: number | null; rankedPeak: number | null; lingoraXp: number | null; lingoraStreak: number | null; banterLevel: number | null };
export type TrophyCase = { trophies: Trophy[]; pinned: string[]; counts: Record<TrophyTier, number>; stats: TrophyStats; mine: boolean };
export const MAX_PINS = 6;

async function syncSeasonTrophies(userId: string | null) {
  await query!(
    `insert into ops.trophies (user_id, app, key, name, icon, tier, detail)
     select p.user_id, 'season', 'season:' || s.id || ':' || x.track || ':' || x.n, coalesce(x.r->>'itemName', 'Season title'), '🎗️', 'special', s.name
     from ops.season_pass p join ops.seasons s on s.id = p.season_id
     cross join lateral (
       select 'free' as track, e.n::int as n, e.r->'free' as r from jsonb_array_elements(s.tiers) with ordinality as e(r, n) where e.n::int = any(p.claimed_free)
       union all
       select 'premium', e.n::int, e.r->'premium' from jsonb_array_elements(s.tiers) with ordinality as e(r, n) where e.n::int = any(p.claimed_premium)
     ) x
     where x.r->>'itemType' = 'title' and ($1::text is null or p.user_id = $1)
     on conflict do nothing`,
    [userId]);
}

/** Write this app's earned trophies (one person, or everyone with null). Never throws. */
export async function syncTrophies(rules: TrophyRule[], userId: string | null = null) {
  if (!query) return;
  for (const rule of rules) {
    await query(
      `insert into ops.trophies (user_id, app, key, name, icon, tier, detail, earned_at)
       select e.user_id, $2, e.key, d.name, d.icon, d.tier, d.detail, coalesce(e.earned_at, now())
       from (${rule.earned}) e
       ${rule.defs.length ? "join jsonb_to_recordset($3::jsonb) as d(key text, name text, icon text, tier text, detail text) on d.key = e.key" : "cross join lateral (select e.name, e.icon, e.tier, e.detail, $3::jsonb as unused) d"}
       where ($1::text is null or e.user_id = $1)
       on conflict (user_id, app, key) do update set name = excluded.name, icon = excluded.icon, tier = excluded.tier, detail = excluded.detail
         where (ops.trophies.name, ops.trophies.icon, ops.trophies.tier, ops.trophies.detail) is distinct from (excluded.name, excluded.icon, excluded.tier, excluded.detail)`,
      [userId, thisApp, JSON.stringify(rule.defs)],
    ).catch((err) => original.warn("[ops] Trophy sync failed:", err?.message));
  }
  await syncSeasonTrophies(userId).catch((err) => original.warn("[ops] Season trophy sync failed:", err?.message));
}

const trophyTimers = new Map<string, ReturnType<typeof setTimeout>>();
/** Sync one person's trophies soon (several calls in a row are folded into one). */
export function touchTrophies(rules: TrophyRule[], userId: string) {
  if (!query || trophyTimers.has(userId)) return;
  trophyTimers.set(userId, setTimeout(() => { trophyTimers.delete(userId); void syncTrophies(rules, userId); }, 2000));
}

/** Everyone's trophies now, then every hour (catches anything a hook missed). */
export function startTrophies(rules: TrophyRule[]) {
  void opsReady.then(() => {
    void syncTrophies(rules);
    setInterval(() => void syncTrophies(rules), 3_600_000).unref();
  });
}

const lastCaseSync = new Map<string, number>();
/**
 * Someone's trophy case, or null if either of you has blocked the other. With this app's
 * rules, their shelf here is brought up to date first (at most once a minute per person).
 */
export async function trophyCase(userId: string, viewerId: string | null, rules?: TrophyRule[]): Promise<TrophyCase | null> {
  if (!query) return null;
  if (viewerId && viewerId !== userId) {
    const [b] = await query(`select 1 from chat.blocks where (user_id = $1 and blocked_id = $2) or (user_id = $2 and blocked_id = $1) limit 1`, [userId, viewerId]).catch(() => []);
    if (b) return null;
  }
  if (rules && Date.now() - (lastCaseSync.get(userId) ?? 0) > 60_000) {
    if (lastCaseSync.size > 5000) lastCaseSync.clear();
    lastCaseSync.set(userId, Date.now());
    await syncTrophies(rules, userId);
  }
  const [rows, [pins], stats] = await Promise.all([
    query(`select * from ops.trophies where user_id = $1 order by earned_at desc`, [userId]).catch(() => []),
    query(`select ids from ops.trophy_pins where user_id = $1`, [userId]).catch(() => []),
    trophyStats(userId),
  ]);
  const trophies: Trophy[] = rows.map((r) => ({
    id: `${r.app}:${r.key}`, app: r.app, key: r.key, name: r.name, icon: r.icon, tier: r.tier, detail: r.detail, earnedAt: new Date(r.earned_at).toISOString(),
  }));
  const have = new Set(trophies.map((t) => t.id));
  const counts = { special: 0, gold: 0, silver: 0, bronze: 0 } as Record<TrophyTier, number>;
  for (const t of trophies) if (t.tier in counts) counts[t.tier]++;
  return { trophies, pinned: ((pins?.ids ?? []) as string[]).filter((id) => have.has(id)), counts, stats, mine: viewerId === userId };
}

const one = async (sql: string, userId: string): Promise<number | null> => {
  const [r] = await query!(sql, [userId]).catch(() => []);
  return r?.v == null ? null : Number(r.v);
};
async function trophyStats(userId: string): Promise<TrophyStats> {
  const [wordleWins, rankedPeak, lingoraXp, lingoraStreak, banterXp] = await Promise.all([
    one(`select rounds_won as v from users where id = $1`, userId),
    one(`select max(peak) as v from ranked_ratings where user_id = $1 and games > 0`, userId),
    one(`select sum(xp)::int as v from lingora_xp_events where user_id = $1`, userId),
    // Lingora's longest streak: days (UTC) with any XP, in a row.
    one(`with d as (select distinct (to_timestamp(at_ms / 1000.0) at time zone 'UTC')::date as day from lingora_xp_events where user_id = $1)
         select max(n) as v from (select count(*) as n from (select day, day - (row_number() over (order by day))::int as g from d) x group by g) y`, userId),
    one(`select max(xp) as v from chat.member_xp where user_id = $1`, userId),
  ]);
  // Banter's server levels: level n → n+1 takes 5n² + 50n + 100 XP (shared/levels.ts there).
  let banterLevel: number | null = null;
  if (banterXp != null) { let left = banterXp, l = 0; while (l < 500 && left >= 5 * l * l + 50 * l + 100) { left -= 5 * l * l + 50 * l + 100; l++; } banterLevel = l; }
  return { wordleWins, rankedPeak, lingoraXp, lingoraStreak, banterLevel };
}

/** Choose up to MAX_PINS of your own trophies to show first. */
export async function pinTrophies(userId: string, ids: unknown): Promise<string[]> {
  if (!query) return [];
  const want = Array.from(new Set((Array.isArray(ids) ? ids : []).filter((x): x is string => typeof x === "string"))).slice(0, MAX_PINS);
  const [r] = await query(
    `insert into ops.trophy_pins (user_id, ids)
     select $1, coalesce(array_agg(w.id order by w.n), '{}') from unnest($2::text[]) with ordinality as w(id, n)
     where exists (select 1 from ops.trophies t where t.user_id = $1 and t.app || ':' || t.key = w.id)
     on conflict (user_id) do update set ids = excluded.ids returning ids`,
    [userId, want]);
  return r?.ids ?? [];
}

/* ---------- Crews: Wordle clans, in all three apps ---------- */
/*
 * A crew is a Wordle clan (same members, roles, tag and privacy). Its weekly score adds
 * up what members did in each app: Wordle XP (round_stats), Lingora XP (xp events) and
 * activity in the clan's linked Banter server (4 points a message, up to 25 messages a
 * day each). Clans that opt in are paired each Monday for a crew war; at the end of the
 * week the higher score wins: a banner for the next week, coins for every member who
 * played, and a trophy. Pairing and settling are each claimed in one statement, so any
 * app can run the job and it still happens once.
 */
export const CREW_WAR_COINS = 100;
export const CREW_MSG_POINTS = 4, CREW_MSG_DAY_CAP = 25;
export type CrewBrief = { id: number; name: string; tag: string; emoji: string; color: string };
export type CrewMember = { id: string; name: string; avatar: string | null; role: string; wordle: number; lingora: number; banter: number; total: number };
export type CrewWar = { id: number; opponent: CrewBrief; mine: number; theirs: number; endsAt: string; theirMembers: number };
export type CrewView = CrewBrief & {
  isPrivate: boolean; groupId: number | null; banterInvite: string | null; studyRoomId: number | null;
  week: string; total: number; parts: { wordle: number; lingora: number; banter: number };
  members: CrewMember[]; myRole: string; wars: boolean; war: CrewWar | null;
  lastWar: { opponent: CrewBrief; mine: number; theirs: number; won: boolean | null } | null; banner: boolean;
};

/** Monday (UTC) of the week holding `d`, as YYYY-MM-DD. */
export function crewWeek(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}
const weekRange = (week: string) => { const from = Date.parse(`${week}T00:00:00Z`); return { from, to: from + 7 * 86_400_000 }; };
const prevWeek = (week: string) => new Date(Date.parse(`${week}T00:00:00Z`) - 7 * 86_400_000).toISOString().slice(0, 10);

/** Each member's points per app for some clans over a week. */
async function crewScores(clanIds: number[], week: string): Promise<{ user_id: string; clan_id: number; wordle: number; lingora: number; banter: number }[]> {
  if (!query || !clanIds.length) return [];
  const { from, to } = weekRange(week);
  const f = new Date(from).toISOString(), t = new Date(to).toISOString();
  return query(
    `with m as (select user_id, clan_id from clan_members where clan_id = any($1::int[])),
     w as (select s.user_id, sum(s.xp)::int as v from round_stats s join m on m.user_id = s.user_id
       where s.created_at >= ($2::timestamptz at time zone 'UTC') and s.created_at < ($3::timestamptz at time zone 'UTC') group by 1),
     l as (select x.user_id, sum(x.xp)::int as v from lingora_xp_events x join m on m.user_id = x.user_id
       where x.at_ms >= $4 and x.at_ms < $5 group by 1),
     b as (select d.user_id, sum(least($7, d.n) * $6)::int as v from (
       select msg.from_user_id as user_id, date_trunc('day', msg.created_at) as day, count(*) as n
       from chat.messages msg join chat.channels ch on ch.id = msg.channel_id join chat.servers sv on sv.id = ch.server_id
       join clans c on c.banter_invite = sv.invite_code join m on m.user_id = msg.from_user_id and m.clan_id = c.id
       where msg.deleted_at is null and msg.created_at >= ($2::timestamptz at time zone 'UTC') and msg.created_at < ($3::timestamptz at time zone 'UTC')
       group by 1, 2) d group by 1)
     select m.user_id, m.clan_id, coalesce(w.v, 0)::int as wordle, coalesce(l.v, 0)::int as lingora, coalesce(b.v, 0)::int as banter
     from m left join w on w.user_id = m.user_id left join l on l.user_id = m.user_id left join b on b.user_id = m.user_id`,
    [clanIds, f, t, from, to, CREW_MSG_POINTS, CREW_MSG_DAY_CAP],
  ).catch((err) => { original.warn("[ops] Crew scores:", err?.message); return []; });
}
const totalOf = (rows: { wordle: number; lingora: number; banter: number }[]) => rows.reduce((n, r) => n + r.wordle + r.lingora + r.banter, 0);

async function briefs(ids: number[]): Promise<Map<number, CrewBrief>> {
  if (!query || !ids.length) return new Map();
  const rows = await query(`select id, name, tag, emoji, color from clans where id = any($1::int[])`, [ids]).catch(() => []);
  return new Map(rows.map((r) => [r.id, { id: r.id, name: r.name, tag: r.tag, emoji: r.emoji, color: r.color }]));
}

/** Your crew (your Wordle clan) with this week's score, or null if you're not in one. */
export async function crewView(userId: string): Promise<CrewView | null> {
  if (!query) return null;
  const [c] = await query(
    `select c.*, m.role, coalesce(s.wars, false) as wars,
       (select id from lingora_study_rooms r where r.clan_id = c.id limit 1) as study_room_id
     from clan_members m join clans c on c.id = m.clan_id left join ops.crew_settings s on s.clan_id = c.id where m.user_id = $1`, [userId],
  ).catch(async () => (await query!(`select c.*, m.role, false as wars, null::int as study_room_id from clan_members m join clans c on c.id = m.clan_id where m.user_id = $1`, [userId]).catch(() => [])));
  if (!c) return null;
  const week = crewWeek();
  const scores = await crewScores([c.id], week);
  const people = await query(`select id, username, first_name, profile_image_url from users where id = any($1::text[])`, [scores.map((r) => r.user_id)]).catch(() => []);
  const roles = new Map((await query(`select user_id, role from clan_members where clan_id = $1`, [c.id]).catch(() => [])).map((r) => [r.user_id, r.role]));
  const byId = new Map(people.map((p) => [p.id, p]));
  const members: CrewMember[] = scores.map((r) => {
    const p = byId.get(r.user_id);
    return { id: r.user_id, name: p?.username || p?.first_name || "Player", avatar: p?.profile_image_url ?? null, role: roles.get(r.user_id) ?? "member",
      wordle: r.wordle, lingora: r.lingora, banter: r.banter, total: r.wordle + r.lingora + r.banter };
  }).sort((a, b) => b.total - a.total);
  const parts = { wordle: 0, lingora: 0, banter: 0 };
  for (const m of members) { parts.wordle += m.wordle; parts.lingora += m.lingora; parts.banter += m.banter; }

  let war: CrewWar | null = null;
  const [w] = await query(`select * from ops.crew_wars where week = $1 and (clan_a = $2 or clan_b = $2)`, [week, c.id]).catch(() => []);
  if (w) {
    const other = w.clan_a === c.id ? w.clan_b : w.clan_a;
    const theirs = await crewScores([other], week);
    const opp = (await briefs([other])).get(other);
    if (opp) war = { id: w.id, opponent: opp, mine: totalOf(scores), theirs: totalOf(theirs), endsAt: new Date(weekRange(week).to).toISOString(), theirMembers: theirs.length };
  }
  let lastWar: CrewView["lastWar"] = null;
  const [lw] = await query(`select * from ops.crew_wars where week = $1 and (clan_a = $2 or clan_b = $2) and settled_at is not null`, [prevWeek(week), c.id]).catch(() => []);
  if (lw) {
    const other = lw.clan_a === c.id ? lw.clan_b : lw.clan_a, mineA = lw.clan_a === c.id;
    const opp = (await briefs([other])).get(other) ?? { id: other, name: "A crew that disbanded", tag: "?", emoji: "🛡️", color: "#888888" };
    lastWar = { opponent: opp, mine: mineA ? lw.score_a : lw.score_b, theirs: mineA ? lw.score_b : lw.score_a, won: lw.winner == null ? null : lw.winner === c.id };
  }
  return {
    id: c.id, name: c.name, tag: c.tag, emoji: c.emoji, color: c.color, isPrivate: !!c.is_private, groupId: c.group_id ?? null,
    banterInvite: c.banter_invite ?? null, studyRoomId: c.study_room_id ?? null, week, total: totalOf(scores), parts, members,
    myRole: c.role, wars: !!c.wars, war, lastWar, banner: !!lastWar?.won,
  };
}

/** Owners and officers: take part in weekly crew wars (from next Monday's pairing). */
export async function setCrewWars(userId: string, on: boolean): Promise<{ ok: true } | { error: string }> {
  if (!query) return { error: "Not available." };
  const [m] = await query(`select clan_id, role from clan_members where user_id = $1`, [userId]);
  if (!m) return { error: "You're not in a crew." };
  if (m.role !== "owner" && m.role !== "officer") return { error: "Only the crew's owner and officers can do that." };
  await query(`insert into ops.crew_settings (clan_id, wars) values ($1, $2) on conflict (clan_id) do update set wars = $2`, [m.clan_id, !!on]);
  return { ok: true };
}

/** Pair this week's wars (once), and settle last week's (each once). */
export async function crewTick() {
  if (!query) return;
  try {
    const week = crewWeek();
    // Settle any finished war: the claim (settled_at) and the result are one update.
    const open = await query(`select * from ops.crew_wars where week < $1 and settled_at is null`, [week]);
    for (const w of open) {
      const scores = await crewScores([w.clan_a, w.clan_b], w.week);
      const a = totalOf(scores.filter((r) => r.clan_id === w.clan_a)), b = totalOf(scores.filter((r) => r.clan_id === w.clan_b));
      const winner = a === b ? null : a > b ? w.clan_a : w.clan_b;
      const [done] = await query(`update ops.crew_wars set score_a = $2, score_b = $3, winner = $4, settled_at = now() where id = $1 and settled_at is null returning id`, [w.id, a, b, winner]);
      if (!done) continue;
      const names = await briefs([w.clan_a, w.clan_b]);
      for (const clan of [w.clan_a, w.clan_b]) {
        const mine = scores.filter((r) => r.clan_id === clan), opp = names.get(clan === w.clan_a ? w.clan_b : w.clan_a);
        const won = winner === clan, played = mine.filter((r) => r.wordle + r.lingora + r.banter > 0).map((r) => r.user_id);
        if (won && played.length) {
          await query(`update users set coins = coins + $2 where id = any($1::text[])`, [played, CREW_WAR_COINS]);
          await query(
            `insert into ops.trophies (user_id, app, key, name, icon, tier, detail)
             select u, 'wordle', 'crewwar:' || $2::text, 'Crew war won', '⚔️', 'silver', $3 from unnest($1::text[]) as u on conflict do nothing`,
            [played, w.id, `With ${names.get(clan)?.name ?? "your crew"} against ${opp?.name ?? "another crew"} (week of ${w.week}).`]);
        }
        void recordInbox(mine.map((r) => r.user_id), {
          kind: "wordle", tag: `crewwar:${w.id}`,
          title: winner == null ? "⚔️ Crew war: a draw!" : won ? "⚔️ Your crew won the war!" : "⚔️ Your crew lost the war",
          body: `${totalOf(mine)} to ${totalOf(scores.filter((r) => r.clan_id !== clan))} against ${opp?.name ?? "the other crew"}.${won && played.length ? ` +${CREW_WAR_COINS} coins each for everyone who played.` : ""}`,
          url: { wordle: "/clans", banter: "/crew", lingora: "/crew" },
        });
      }
    }
    // Pair this week: whoever claims the week does it.
    const [claimed] = await query(`insert into ops.crew_war_weeks (week) values ($1) on conflict do nothing returning week`, [week]);
    if (!claimed) return;
    const clans = await query(
      `select c.id, (select count(*) from clan_members m where m.clan_id = c.id)::int as n
       from clans c join ops.crew_settings s on s.clan_id = c.id and s.wars where (select count(*) from clan_members m where m.clan_id = c.id) >= 2`);
    if (clans.length < 2) return;
    const last = await crewScores(clans.map((c) => c.id), prevWeek(week));
    const strength = new Map(clans.map((c) => [c.id, totalOf(last.filter((r) => r.clan_id === c.id)) / Math.max(1, c.n)]));
    // Similar size first, then last week's points per member; neighbours fight.
    const order = [...clans].sort((x, y) => Math.round(x.n / 3) - Math.round(y.n / 3) || strength.get(y.id)! - strength.get(x.id)!);
    const pairs: [number, number][] = [];
    for (let i = 0; i + 1 < order.length; i += 2) pairs.push([order[i].id, order[i + 1].id]);
    if (pairs.length) await query(`insert into ops.crew_wars (week, clan_a, clan_b) select $1, a, b from unnest($2::int[], $3::int[]) as p(a, b)`, [week, pairs.map((p) => p[0]), pairs.map((p) => p[1])]);
    for (const [a, b] of pairs) {
      const names = await briefs([a, b]);
      const members = await query(`select user_id, clan_id from clan_members where clan_id = any($1::int[])`, [[a, b]]);
      for (const clan of [a, b]) {
        void recordInbox(members.filter((m) => m.clan_id === clan).map((m) => m.user_id), {
          kind: "wordle", tag: `crewwar:${week}`, title: "⚔️ A crew war starts!", body: `This week: ${names.get(a)?.name} vs ${names.get(b)?.name}. Wordle wins, Lingora XP and chat in your crew's Banter server all count.`,
          url: { wordle: "/clans", banter: "/crew", lingora: "/crew" },
        });
      }
    }
  } catch (err: any) {
    original.warn("[ops] Crew tick:", err?.message);
  }
}
