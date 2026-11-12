import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";

/*
 * "Today", across the three apps (server/ops.ts todayFor): what you've done and what's
 * waiting in Wordle Unlimited, Lingora and Banter, your crew war and the season, and the
 * daily trio (do something in all three, claim coins).
 * KEEP THIS FILE IDENTICAL in Banter, Wordle Unlimited and Lingora (npm run check:shared
 * in Banter compares them). Inline styles only, built on the page's own text colour, so
 * it sits in any theme; each app passes its own translations (`text`) and how to move
 * around inside itself (`navigate`). Links to the other apps are plain links: the
 * cross-app link handler signs you in on the way.
 */

export type TodayApp = "banter" | "wordle" | "lingora";
export type Today = {
  day: string;
  wordle: { rounds: number; wins: number; dailyDone: boolean; dailyWon: boolean; dailyStreak: number };
  lingora: { xp: number; lessons: number; reviews: number; streak: number };
  banter: { sent: number; unread: number; notifications: number };
  trio: { wordle: boolean; lingora: boolean; banter: boolean; claimed: boolean; coins: number; streak: number };
  crew: { name: string; emoji: string; total: number; war: { opponent: string; mine: number; theirs: number; endsAt: string } | null } | null;
  season: { name: string; tier: number; xp: number; tierXp: number; today: number; dayCap: number } | null;
  coins: number;
  urls: Record<TodayApp, string | null>;
};
/** A translation, or undefined to use the English built in here. */
export type TodayText = (key: string, vars?: Record<string, string | number>) => string | undefined;

const fill = (s: string, vars: Record<string, string | number> = {}) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
const APPS: Record<TodayApp, { name: string; from: string; to: string; glyph: string }> = {
  wordle: { name: "Wordle Unlimited", from: "#8b5cf6", to: "#f59e0b", glyph: "W" },
  lingora: { name: "Lingora", from: "#ef4444", to: "#f97316", glyph: "L" },
  banter: { name: "Banter", from: "#0d9488", to: "#14b8a6", glyph: "B" },
};
const ORDER: TodayApp[] = ["wordle", "lingora", "banter"];
/** Where each app's tile goes. */
const PATHS: Record<TodayApp, (t: Today) => string> = {
  wordle: (t) => (t.wordle.dailyDone ? "/" : "/daily"),
  lingora: () => "/",
  banter: () => "/",
};
const soft = (pct: number) => `color-mix(in srgb, currentColor ${pct}%, transparent)`;

let cached: Today | null = null;

export function TodayStrip({ app, navigate, text, lingoraDue, onClaimed, style }: {
  app: TodayApp;
  /** Go to a path inside this app. */
  navigate: (path: string) => void;
  text?: TodayText;
  /** Reviews due on this device (only Lingora knows). */
  lingoraDue?: number;
  onClaimed?: (r: { coins: number; streak: number }) => void;
  style?: CSSProperties;
}) {
  const T = (key: string, en: string, vars?: Record<string, string | number>) => fill(text?.(key, vars) ?? en, vars);
  const [today, setToday] = useState<Today | null>(cached);
  const [claiming, setClaiming] = useState(false);
  const [burst, setBurst] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/today", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((t: Today | null) => { if (t) { cached = t; setToday(t); } })
      .catch(() => {});
  }, []);
  useEffect(() => {
    load();
    // Coming back from another app (or tab): what you did there shows up.
    const onShow = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onShow);
    window.addEventListener("focus", onShow);
    return () => { document.removeEventListener("visibilitychange", onShow); window.removeEventListener("focus", onShow); };
  }, [load]);

  if (!today) return null;
  const { trio } = today;
  const doneCount = ORDER.filter((a) => trio[a]).length;
  const ready = doneCount === 3 && !trio.claimed;

  async function claim() {
    if (claiming || !ready) return;
    setClaiming(true); setError(null);
    try {
      const r = await fetch("/api/today/claim", { method: "POST", credentials: "include" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(String(d.message ?? d.error ?? T("today.claimFailed", "Couldn't claim that. Try again."))); return; }
      cached = d.today; setToday(d.today); setBurst(d.coins);
      setTimeout(() => setBurst(null), 2600);
      onClaimed?.({ coins: d.coins, streak: d.streak });
    } catch { setError(T("today.claimFailed", "Couldn't claim that. Try again.")); } finally { setClaiming(false); }
  }

  const status: Record<TodayApp, { head: string; sub: string; nudge: boolean }> = {
    wordle: today.wordle.dailyDone
      ? { head: today.wordle.dailyWon ? T("today.dailySolved", "Daily solved") : T("today.dailyPlayed", "Daily played"), nudge: false,
          sub: today.wordle.rounds ? T("today.rounds", "{wins} won of {n} rounds today", { wins: today.wordle.wins, n: today.wordle.rounds }) : T("today.dailyStreak", "{n}-day Daily streak", { n: today.wordle.dailyStreak }) }
      : { head: T("today.dailyWaiting", "Today's word is waiting"), nudge: true,
          sub: today.wordle.dailyStreak > 0 ? T("today.keepDaily", "Keep your {n}-day Daily streak", { n: today.wordle.dailyStreak }) : today.wordle.rounds ? T("today.rounds", "{wins} won of {n} rounds today", { wins: today.wordle.wins, n: today.wordle.rounds }) : T("today.dailyHint", "One word, same for everyone") },
    lingora: lingoraDue && lingoraDue > 0
      ? { head: T("today.due", "{n} reviews due", { n: lingoraDue }), nudge: true, sub: today.lingora.xp ? T("today.xp", "{n} XP today", { n: today.lingora.xp }) : T("today.dueHint", "Catch them before they fade") }
      : today.lingora.xp
        ? { head: T("today.xp", "{n} XP today", { n: today.lingora.xp }), nudge: false, sub: T("today.streak", "{n}-day streak", { n: Math.max(1, today.lingora.streak) }) }
        : { head: T("today.learn", "5 minutes of practice"), nudge: true, sub: today.lingora.streak > 0 ? T("today.keepStreak", "Keep your {n}-day streak", { n: today.lingora.streak }) : T("today.learnHint", "Chinese, Japanese or Portuguese") },
    banter: today.banter.unread
      ? { head: T("today.unread", "{n} unread", { n: today.banter.unread }), nudge: true, sub: T("today.unreadHint", "Someone's waiting on you") }
      : today.banter.sent
        ? { head: T("today.caughtUp", "All caught up"), nudge: false, sub: T("today.sent", "{n} sent today", { n: today.banter.sent }) }
        : { head: T("today.sayHi", "Say hi to someone"), nudge: true, sub: T("today.sayHiHint", "Chats, servers and voice") },
  };

  const tile = (a: TodayApp) => {
    const meta = APPS[a], st = status[a], here = a === app, path = PATHS[a](today);
    const base = today.urls[a];
    const inner: ReactNode = (
      <>
        <span style={{ position: "relative", flexShrink: 0, width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center", color: "#fff", fontWeight: 900, fontSize: 18, background: `linear-gradient(135deg, ${meta.from}, ${meta.to})`, boxShadow: `0 6px 16px -6px ${meta.from}` }}>
          {meta.glyph}
          {trio[a] && <span aria-hidden style={{ position: "absolute", right: -5, bottom: -5, width: 18, height: 18, borderRadius: 99, background: "#16a34a", color: "#fff", fontSize: 11, display: "grid", placeItems: "center", border: "2px solid Canvas" }}>✓</span>}
        </span>
        <span style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 1, textAlign: "left" }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", opacity: 0.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta.name}{here ? "" : " ↗"}</span>
          <span style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{st.head}</span>
          <span style={{ fontSize: 12, opacity: 0.65, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{st.sub}</span>
        </span>
        {st.nudge && <span aria-hidden style={{ marginLeft: "auto", flexShrink: 0, width: 8, height: 8, borderRadius: 99, background: meta.from, boxShadow: `0 0 0 4px color-mix(in srgb, ${meta.from} 22%, transparent)` }} />}
      </>
    );
    const s: CSSProperties = {
      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16, border: `1px solid ${soft(12)}`, background: soft(3),
      color: "inherit", textDecoration: "none", font: "inherit", cursor: "pointer", minWidth: 0, transition: "transform .15s ease, border-color .15s ease, background .15s ease",
    };
    const hover = { onMouseEnter: (e: { currentTarget: HTMLElement }) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = meta.from; }, onMouseLeave: (e: { currentTarget: HTMLElement }) => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = soft(12); } };
    return here || !base
      ? <button key={a} type="button" data-testid={`today-${a}`} style={s} {...hover} onClick={() => here && navigate(path)} disabled={!here}>{inner}</button>
      : <a key={a} data-testid={`today-${a}`} style={s} {...hover} href={base.replace(/\/$/, "") + path}>{inner}</a>;
  };

  const chip = (key: string, children: ReactNode, to: string | { href: string }) => {
    const s: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: `1px solid ${soft(12)}`, background: "transparent", color: "inherit", textDecoration: "none", font: "inherit", fontSize: 12.5, cursor: "pointer", maxWidth: "100%" };
    return typeof to === "string"
      ? <button key={key} type="button" onClick={() => navigate(to)} data-testid={`today-chip-${key}`} style={s}>{children}</button>
      : <a key={key} href={to.href} data-testid={`today-chip-${key}`} style={s}>{children}</a>;
  };
  // Banter has no season page of its own: the pass lives in Wordle.
  const seasonTo = app === "banter" && today.urls.wordle ? { href: today.urls.wordle.replace(/\/$/, "") + "/season" } : "/season";
  const seasonPct = today.season ? Math.min(100, Math.round(((today.season.xp % today.season.tierXp) / today.season.tierXp) * 100)) : 0;
  const crewPath = app === "wordle" ? "/clans" : app === "banter" ? "/games/crew" : "/crew";

  return (
    <section data-testid="today-strip" aria-label={T("today.title", "Today")}
      style={{ position: "relative", borderRadius: 22, border: `1px solid ${soft(10)}`, padding: 16, display: "flex", flexDirection: "column", gap: 12, overflow: "hidden",
        background: `linear-gradient(120deg, color-mix(in srgb, #8b5cf6 9%, transparent), color-mix(in srgb, #f97316 7%, transparent) 50%, color-mix(in srgb, #0d9488 9%, transparent))`, ...style }}>
      <style>{`@keyframes today-pop{0%{transform:translateY(8px) scale(.9);opacity:0}15%{transform:translateY(0) scale(1.06);opacity:1}80%{opacity:1}100%{transform:translateY(-14px);opacity:0}}@keyframes today-glow{0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,.45)}50%{box-shadow:0 0 0 8px rgba(245,158,11,0)}}@media (prefers-reduced-motion:reduce){[data-testid=today-strip] *{animation:none!important;transition:none!important}}`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", marginRight: "auto", minWidth: 0 }}>
          <strong style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>{T("today.title", "Today")}</strong>
          <span style={{ fontSize: 12.5, opacity: 0.7 }} data-testid="today-trio-line">
            {trio.claimed ? T("today.trioClaimed", "Daily trio done · {n} in a row", { n: trio.streak })
              : ready ? T("today.trioReady", "All three done: claim your coins!")
              : T("today.trioHint", "Daily trio: do something in all three for {coins} coins", { coins: trio.coins })}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }} aria-label={T("today.trioProgress", "{n} of 3 done", { n: doneCount })}>
          {ORDER.map((a, i) => (
            <span key={a} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && <span style={{ width: 14, height: 2, borderRadius: 2, background: trio[a] && trio[ORDER[i - 1]] ? "#16a34a" : soft(18) }} />}
              <span title={APPS[a].name} style={{ width: 26, height: 26, borderRadius: 99, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 900, color: trio[a] ? "#fff" : "inherit", background: trio[a] ? `linear-gradient(135deg, ${APPS[a].from}, ${APPS[a].to})` : "transparent", border: trio[a] ? "none" : `2px dashed ${soft(30)}`, transition: "all .3s ease" }}>{trio[a] ? "✓" : APPS[a].glyph}</span>
            </span>
          ))}
        </div>
        <span style={{ position: "relative" }}>
          <button type="button" onClick={claim} disabled={!ready || claiming} data-testid="today-claim"
            style={{ padding: "8px 16px", borderRadius: 999, border: "none", font: "inherit", fontWeight: 800, fontSize: 13.5, cursor: ready ? "pointer" : "default",
              color: ready ? "#422006" : "inherit", background: ready ? "linear-gradient(135deg, #fbbf24, #f59e0b)" : soft(8), opacity: ready || trio.claimed ? 1 : 0.7, animation: ready ? "today-glow 1.8s ease-in-out infinite" : undefined }}>
            {trio.claimed ? `✓ ${T("today.claimed", "Claimed")}` : `🪙 ${trio.coins}`}
          </button>
          {burst !== null && <span aria-live="polite" style={{ position: "absolute", right: 0, top: -26, whiteSpace: "nowrap", fontWeight: 900, color: "#d97706", animation: "today-pop 2.6s ease forwards", pointerEvents: "none" }}>+{burst} 🪙</span>}
        </span>
      </div>
      {error && <span role="alert" style={{ fontSize: 12.5, color: "#dc2626" }}>{error}</span>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>{ORDER.map(tile)}</div>
      {(today.crew || today.season) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {today.crew && chip("crew", today.crew.war
            ? <><span>{today.crew.emoji}</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{T("today.war", "Crew war vs {name}", { name: today.crew.war.opponent })}</span><strong style={{ color: today.crew.war.mine >= today.crew.war.theirs ? "#16a34a" : "#dc2626" }}>{today.crew.war.mine}–{today.crew.war.theirs}</strong></>
            : <><span>{today.crew.emoji}</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{today.crew.name}</span><strong>{T("today.crewPoints", "{n} pts this week", { n: today.crew.total })}</strong></>,
            crewPath)}
          {today.season && chip("season", <>
            <span>👑</span><span>{T("today.seasonTier", "{name} · Tier {n}", { name: today.season.name, n: today.season.tier })}</span>
            <span aria-hidden style={{ width: 56, height: 5, borderRadius: 9, background: soft(14), overflow: "hidden", display: "inline-block" }}><span style={{ display: "block", width: `${seasonPct}%`, height: "100%", borderRadius: 9, background: "linear-gradient(90deg, #f59e0b, #f97316)" }} /></span>
          </>, seasonTo)}
        </div>
      )}
    </section>
  );
}
