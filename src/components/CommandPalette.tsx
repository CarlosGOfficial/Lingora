import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

/*
 * The command palette (Ctrl/⌘+K, or openPalette()): jump to any page in this app or the
 * other two, find a friend, or run one of the app's own actions, from the keyboard.
 * KEEP THIS FILE IDENTICAL in Banter, Wordle Unlimited and Lingora (npm run check:shared
 * in Banter compares them). Inline styles only; it reads the page's text colour to pick a
 * light or dark panel. Each app passes its translations (`text`), how to move inside
 * itself (`navigate`) and any actions of its own. Rows for the other apps are real links,
 * so the cross-app link handler signs you in on the way.
 */

export type PaletteApp = "banter" | "wordle" | "lingora";
export type PaletteAction = { id: string; title: string; hint?: string; emoji?: string; keywords?: string; run: () => void };
/** A translation, or undefined to use the English built in here. */
export type PaletteText = (key: string, vars?: Record<string, string | number>) => string | undefined;

type Page = { id: string; title: string; path: string; emoji: string; keywords?: string };
const APPS: Record<PaletteApp, { name: string; color: string }> = {
  wordle: { name: "Wordle Unlimited", color: "#8b5cf6" },
  lingora: { name: "Lingora", color: "#ef4444" },
  banter: { name: "Banter", color: "#0d9488" },
};
/** Every app's main pages (the same list everywhere, so each app can jump into the others). */
export const PALETTE_PAGES: Record<PaletteApp, Page[]> = {
  wordle: [
    { id: "home", title: "Play: create or join a room", path: "/", emoji: "🎮", keywords: "home lobby multiplayer room" },
    { id: "daily", title: "Daily Challenge", path: "/daily", emoji: "📅", keywords: "today word" },
    { id: "archive", title: "Daily archive", path: "/daily/archive", emoji: "🗂️", keywords: "past days calendar" },
    { id: "adventure", title: "Adventure", path: "/adventure", emoji: "🗺️", keywords: "worlds levels stars solo" },
    { id: "packs", title: "Puzzle packs", path: "/packs", emoji: "🧩", keywords: "community word sets" },
    { id: "ranked", title: "Ranked", path: "/ranked", emoji: "⚔️", keywords: "1v1 rating ladder" },
    { id: "challenge", title: "Challenge a friend", path: "/challenge", emoji: "🎯", keywords: "send word" },
    { id: "clans", title: "Clans", path: "/clans", emoji: "🛡️", keywords: "crew team" },
    { id: "tournaments", title: "Tournaments", path: "/tournaments", emoji: "🏆", keywords: "bracket" },
    { id: "arcade", title: "Word Arcade", path: "/arcade", emoji: "🕹️", keywords: "word hunt wordsmith crossword sudoku typing" },
    { id: "season", title: "Season pass", path: "/season", emoji: "👑", keywords: "tiers rewards" },
    { id: "stats", title: "Stats", path: "/stats", emoji: "📊", keywords: "history graphs" },
    { id: "feed", title: "Reels", path: "/feed", emoji: "🎬", keywords: "feed posts clips" },
    { id: "recap", title: "Your recap", path: "/recap", emoji: "✨", keywords: "wrapped month" },
  ],
  lingora: [
    { id: "learn", title: "Learn", path: "/", emoji: "📚", keywords: "home lessons course" },
    { id: "review", title: "Review", path: "/review", emoji: "🔁", keywords: "due cards srs" },
    { id: "practice", title: "Practice", path: "/practice", emoji: "🎤", keywords: "speaking listening writing" },
    { id: "trainer", title: "Verb & grammar trainer", path: "/trainer", emoji: "✏️", keywords: "conjugation measure words forms" },
    { id: "characters", title: "Character explorer", path: "/characters", emoji: "🈶", keywords: "hanzi kanji radicals stroke order" },
    { id: "mistakes", title: "Mistakes notebook", path: "/mistakes", emoji: "🚩", keywords: "weak words" },
    { id: "decks", title: "Community decks", path: "/decks", emoji: "🗃️", keywords: "flashcards" },
    { id: "duels", title: "Duels", path: "/duels", emoji: "⚡", keywords: "race ranked" },
    { id: "study", title: "Study rooms", path: "/study", emoji: "⏱️", keywords: "focus timer pomodoro" },
    { id: "stories", title: "Stories", path: "/stories", emoji: "📖", keywords: "reading graded readers" },
    { id: "goals", title: "Goals & quests", path: "/goals", emoji: "🥅", keywords: "league badges" },
    { id: "friends", title: "Friends", path: "/friends", emoji: "👥", keywords: "leaderboard chat" },
    { id: "shop", title: "Shop", path: "/shop", emoji: "🛍️", keywords: "coins streak freeze" },
    { id: "crew", title: "Crew", path: "/crew", emoji: "🛡️", keywords: "clan war" },
    { id: "season", title: "Season pass", path: "/season", emoji: "👑", keywords: "tiers rewards" },
    { id: "recap", title: "Your recap", path: "/recap", emoji: "✨", keywords: "wrapped month" },
    { id: "profile", title: "Profile", path: "/profile", emoji: "🙂", keywords: "account settings" },
  ],
  banter: [
    { id: "chats", title: "Chats", path: "/chats", emoji: "💬", keywords: "dm messages groups home" },
    { id: "friends", title: "Friends", path: "/chats/friends", emoji: "👥", keywords: "add online pending" },
    { id: "servers", title: "Servers", path: "/servers", emoji: "🏠", keywords: "channels voice community" },
    { id: "apps", title: "Wordle & Lingora", path: "/games", emoji: "🎲", keywords: "overview today season" },
    { id: "crew", title: "Crew", path: "/games/crew", emoji: "🛡️", keywords: "clan war" },
    { id: "settings", title: "Settings", path: "/settings", emoji: "⚙️", keywords: "account theme notifications" },
  ],
};
/** Where "message this friend" lives in each app. */
const FRIEND_PATH: Record<PaletteApp, (f: { id: string; name: string }) => string> = {
  banter: (f) => `/chats/dm/${f.id}`,
  lingora: (f) => `/friends/chat/${f.id}`,
  wordle: (f) => `/u/${encodeURIComponent(f.name)}`,
};
const ORDER: PaletteApp[] = ["wordle", "lingora", "banter"];
const RECENT_KEY = "palette.recent";

type Row = { key: string; group: string; title: string; hint?: string; emoji: string; keywords: string; app?: PaletteApp; path?: string; href?: string; run?: () => void; online?: boolean };

/** How well `q` matches (0 = not at all). Start of the title beats inside it, beats keywords, beats scattered letters. */
export function paletteScore(q: string, title: string, keywords = ""): number {
  const s = q.trim().toLowerCase();
  if (!s) return 1;
  const t = title.toLowerCase(), k = keywords.toLowerCase();
  if (t.startsWith(s)) return 100;
  if (t.split(/[\s:&,]+/).some((w) => w.startsWith(s))) return 80;
  if (t.includes(s)) return 60;
  if (k.split(/\s+/).some((w) => w.startsWith(s))) return 40;
  let i = 0;
  for (const c of t) if (c === s[i]) i++;
  return i === s.length && s.length >= 2 ? 15 : 0;
}

export const openPalette = () => window.dispatchEvent(new Event("palette:open"));

export function CommandPalette({ app, navigate, text, actions = [], signedIn = true }: {
  app: PaletteApp;
  navigate: (path: string) => void;
  text?: PaletteText;
  actions?: PaletteAction[];
  signedIn?: boolean;
}) {
  const T = (key: string, en: string) => text?.(key) ?? en;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [urls, setUrls] = useState<Partial<Record<PaletteApp, string | null>>>({});
  const [friends, setFriends] = useState<{ id: string; name: string; online: boolean }[]>([]);
  const [dark, setDark] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const links = useRef(new Map<string, HTMLAnchorElement>());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((v) => !v); }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("palette:open", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("palette:open", onOpen); };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQ(""); setSel(0);
    // A light or a dark panel, from the page's own text colour.
    const m = /(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(getComputedStyle(document.body).color);
    setDark(!!m && (Number(m[1]) * 299 + Number(m[2]) * 587 + Number(m[3]) * 114) / 1000 > 150);
    setTimeout(() => input.current?.focus(), 0);
    fetch("/api/ops/apps").then((r) => (r.ok ? r.json() : {})).then((x) => setUrls(x ?? {})).catch(() => {});
    if (signedIn) {
      fetch(`/api/friends?today=${new Date().toISOString().slice(0, 10)}`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null))
        .then((d) => setFriends(((d?.friends ?? []) as { id: string; name?: string; username?: string; online?: boolean }[]).map((f) => ({ id: f.id, name: f.name ?? f.username ?? "?", online: !!f.online }))))
        .catch(() => {});
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, signedIn]);

  const rows = useMemo(() => {
    const all: Row[] = [];
    const pageTitle = (a: PaletteApp, p: Page) => T(`palette.${a}.${p.id}`, p.title);
    for (const p of PALETTE_PAGES[app]) all.push({ key: `${app}:${p.id}`, group: T("palette.goTo", "Go to"), title: pageTitle(app, p), emoji: p.emoji, keywords: `${p.title} ${p.keywords ?? ""}`, app, path: p.path });
    for (const a of actions) all.push({ key: `action:${a.id}`, group: T("palette.actions", "Actions"), title: a.title, hint: a.hint, emoji: a.emoji ?? "⚡", keywords: a.keywords ?? "", run: a.run });
    for (const f of friends) all.push({ key: `friend:${f.id}`, group: T("palette.friends", "Friends"), title: f.name, hint: app === "wordle" ? T("palette.profile", "Profile") : T("palette.message", "Message"), emoji: "👤", keywords: "friend message chat", app, path: FRIEND_PATH[app](f), online: f.online });
    for (const a of ORDER) {
      if (a === app || !urls[a]) continue;
      const base = String(urls[a]).replace(/\/$/, "");
      for (const p of PALETTE_PAGES[a]) all.push({ key: `${a}:${p.id}`, group: APPS[a].name, title: pageTitle(a, p), emoji: p.emoji, keywords: `${p.title} ${p.keywords ?? ""} ${APPS[a].name}`, app: a, href: base + p.path });
    }
    const query = q.trim();
    if (!query) {
      // Nothing typed: what you used last, then this app's pages and actions, and a few doors into the other apps.
      let recent: string[] = [];
      try { recent = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { /* private mode */ }
      const byKey = new Map(all.map((r) => [r.key, r]));
      const rec = recent.map((k) => byKey.get(k)).filter((r): r is Row => !!r).slice(0, 4).map((r) => ({ ...r, key: `recent:${r.key}`, group: T("palette.recent", "Recent") }));
      const others = all.filter((r) => r.href).filter((r) => ["daily", "home", "learn", "review", "chats", "servers"].includes(r.key.split(":")[1]));
      return [...rec, ...all.filter((r) => !r.href && !r.key.startsWith("friend:")), ...all.filter((r) => r.key.startsWith("friend:") && r.online).slice(0, 5), ...others];
    }
    return all.map((r) => ({ r, s: paletteScore(query, r.title, r.keywords) + (r.href ? 0 : 5) })).filter((x) => x.s > 5).sort((a, b) => b.s - a.s).slice(0, 14).map((x) => x.r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, urls, friends, actions, app, open]);

  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => { list.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`)?.scrollIntoView({ block: "nearest" }); }, [sel]);

  if (!open) return null;

  function choose(r: Row) {
    const key = r.key.replace(/^recent:/, "");
    try {
      const recent: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      localStorage.setItem(RECENT_KEY, JSON.stringify([key, ...recent.filter((k) => k !== key)].slice(0, 8)));
    } catch { /* private mode */ }
    setOpen(false);
    if (r.run) r.run();
    else if (r.href) links.current.get(r.key)?.click(); // a real link: the cross-app handler signs you in
    else if (r.path) navigate(r.path);
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((i) => Math.min(rows.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (rows[sel]) choose(rows[sel]); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
  }

  const fg = dark ? "#f1f5f9" : "#0f172a", bg = dark ? "#171a21" : "#ffffff", line = dark ? "rgba(255,255,255,.1)" : "rgba(15,23,42,.1)", muted = dark ? "rgba(241,245,249,.55)" : "rgba(15,23,42,.55)", hover = dark ? "rgba(255,255,255,.08)" : "rgba(15,23,42,.06)";
  const kbd: CSSProperties = { border: `1px solid ${line}`, borderRadius: 6, padding: "1px 6px", fontSize: 11, fontFamily: "inherit" };
  let lastGroup = "";
  return createPortal(
    <div data-testid="palette" role="dialog" aria-modal="true" aria-label={T("palette.title", "Search and jump")} onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(2,6,23,.45)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "12vh 12px 12px", animation: "palette-fade .12s ease" }}>
      <style>{`@keyframes palette-fade{from{opacity:0}to{opacity:1}}@keyframes palette-in{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){[data-testid=palette],[data-testid=palette] *{animation:none!important}}`}</style>
      <div style={{ width: "min(620px, 100%)", maxHeight: "min(560px, 76vh)", display: "flex", flexDirection: "column", background: bg, color: fg, borderRadius: 18, border: `1px solid ${line}`, boxShadow: "0 30px 80px -20px rgba(2,6,23,.55)", overflow: "hidden", animation: "palette-in .16s ease", fontSize: 14, textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: `1px solid ${line}` }}>
          <span aria-hidden style={{ opacity: 0.55, fontSize: 16 }}>⌕</span>
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyDown} data-testid="palette-input"
            placeholder={T("palette.placeholder", "Search pages, friends and actions…")} autoComplete="off" spellCheck={false}
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", color: "inherit", font: "inherit", fontSize: 16 }} />
          <kbd style={{ ...kbd, color: muted }}>esc</kbd>
        </div>
        <div ref={list} role="listbox" style={{ overflowY: "auto", padding: 6 }}>
          {rows.length === 0 && <p style={{ margin: 0, padding: "22px 12px", textAlign: "center", color: muted }} data-testid="palette-empty">{T("palette.none", "Nothing matches that.")}</p>}
          {rows.map((r, i) => {
            const head = r.group !== lastGroup ? r.group : null;
            lastGroup = r.group;
            const active = i === sel;
            const style: CSSProperties = { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", borderRadius: 10, border: "none", background: active ? hover : "transparent", color: "inherit", font: "inherit", textDecoration: "none", cursor: "pointer", textAlign: "left", boxSizing: "border-box" };
            const inner = (
              <>
                <span aria-hidden style={{ position: "relative", width: 26, textAlign: "center", fontSize: 17, flexShrink: 0 }}>
                  {r.emoji}
                  {r.online && <span style={{ position: "absolute", right: 0, bottom: 0, width: 8, height: 8, borderRadius: 9, background: "#22c55e", border: `2px solid ${bg}` }} />}
                </span>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{r.title}</span>
                {r.hint && <span style={{ color: muted, fontSize: 12, flexShrink: 0 }}>{r.hint}</span>}
                {r.href && r.app && <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: APPS[r.app].color, border: `1px solid ${APPS[r.app].color}55`, borderRadius: 99, padding: "1px 8px" }}>{APPS[r.app].name} ↗</span>}
                {active && <kbd style={{ ...kbd, color: muted, flexShrink: 0 }}>↵</kbd>}
              </>
            );
            return (
              <div key={r.key}>
                {head && <div style={{ padding: "10px 10px 4px", fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: muted }}>{head}</div>}
                {r.href
                  ? <a ref={(el) => { if (el) links.current.set(r.key, el); else links.current.delete(r.key); }} href={r.href} role="option" aria-selected={active} data-i={i} data-testid="palette-row" style={style} onMouseMove={() => setSel(i)} onClick={() => setOpen(false)}>{inner}</a>
                  : <button type="button" role="option" aria-selected={active} data-i={i} data-testid="palette-row" style={style} onMouseMove={() => setSel(i)} onClick={() => choose(r)}>{inner}</button>}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 14, padding: "8px 14px", borderTop: `1px solid ${line}`, color: muted, fontSize: 11.5, flexWrap: "wrap" }}>
          <span><kbd style={kbd}>↑</kbd> <kbd style={kbd}>↓</kbd> {T("palette.move", "to move")}</span>
          <span><kbd style={kbd}>↵</kbd> {T("palette.open", "to open")}</span>
          <span style={{ marginLeft: "auto" }}><kbd style={kbd}>{typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"}</kbd> <kbd style={kbd}>K</kbd></span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
