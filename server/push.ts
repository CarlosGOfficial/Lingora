import './env'
import type { Hono } from 'hono'
import webpush from 'web-push'
import { sql } from './db'
import { fail, requireUser, str, type Env } from './http'

/*
 * Push notifications (Web Push), shared by Banter, Wordle Unlimited and Lingora.
 *
 * All three apps use the same VAPID keys and the same table, push.subscriptions (its own
 * Postgres schema, so Wordle's drizzle-kit leaves it alone), so any app can notify you on
 * any of them. Chats are shared, so to avoid three notifications for one message, each
 * event goes to ONE app per device (subscriptions are grouped by browser):
 *   - "chat" events (DMs, groups, friend requests): Banter, else Wordle, else Lingora
 *   - "banter" events (channel mentions, calls): Banter only
 *   - "wordle" / "lingora" events: that app only
 * Keep this file the same in all three apps.
 */

export type PushApp = "banter" | "wordle" | "lingora";
export type PushKind = "chat" | "banter" | "wordle" | "lingora";
export type PushEvent = {
  kind: PushKind;
  title: string;
  body: string;
  /** Same tag = replaces the previous notification (e.g. one per conversation). */
  tag?: string;
  /** Where a tap goes, per app (paths on that app's site). */
  url: Partial<Record<PushApp, string>>;
  /** Keep it on screen until they act (incoming calls). */
  sticky?: boolean;
};

const THIS_APP: PushApp = "lingora";
const ORDER: Record<PushKind, PushApp[]> = {
  chat: ["banter", "wordle", "lingora"],
  banter: ["banter"],
  wordle: ["wordle"],
  lingora: ["lingora"],
};

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
export const pushEnabled = !!(PUBLIC_KEY && PRIVATE_KEY);
if (pushEnabled) webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", PUBLIC_KEY, PRIVATE_KEY);

export const PUSH_SCHEMA = [
  `create schema if not exists push`,
  `create table if not exists push.subscriptions (
    endpoint text primary key,
    user_id text not null references users(id) on delete cascade,
    app text not null,
    p256dh text not null,
    auth text not null,
    user_agent text not null default '',
    created_at timestamp not null default now()
  )`,
  `create index if not exists "IDX_push_user" on push.subscriptions(user_id)`,
  // Which app each person has open (Banter, Wordle, Lingora), shared by all three. The
  // users.last_seen_at "online" dot is any app; this says which.
  `create schema if not exists presence`,
  `create table if not exists presence.apps (
    user_id text not null references users(id) on delete cascade,
    app text not null,
    seen_at timestamp not null default now(),
    primary key (user_id, app)
  )`,
  // What they're doing there (Lingora: language and lesson/review/...), for rich presence.
  `alter table presence.apps add column if not exists detail jsonb`,
];

type Sub = { endpoint: string; user_id: string; app: PushApp; p256dh: string; auth: string; user_agent: string };

// Who actually gets it: not on Do not disturb, not muted for this conversation (the tag
// names it: "dm:<sender>", "group:<id>", "channel:<id>"), and not in their quiet hours.
// Banter keeps these settings (chat.notify_prefs, chat.notify_settings).
const TARGETS = `select * from push.subscriptions s where s.user_id = any($1::text[])
  and s.user_id not in (select user_id from chat.profiles where style->>'presence' = 'dnd')
  and s.user_id not in (select user_id from chat.notify_prefs where scope = $2 and (level = 'none' or muted_until > now()))
  and s.user_id not in (select user_id from chat.notify_settings where quiet_on and (case
    when quiet_start <= quiet_end then (now() at time zone tz)::time >= quiet_start and (now() at time zone tz)::time < quiet_end
    else (now() at time zone tz)::time >= quiet_start or (now() at time zone tz)::time < quiet_end end))`;

/** Sends `event` to these people (never throws; it's fire-and-forget). */
export function notify(userIds: Iterable<string>, event: PushEvent) {
  const ids = Array.from(new Set(userIds));
  if (!pushEnabled || !ids.length) return;
  void (async () => {
    const db = sql
    if (!db) return
    const rows = (await db.query(TARGETS, [ids, event.tag ?? ""])
      .catch(() => db.query(`select * from push.subscriptions where user_id = any($1::text[])`, [ids]))) as Sub[]
    const order = ORDER[event.kind];
    // Per person and browser, the first app in the order that has a subscription.
    const groups = new Map<string, Sub[]>();
    for (const s of rows) {
      if (!order.includes(s.app)) continue;
      const key = `${s.user_id}|${s.user_agent}`;
      groups.set(key, [...(groups.get(key) ?? []), s]);
    }
    const targets = Array.from(groups.values()).flatMap((list) => {
      const best = order.find((app) => list.some((s) => s.app === app));
      return list.filter((s) => s.app === best);
    });
    await Promise.all(targets.map(async (s) => {
      const payload = JSON.stringify({ title: event.title, body: event.body, tag: event.tag, url: event.url[s.app] ?? "/", sticky: !!event.sticky });
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 12, urgency: event.sticky ? "high" : "normal" });
      } catch (err: any) {
        // Gone (unsubscribed, browser data cleared): forget it.
        if (err?.statusCode === 404 || err?.statusCode === 410) await db.query(`delete from push.subscriptions where endpoint = $1`, [s.endpoint]);
        else console.warn("Push failed:", err?.statusCode ?? err?.message);
      }
    }));
  })().catch((err) => console.warn("Push error:", err?.message ?? err));
}

/** Short text for a notification body. */
export const clip = (s: string, n = 140) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/** Creates the shared table if needed (also done by Banter and Wordle; idempotent). */
export async function ensurePushTable() {
  if (!sql) return
  for (const statement of PUSH_SCHEMA) await sql.query(statement).catch((err: Error) => console.warn('Push table:', err.message))
}

export function registerPushRoutes(app: Hono<Env>) {
  app.get('/push/key', (c) => c.json({ enabled: pushEnabled, key: PUBLIC_KEY || null }))

  // { subscription: PushSubscriptionJSON }
  app.post('/push/subscribe', requireUser, async (c) => {
    if (!pushEnabled || !sql) fail(503, 'Notifications aren’t set up on this server yet.')
    const body = await c.req.json().catch(() => ({}))
    const sub = body?.subscription
    const endpoint = str(sub?.endpoint)
    const p256dh = str(sub?.keys?.p256dh), auth = str(sub?.keys?.auth)
    if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !p256dh || !auth || p256dh.length > 200 || auth.length > 100) fail(400, 'That subscription isn’t valid.')
    const ua = str(c.req.header('user-agent')).slice(0, 300)
    await sql!.query(
      `insert into push.subscriptions (endpoint, user_id, app, p256dh, auth, user_agent) values ($1, $2, $3, $4, $5, $6)
       on conflict (endpoint) do update set user_id = $2, app = $3, p256dh = $4, auth = $5, user_agent = $6`,
      [endpoint, c.get('userId'), THIS_APP, p256dh, auth, ua],
    )
    return c.json({ ok: true })
  })

  app.post('/push/unsubscribe', requireUser, async (c) => {
    const body = await c.req.json().catch(() => ({}))
    if (sql) await sql.query(`delete from push.subscriptions where endpoint = $1 and user_id = $2`, [str(body?.endpoint), c.get('userId')])
    return c.json({ ok: true })
  })

  // Sends you a test notification on this site.
  app.post('/push/test', requireUser, (c) => {
    notify([c.get('userId')], { kind: THIS_APP, title: 'Notifications are on 🎉', body: 'This is what Lingora notifications look like.', tag: 'test', url: { [THIS_APP]: '/profile' } })
    return c.json({ ok: true })
  })
}
