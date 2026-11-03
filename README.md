# Lingora
Greatest language learning app of the 21st century

## Push notifications

Friend messages, group chats and friend requests can notify you (Profile → Account & sync →
Notifications). Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` to the
**same** values as Banter and Wordle Unlimited: all three share one table,
`push.subscriptions`, and each message notifies a device once, in one app (Banter first,
then Wordle, then Lingora). On iPhone / iPad it works after "Add to Home Screen".
The logic is in `server/push.ts` (kept the same in all three apps) and `public/sw.js`.
