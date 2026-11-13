import { useEffect, useState } from "react";

/*
 * 🔥 n: your streak with a friend (server/ops.ts friendStreaks), on friend lists and chat
 * headers. Orange and pulsing while it's at risk (one of you hasn't done anything today).
 * KEEP THIS FILE IDENTICAL in Banter, Wordle Unlimited and Lingora (npm run check:shared).
 */
export type FriendStreak = { friendId: string; name: string; days: number; meToday: boolean; themToday: boolean; atRisk: boolean };

let cache: { at: number; list: FriendStreak[] } | null = null;
let pending: Promise<FriendStreak[]> | null = null;
const subs = new Set<(l: FriendStreak[]) => void>();

function load(): Promise<FriendStreak[]> {
  if (cache && Date.now() - cache.at < 60_000) return Promise.resolve(cache.list);
  pending ??= fetch("/api/friend-streaks", { credentials: "include" })
    .then((r) => (r.ok ? r.json() : []))
    .then((list: FriendStreak[]) => { cache = { at: Date.now(), list }; subs.forEach((f) => f(list)); return list; })
    .catch(() => [])
    .finally(() => { pending = null; });
  return pending;
}

/** Everyone you have a streak with (one request shared by every badge on the page). */
export function useFriendStreaks(): Map<string, FriendStreak> {
  const [list, setList] = useState<FriendStreak[]>(cache?.list ?? []);
  useEffect(() => {
    subs.add(setList);
    void load().then(setList);
    return () => { subs.delete(setList); };
  }, []);
  return new Map(list.map((s) => [s.friendId, s]));
}

export function StreakBadge({ friendId, label }: { friendId: string; label?: (s: FriendStreak) => string }) {
  const s = useFriendStreaks().get(friendId);
  if (!s) return null;
  const title = label?.(s) ?? (s.atRisk
    ? `${s.days}-day streak: ends tonight unless you both do something today`
    : `${s.days}-day streak: you've both done something every day`);
  return (
    <span title={title} aria-label={title} data-testid="streak-badge"
      style={{ display: "inline-flex", alignItems: "center", gap: 2, padding: "1px 7px", borderRadius: 999, fontSize: 12, fontWeight: 800, lineHeight: 1.5, whiteSpace: "nowrap", flexShrink: 0,
        color: s.atRisk ? "#c2410c" : "#b45309", background: s.atRisk ? "rgba(249,115,22,.16)" : "rgba(245,158,11,.14)",
        animation: s.atRisk ? "streak-pulse 1.6s ease-in-out infinite" : undefined }}>
      <style>{"@keyframes streak-pulse{0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,.35)}50%{box-shadow:0 0 0 4px rgba(249,115,22,0)}}@media (prefers-reduced-motion:reduce){[data-testid=streak-badge]{animation:none!important}}"}</style>
      🔥 {s.days}
    </span>
  );
}
