import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

/*
 * One profile for Banter, Wordle Unlimited and Lingora (server/ops.ts profileCard): the
 * banner, accent, bio, pronouns and links from Banter's profile, with each app's numbers,
 * pinned trophies, crew and your streak together. Your own card has "Edit profile" (bio,
 * pronouns, banner, colour, links: saved once, shown in all three) and "Change password".
 * KEEP THIS FILE IDENTICAL in Banter, Wordle Unlimited and Lingora (npm run check:shared).
 * Inline styles only, from the page's own text colour, so it sits in any theme.
 */

export type ProfileCardData = {
  id: string; name: string; avatar: string | null; mine: boolean; friend: boolean;
  bio: string | null; pronouns: string; accent: string; banner: { kind: "preset"; id: string } | { kind: "css"; css: string };
  word: { letters: string; colors: string[] } | null; links: { label: string; url: string }[];
  joined: string | null; lastSeen: string | null; online: boolean;
  wordle: { played: number; won: number; dailyStreak: number; rating: number | null } | null;
  lingora: { langs: { lang: string; xp: number }[]; streak: number } | null;
  banter: { servers: number; mutualServers: number } | null;
  trophies: { name: string; icon: string; tier: string }[];
  crew: { name: string; tag: string; emoji: string } | null;
  streak: number;
  urls: Record<"banter" | "wordle" | "lingora", string | null>;
};
export type ProfileText = (key: string, vars?: Record<string, string | number>) => string | undefined;

/** Must match PROFILE_BANNERS in server/ops.ts (check:shared). */
export const CARD_BANNERS: Record<string, string> = {
  grape: "linear-gradient(120deg, #7c3aed 0%, #c026d3 100%)",
  sunrise: "linear-gradient(120deg, #f59e0b 0%, #ef4444 60%, #c026d3 100%)",
  unlimited: "linear-gradient(110deg, #7c3aed 0%, #f59e0b 100%)",
  tiles: "repeating-linear-gradient(90deg, #6aaa64 0 40px, #c9b458 40px 80px, #787c7e 80px 120px)",
  meadow: "linear-gradient(120deg, #16a34a 0%, #6aaa64 50%, #c9b458 100%)",
  ocean: "linear-gradient(120deg, #0ea5e9 0%, #6366f1 100%)",
  midnight: "linear-gradient(120deg, #0f172a 0%, #312e81 60%, #7c3aed 100%)",
  candy: "linear-gradient(120deg, #f472b6 0%, #a78bfa 50%, #60a5fa 100%)",
  ember: "radial-gradient(circle at 20% 120%, #f97316 0%, #b91c1c 45%, #1c1917 100%)",
  mint: "linear-gradient(120deg, #34d399 0%, #22d3ee 100%)",
};
const ACCENTS = ["#7c3aed", "#6366f1", "#0ea5e9", "#14b8a6", "#6aaa64", "#c9b458", "#f59e0b", "#f97316", "#ef4444", "#ec4899"];
const LANGS: Record<string, string> = { zh: "🇨🇳 Chinese", ja: "🇯🇵 Japanese", pt: "🇧🇷 Portuguese" };
const TILE: Record<string, string> = { g: "#6aaa64", y: "#c9b458", x: "#787c7e" };
const TIER: Record<string, string> = { special: "#a855f7", gold: "#eab308", silver: "#94a3b8", bronze: "#c2733a" };
const fill = (s: string, v: Record<string, string | number> = {}) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
const soft = (pct: number) => `color-mix(in srgb, currentColor ${pct}%, transparent)`;

async function call<T>(method: string, url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, { method, credentials: "include", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(String(d.message ?? d.error ?? "Something went wrong."));
  return d as T;
}

/** Load someone's card (by id or username) and show it. */
export function ProfileCard({ profileKey, text, app, children }: { profileKey: string; text?: ProfileText; app: "banter" | "wordle" | "lingora"; children?: ReactNode }) {
  const T = (k: string, en: string, v?: Record<string, string | number>) => fill(text?.(k, v) ?? en, v);
  const [data, setData] = useState<ProfileCardData | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [pw, setPw] = useState(false);
  const load = () => call<ProfileCardData>("GET", `/api/profile-card/${encodeURIComponent(profileKey)}`).then(setData, () => setData(null));
  useEffect(() => { setData(undefined); void load(); }, [profileKey]); // eslint-disable-line react-hooks/exhaustive-deps
  if (data === undefined) return <div data-testid="profile-card-loading" style={{ height: 220, borderRadius: 24, background: soft(5) }} />;
  if (data === null) return <p style={{ opacity: 0.7 }} data-testid="profile-card-missing">{T("pc.missing", "This profile isn't available.")}</p>;
  const d = data;
  const banner = d.banner.kind === "preset" ? CARD_BANNERS[d.banner.id] ?? d.accent : d.banner.css;
  const stat = (value: ReactNode, label: string, key: string) => (
    <div key={key} style={{ minWidth: 0, padding: "10px 12px", borderRadius: 14, background: soft(4) }}>
      <div style={{ fontWeight: 900, fontSize: 18, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11.5, opacity: 0.65, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
    </div>
  );
  const section = (title: string, appKey: "banter" | "wordle" | "lingora", items: ReactNode[]) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", opacity: 0.6 }}>
        {title}{appKey !== app && d.urls[appKey] && <a href={`${d.urls[appKey]!.replace(/\/$/, "")}/u/${encodeURIComponent(d.name)}`} style={{ color: "inherit", textDecoration: "none", opacity: 0.8 }}>↗</a>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 6 }}>{items}</div>
    </div>
  );
  return (
    <section data-testid="profile-card" style={{ borderRadius: 24, overflow: "hidden", border: `1px solid ${soft(10)}`, background: `linear-gradient(180deg, color-mix(in srgb, ${d.accent} 7%, transparent), transparent 60%)` }}>
      <div style={{ height: 110, background: banner, position: "relative" }}>
        {d.crew && <span style={{ position: "absolute", right: 12, top: 12, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800, color: "#fff", background: "rgba(0,0,0,.35)", backdropFilter: "blur(6px)" }}>{d.crew.emoji} {d.crew.name} [{d.crew.tag}]</span>}
      </div>
      <div style={{ padding: "0 18px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px 14px", marginTop: -30, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          <div style={{ position: "relative", width: 84, height: 84, borderRadius: 999, border: `4px solid ${d.accent}`, background: d.avatar ? `center/cover url("${d.avatar}")` : `linear-gradient(135deg, ${d.accent}, ${d.accent}99)`, display: "grid", placeItems: "center", color: "#fff", fontWeight: 900, fontSize: 32, flexShrink: 0, boxShadow: "0 8px 24px -10px rgba(0,0,0,.4)" }}>
            {!d.avatar && d.name.slice(0, 1).toUpperCase()}
            {d.online && <span style={{ position: "absolute", right: 2, bottom: 2, width: 16, height: 16, borderRadius: 99, background: "#22c55e", border: "3px solid Canvas" }} />}
          </div>
          {/* Starts below the banner (the avatar overlaps it by 30px), however many lines it takes. */}
          <div style={{ minWidth: 150, flex: "1 1 180px", paddingTop: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, lineHeight: 1.15, overflowWrap: "anywhere" }} data-testid="profile-name">{d.name}</h2>
              {d.pronouns && <span style={{ fontSize: 12.5, opacity: 0.65 }}>{d.pronouns}</span>}
              {d.streak > 0 && <span title={T("pc.streak", "{n}-day streak together", { n: d.streak })} style={{ padding: "1px 8px", borderRadius: 999, fontSize: 12, fontWeight: 800, color: "#b45309", background: "rgba(245,158,11,.15)" }}>🔥 {d.streak}</span>}
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.6 }}>
              {d.online ? T("pc.online", "Online now") : d.lastSeen ? T("pc.lastSeen", "Last seen {when}", { when: new Date(d.lastSeen).toLocaleDateString() }) : ""}
              {d.joined && ` · ${T("pc.joined", "Joined {when}", { when: new Date(d.joined).toLocaleDateString(undefined, { month: "short", year: "numeric" }) })}`}
            </div>
          </div>
          {d.mine && (
            <div style={{ display: "flex", gap: 6, paddingTop: 36, flexWrap: "wrap" }}>
              <button type="button" onClick={() => setEditing(true)} data-testid="profile-edit" style={btn(d.accent, true)}>{T("pc.edit", "Edit profile")}</button>
              <button type="button" onClick={() => setPw(true)} data-testid="profile-password" style={btn(d.accent, false)}>{T("pc.password", "Password")}</button>
            </div>
          )}
        </div>
        {d.word && (
          <div style={{ display: "flex", gap: 4, marginTop: 12 }} aria-label={d.word.letters}>
            {Array.from(d.word.letters).map((ch, i) => <span key={i} style={{ width: 28, height: 28, borderRadius: 6, display: "grid", placeItems: "center", fontWeight: 900, color: "#fff", background: TILE[d.word!.colors[i]] ?? TILE.x }}>{ch}</span>)}
          </div>
        )}
        {d.bio && <p style={{ margin: "12px 0 0", lineHeight: 1.5, overflowWrap: "anywhere" }} data-testid="profile-bio">{d.bio}</p>}
        {d.links.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {d.links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer nofollow" style={{ padding: "4px 10px", borderRadius: 999, border: `1px solid ${soft(14)}`, color: "inherit", textDecoration: "none", fontSize: 12.5, fontWeight: 700 }}>🔗 {l.label}</a>)}
          </div>
        )}
        {d.trophies.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }} data-testid="profile-trophies">
            {d.trophies.map((tr, i) => <span key={i} title={tr.name} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, border: `1.5px solid ${TIER[tr.tier] ?? soft(20)}` }}>{tr.icon} {tr.name}</span>)}
          </div>
        )}
        <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
          {d.wordle && section("Wordle Unlimited", "wordle", [
            stat(d.wordle.won, T("pc.wins", "wins of {n}", { n: d.wordle.played }), "w"),
            stat(`🔥 ${d.wordle.dailyStreak}`, T("pc.dailyStreak", "Daily streak"), "d"),
            ...(d.wordle.rating != null ? [stat(d.wordle.rating, T("pc.rating", "ranked rating"), "r")] : []),
          ])}
          {d.lingora && section("Lingora", "lingora", [
            ...d.lingora.langs.slice(0, 3).map((l) => stat(l.xp.toLocaleString(), T(`pc.lang.${l.lang}`, `${LANGS[l.lang] ?? l.lang} XP`), l.lang)),
            stat(`🔥 ${d.lingora.streak}`, T("pc.lingoraStreak", "day streak"), "s"),
          ])}
          {d.banter && section("Banter", "banter", [
            stat(d.banter.servers, T("pc.servers", "servers"), "s"),
            ...(!d.mine ? [stat(d.banter.mutualServers, T("pc.mutual", "servers in common"), "m")] : []),
          ])}
        </div>
        {children}
      </div>
      {editing && <ProfileEditor data={d} T={T} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); void load(); }} />}
      {pw && <PasswordDialog T={T} accent={d.accent} onClose={() => setPw(false)} />}
    </section>
  );
}

const btn = (accent: string, primary: boolean): CSSProperties => ({
  padding: "7px 14px", borderRadius: 999, font: "inherit", fontSize: 13, fontWeight: 800, cursor: "pointer",
  border: primary ? "none" : `1px solid ${soft(18)}`, color: primary ? "#fff" : "inherit", background: primary ? accent : "transparent",
});
const field: CSSProperties = { width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 12, border: `1px solid ${soft(16)}`, background: soft(4), color: "inherit", font: "inherit" };
const label: CSSProperties = { display: "block", fontSize: 12, fontWeight: 800, margin: "12px 0 5px", opacity: 0.75 };

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(2,6,23,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <div style={{ width: "min(460px, 100%)", maxHeight: "90vh", overflowY: "auto", borderRadius: 20, padding: 18, background: "Canvas", color: "CanvasText", boxShadow: "0 30px 80px -20px rgba(2,6,23,.5)" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ProfileEditor({ data, T, onClose, onSaved }: { data: ProfileCardData; T: (k: string, en: string, v?: Record<string, string | number>) => string; onClose: () => void; onSaved: () => void }) {
  const [bio, setBio] = useState(data.bio ?? "");
  const [pronouns, setPronouns] = useState(data.pronouns);
  const [accent, setAccent] = useState(data.accent);
  const [banner, setBanner] = useState(data.banner.kind === "preset" ? data.banner.id : "");
  const [links, setLinks] = useState([...data.links, { label: "", url: "" }, { label: "", url: "" }, { label: "", url: "" }].slice(0, 3));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true); setError(null);
    try {
      await call("PUT", "/api/profile-card", { bio, pronouns, accent, ...(banner ? { banner } : {}), links: links.filter((l) => l.url.trim()) });
      onSaved();
    } catch (e) { setError((e as Error).message); } finally { setSaving(false); }
  }
  return (
    <Dialog title={T("pc.editTitle", "Edit profile")} onClose={onClose}>
      <p style={{ margin: 0, fontSize: 12.5, opacity: 0.65 }}>{T("pc.editHint", "Shown in Banter, Wordle Unlimited and Lingora.")}</p>
      <label style={label}>{T("pc.bio", "Bio")} <span style={{ opacity: 0.6 }}>{bio.length}/160</span></label>
      <textarea value={bio} maxLength={160} rows={3} onChange={(e) => setBio(e.target.value)} style={{ ...field, resize: "vertical" }} data-testid="pe-bio" />
      <label style={label}>{T("pc.pronouns", "Pronouns")}</label>
      <input value={pronouns} maxLength={24} onChange={(e) => setPronouns(e.target.value)} style={field} data-testid="pe-pronouns" />
      <label style={label}>{T("pc.banner", "Banner")}</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
        {Object.entries(CARD_BANNERS).map(([id, css]) => <button key={id} type="button" aria-label={id} onClick={() => setBanner(id)} data-testid={`pe-banner-${id}`} style={{ height: 34, borderRadius: 10, border: banner === id ? "3px solid CanvasText" : `1px solid ${soft(15)}`, background: css, cursor: "pointer" }} />)}
      </div>
      <label style={label}>{T("pc.accent", "Colour")}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {ACCENTS.map((c) => <button key={c} type="button" aria-label={c} onClick={() => setAccent(c)} style={{ width: 30, height: 30, borderRadius: 99, border: accent === c ? "3px solid CanvasText" : "none", background: c, cursor: "pointer" }} />)}
      </div>
      <label style={label}>{T("pc.links", "Links")}</label>
      {links.map((l, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 6, marginBottom: 6 }}>
          <input placeholder={T("pc.linkLabel", "Label")} value={l.label} maxLength={30} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} style={field} />
          <input placeholder="https://" value={l.url} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} style={field} data-testid={`pe-link-${i}`} />
        </div>
      ))}
      {error && <p role="alert" style={{ color: "#dc2626", fontSize: 13, margin: "8px 0 0" }}>{error}</p>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <button type="button" onClick={onClose} style={btn(accent, false)}>{T("pc.cancel", "Cancel")}</button>
        <button type="button" disabled={saving} onClick={save} style={btn(accent, true)} data-testid="pe-save">{T("pc.save", "Save")}</button>
      </div>
      {data.urls.banter && <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 0 }}>{T("pc.more", "Banner pictures, a status and more in")} <a href={`${data.urls.banter.replace(/\/$/, "")}/settings/profile`} style={{ color: "inherit", fontWeight: 700 }}>Banter ↗</a></p>}
    </Dialog>
  );
}

function PasswordDialog({ T, accent, onClose }: { T: (k: string, en: string, v?: Record<string, string | number>) => string; accent: string; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [state, setState] = useState<{ error?: string; done?: boolean; busy?: boolean }>({});
  async function save() {
    setState({ busy: true });
    try { await call("POST", "/api/profile-card/password", { current, next }); setState({ done: true }); } catch (e) { setState({ error: (e as Error).message }); }
  }
  return (
    <Dialog title={T("pc.passwordTitle", "Change password")} onClose={onClose}>
      <p style={{ margin: 0, fontSize: 12.5, opacity: 0.65 }}>{T("pc.passwordHint", "One password for Banter, Wordle Unlimited and Lingora.")}</p>
      {state.done ? <p style={{ margin: "14px 0 0", fontWeight: 700, color: "#16a34a" }} data-testid="pw-done">✓ {T("pc.passwordDone", "Password changed in all three apps.")}</p> : (
        <>
          <label style={label}>{T("pc.current", "Current password")}</label>
          <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} style={field} data-testid="pw-current" />
          <label style={label}>{T("pc.new", "New password (8+ characters)")}</label>
          <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} style={field} data-testid="pw-new" />
          {state.error && <p role="alert" style={{ color: "#dc2626", fontSize: 13, margin: "8px 0 0" }}>{state.error}</p>}
        </>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <button type="button" onClick={onClose} style={btn(accent, false)}>{state.done ? T("pc.close", "Close") : T("pc.cancel", "Cancel")}</button>
        {!state.done && <button type="button" disabled={state.busy || next.length < 8} onClick={save} style={btn(accent, true)} data-testid="pw-save">{T("pc.save", "Save")}</button>}
      </div>
    </Dialog>
  );
}
