# Lingora
Greatest language learning app of the 21st century

## Push notifications

Friend messages, group chats and friend requests can notify you (Profile → Account & sync →
Notifications). Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` to the
**same** values as Banter and Wordle Unlimited: all three share one table,
`push.subscriptions`, and each message notifies a device once, in one app (Banter first,
then Wordle, then Lingora). On iPhone / iPad it works after "Add to Home Screen".
The logic is in `server/push.ts` (kept the same in all three apps) and `public/sw.js`.

## Tests

`npm test` runs the unit tests. The coin wallet tests (`server/economy.test.ts`) also need
a throwaway Postgres database and are skipped without one:

```bash
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/lingora_test npm test
```

GitHub Actions (`.github/workflows/ci.yml`) runs the tests (with a Postgres), the typecheck
and the build on every push.

## Running against a local Postgres

The server uses Neon's HTTP driver. To run it against an ordinary local Postgres instead,
start the small Neon-compatible proxy and point the driver at it:

```bash
node scripts/neon-local.mjs
```

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/db NEON_FETCH_ENDPOINT=http://localhost:4444/sql npm start
```
