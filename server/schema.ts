/**
 * Database schema. Idempotent: it's safe to run on every deploy (`npm run db:migrate`).
 *
 * The database is shared with Wordle Unlimited:
 * - `users`, `saved_themes` and the social tables (friendships, direct and group chats,
 *   reactions, chat images, favourite GIFs) belong to Wordle. They are only created here
 *   if missing (with Wordle's columns) and are never altered.
 * - Everything Lingora owns is prefixed `lingora_` (Wordle's drizzle config has
 *   tablesFilter "!lingora_*" so its `db:push` leaves them alone).
 *
 * Progress is stored as append-only events (reviews, XP, completions, purchases,
 * daily claims) rather than mutable state. Every device replays the same log, so
 * syncing never overwrites newer work.
 */
import { PUSH_SCHEMA } from './push'

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
    is_admin boolean not null default false,
    last_seen_at timestamp,
    bio text,
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
  // Friends and private messages: the same rows Wordle Unlimited reads and writes.
  `create table if not exists friendships (
    id serial primary key,
    requester_id text not null references users(id) on delete cascade,
    addressee_id text not null references users(id) on delete cascade,
    status text not null default 'pending',
    notified boolean not null default false,
    created_at timestamp not null default now()
  )`,
  `create unique index if not exists "IDX_friendship_pair" on friendships(requester_id, addressee_id)`,
  `create table if not exists direct_messages (
    id serial primary key,
    from_user_id text not null references users(id) on delete cascade,
    to_user_id text not null references users(id) on delete cascade,
    content text not null,
    created_at timestamp not null default now(),
    read_at timestamp,
    notified boolean not null default false,
    reply_to_id integer,
    edited_at timestamp,
    deleted_at timestamp
  )`,
  `create table if not exists group_chats (
    id serial primary key,
    name text not null,
    owner_id text references users(id) on delete set null,
    created_at timestamp not null default now(),
    last_message_at timestamp not null default now()
  )`,
  `create table if not exists group_members (
    group_id integer not null references group_chats(id) on delete cascade,
    user_id text not null references users(id) on delete cascade,
    joined_at timestamp not null default now(),
    last_read_id integer not null default 0,
    notified_id integer not null default 0
  )`,
  `create unique index if not exists "IDX_group_member" on group_members(group_id, user_id)`,
  `create table if not exists group_messages (
    id serial primary key,
    group_id integer not null references group_chats(id) on delete cascade,
    from_user_id text references users(id) on delete set null,
    content text not null,
    created_at timestamp not null default now(),
    reply_to_id integer,
    edited_at timestamp,
    deleted_at timestamp
  )`,
  `create table if not exists message_reactions (
    id serial primary key,
    kind text not null,
    message_id integer not null,
    user_id text not null references users(id) on delete cascade,
    emoji text not null,
    created_at timestamp not null default now()
  )`,
  `create unique index if not exists "IDX_reaction_once" on message_reactions(kind, message_id, user_id, emoji)`,
  `create table if not exists favorite_gifs (
    id serial primary key,
    user_id text not null references users(id) on delete cascade,
    gif_id text not null,
    created_at timestamp not null default now()
  )`,
  `create unique index if not exists "IDX_favorite_gif" on favorite_gifs(user_id, gif_id)`,
  `create table if not exists chat_images (
    id text primary key,
    user_id text not null references users(id) on delete cascade,
    mime text not null,
    data text not null,
    bytes integer not null,
    width integer,
    height integer,
    created_at timestamp not null default now()
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
  // Push notifications, shared with Banter and Wordle (server/push.ts).
  ...PUSH_SCHEMA,
]
