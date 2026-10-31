/**
 * Database schema. Idempotent: it's safe to run on every deploy (`npm run db:migrate`).
 *
 * The database is shared with Wordle Unlimited:
 * - `users` and `saved_themes` belong to Wordle. They are only created here if
 *   missing (with Wordle's exact columns) and are never altered.
 * - Everything Lingora owns is prefixed `lingora_` (Wordle's drizzle config has
 *   tablesFilter "!lingora_*" so its `db:push` leaves them alone).
 *
 * Progress is stored as append-only events (reviews, XP, completions, purchases,
 * daily claims) rather than mutable state. Every device replays the same log, so
 * syncing never overwrites newer work.
 */
export const SCHEMA: string[] = [
  /* ---- Shared with Wordle Unlimited (created only if missing) ---- */
  `create table if not exists users (
    id text primary key,
    username text unique,
    password_hash text,
    email text,
    first_name text,
    last_name text,
    profile_image_url text,
    coins integer not null default 0,
    pin text,
    created_at timestamp default now(),
    updated_at timestamp default now()
  )`,
  `create table if not exists saved_themes (
    id serial primary key,
    user_id text not null references users(id) on delete cascade,
    name text not null,
    data jsonb not null,
    updated_at timestamp not null default now()
  )`,

  /* ---- Lingora ---- */
  `create table if not exists lingora_profiles (
    user_id text primary key references users(id) on delete cascade,
    prefs jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists lingora_sessions (
    token_hash text primary key,
    user_id text not null references users(id) on delete cascade,
    expires_at timestamptz not null
  )`,
  `create index if not exists lingora_sessions_user_idx on lingora_sessions(user_id)`,
  `create table if not exists lingora_review_logs (
    user_id text not null references users(id) on delete cascade,
    client_id text not null,
    item_id text not null,
    lang text not null,
    rating smallint not null check (rating between 1 and 4),
    at_ms bigint not null,
    primary key (user_id, client_id)
  )`,
  `create table if not exists lingora_card_imports (
    user_id text not null references users(id) on delete cascade,
    item_id text not null,
    lang text not null,
    state jsonb not null,
    primary key (user_id, item_id)
  )`,
  `create table if not exists lingora_xp_events (
    user_id text not null references users(id) on delete cascade,
    client_id text not null,
    lang text not null,
    xp int not null check (xp between 0 and 1000),
    day date not null,
    at_ms bigint not null,
    primary key (user_id, client_id)
  )`,
  `create index if not exists lingora_xp_events_day_idx on lingora_xp_events(user_id, day)`,
  `create table if not exists lingora_completions (
    user_id text not null references users(id) on delete cascade,
    ref_id text not null,
    lang text not null,
    kind text not null check (kind in ('lesson', 'reading')),
    at_ms bigint not null,
    primary key (user_id, ref_id)
  )`,
  `create table if not exists lingora_friendships (
    user_id text not null references users(id) on delete cascade,
    friend_id text not null references users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, friend_id),
    check (user_id <> friend_id)
  )`,
  `create table if not exists lingora_purchases (
    user_id text not null references users(id) on delete cascade,
    client_id text not null,
    item_id text not null,
    price int not null check (price >= 0),
    at_ms bigint not null,
    primary key (user_id, client_id)
  )`,
  // Cosmetics can be bought once; power-ups (pw_*) are consumables.
  `create unique index if not exists lingora_purchases_once_idx on lingora_purchases(user_id, item_id) where item_id not like 'pw\\_%'`,
  `create table if not exists lingora_daily_claims (
    user_id text not null references users(id) on delete cascade,
    day int not null,
    streak_day int not null,
    coins int not null,
    at_ms bigint not null,
    primary key (user_id, day)
  )`,
]
