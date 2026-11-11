import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

/*
 * The monthly recap ("Wrapped", server/ops.ts recapFor) as a short story of cards.
 * KEEP THIS FILE IDENTICAL in Banter, Wordle Unlimited and Lingora (npm run check:shared
 * in Banter compares them). It uses inline styles only, so it looks the same everywhere;
 * each app passes its own translations (`text`) and its own "send to chat" (`onSend`).
 */

export type Recap = {
  period: string; kind: "month" | "year"; from: string; to: string; name: string; empty: boolean; activeDays: number;
  wordle: { played: number; won: number; bestWord: { word: string; guesses: number } | null; favoriteMode: string | null; dailies: number; dailyWins: number };
  lingora: { xp: number; lessons: number; newWords: number; reviews: number; activeDays: number; topLang: string | null };
  banter: { messages: number; topServer: { name: string; messages: number } | null; topEmoji: string | null; reactions: number };
  topFriend: { id: string; name: string; messages: number } | null;
  trophies: { name: string; icon: string; tier: string }[];
};
/** A translation, or undefined to use the English built in here. */
export type RecapText = (key: string, vars?: Record<string, string | number>) => string | undefined;

/** RECAP:<period>:<Wordle wins>:<Lingora XP>:<messages> (a small chat card). */
export const recapCardContent = (r: Recap) => `RECAP:${r.period}:${r.wordle.won}:${r.lingora.xp}:${r.banter.messages}`;

const fill = (s: string, vars: Record<string, string | number> = {}) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
const LANGS: Record<string, string> = { zh: "Chinese", ja: "Japanese", pt: "Portuguese" };
export const periodLabel = (r: Pick<Recap, "from" | "kind">, locale?: string) =>
  new Date(r.from).toLocaleDateString(locale, r.kind === "year" ? { year: "numeric", timeZone: "UTC" } : { month: "long", year: "numeric", timeZone: "UTC" });

const THEMES = [
  ["#7c3aed", "#db2777"], ["#16a34a", "#0d9488"], ["#7c3aed", "#2563eb"], ["#0d9488", "#0891b2"], ["#ea580c", "#db2777"], ["#ca8a04", "#ea580c"], ["#1e293b", "#7c3aed"],
];

type Card = { key: string; emoji: string; title: string; lines: ReactNode[] };

export function RecapStory({ recap, text, onSend, onClose, locale }: { recap: Recap; text?: RecapText; onSend?: () => void; onClose?: () => void; locale?: string }) {
  const T = (key: string, en: string, vars?: Record<string, string | number>) => fill(text?.(key, vars) ?? en, vars);
  const label = periodLabel(recap, locale);
  const n = (x: number) => x.toLocaleString(locale);
  const big = (x: ReactNode) => <span style={{ fontSize: 46, fontWeight: 900, lineHeight: 1.05, display: "block" }}>{x}</span>;
  const w = recap.wordle, l = recap.lingora, b = recap.banter;
  const cards: Card[] = [
    { key: "intro", emoji: recap.kind === "year" ? "🎉" : "📊", title: T("recap.introTitle", "{name}, here's your {period}", { name: recap.name, period: label }),
      lines: [recap.empty ? T("recap.quiet", "A quiet one! Come back next month for a bigger recap.") : T("recap.activeDays", "You showed up on {n} days.", { n: recap.activeDays })] },
  ];
  if (w.played) cards.push({ key: "wordle", emoji: "🟩", title: "Wordle Unlimited", lines: [
    big(n(w.won)), T("recap.wordleWins", "wins out of {played} rounds ({rate}%)", { played: n(w.played), rate: Math.round((w.won / w.played) * 100) }),
    ...(w.bestWord ? [T("recap.bestWord", "Best solve: {word} in {n}", { word: w.bestWord.word, n: w.bestWord.guesses })] : []),
    ...(w.dailies ? [T("recap.dailies", "Dailies: {won} won of {n}", { won: w.dailyWins, n: w.dailies })] : []),
  ] });
  if (l.xp) cards.push({ key: "lingora", emoji: "📚", title: "Lingora", lines: [
    big(n(l.xp)), T("recap.lingoraXp", "XP earned, on {days} days", { days: l.activeDays }),
    ...(l.newWords ? [T("recap.newWords", "{n} new words and phrases", { n: n(l.newWords) })] : []),
    ...(l.lessons ? [T("recap.lessons", "{n} lessons finished", { n: l.lessons })] : []),
    ...(l.topLang ? [T("recap.topLang", "Mostly {lang}", { lang: T(`recap.lang.${l.topLang}`, LANGS[l.topLang] ?? l.topLang) })] : []),
  ] });
  if (b.messages) cards.push({ key: "banter", emoji: "💬", title: "Banter", lines: [
    big(n(b.messages)), T("recap.messages", "messages sent"),
    ...(b.topServer ? [T("recap.topServer", "Your hangout: {name}", { name: b.topServer.name })] : []),
    ...(b.topEmoji ? [T("recap.topEmoji", "Favourite reaction: {emoji}", { emoji: b.topEmoji })] : []),
  ] });
  if (recap.topFriend) cards.push({ key: "friend", emoji: "🤝", title: T("recap.friendTitle", "Your chat buddy"), lines: [
    big(recap.topFriend.name), T("recap.friend", "{n} messages to them", { n: n(recap.topFriend.messages) }),
  ] });
  if (recap.trophies.length) cards.push({ key: "trophies", emoji: "🏆", title: T("recap.trophiesTitle", "New trophies"), lines: [
    <span key="t" style={{ fontSize: 34, letterSpacing: 6 }}>{recap.trophies.map((t) => t.icon).join("")}</span>,
    recap.trophies.slice(0, 4).map((t) => t.name).join(" · "),
  ] });
  cards.push({ key: "summary", emoji: "✨", title: T("recap.summaryTitle", "Your {period}", { period: label }), lines: [] });

  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const last = cards.length - 1;
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((x) => Math.min(last, x + 1));
      else if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
      else if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [last, onClose]);
  const card = cards[Math.min(i, last)];
  const [c1, c2] = THEMES[i % THEMES.length];
  const stats: [string, string, string][] = [
    ["🟩", n(w.won), T("recap.statWins", "Wordle wins")], ["📚", n(l.xp), T("recap.statXp", "Lingora XP")],
    ["💬", n(b.messages), T("recap.statMessages", "messages")], ["🔥", n(recap.activeDays), T("recap.statDays", "active days")],
  ];

  const shareImage = async () => {
    setBusy(true);
    try {
      const blob = await drawSummary(recap, label, stats);
      const file = new File([blob], `recap-${recap.period}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
      if (nav.canShare?.({ files: [file] })) await nav.share({ files: [file], title: T("recap.summaryTitle", "Your {period}", { period: label }) }).catch(() => {});
      else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      }
    } finally {
      setBusy(false);
    }
  };

  const btn: CSSProperties = { border: 0, borderRadius: 999, padding: "10px 18px", fontWeight: 800, fontSize: 15, cursor: "pointer" };
  return (
    <div data-testid="recap-story" style={{ position: "relative", width: "100%", maxWidth: 420, margin: "0 auto", aspectRatio: "9 / 16", maxHeight: "calc(100vh - 140px)", borderRadius: 28, overflow: "hidden",
      color: "#fff", background: `linear-gradient(160deg, ${c1}, ${c2})`, boxShadow: "0 24px 60px -24px rgba(0,0,0,.5)", fontFamily: "inherit", userSelect: "none" }}>
      <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", gap: 4, zIndex: 2 }}>
        {cards.map((c, k) => <span key={c.key} style={{ flex: 1, height: 3, borderRadius: 3, background: k <= i ? "#fff" : "rgba(255,255,255,.35)" }} />)}
      </div>
      {onClose && <button aria-label="Close" onClick={onClose} style={{ ...btn, position: "absolute", top: 22, right: 12, zIndex: 3, padding: "4px 10px", background: "rgba(0,0,0,.25)", color: "#fff" }}>✕</button>}
      {/* Tap the left third to go back, the rest to go on. */}
      {card.key !== "summary" && <>
        <button aria-label="Back" onClick={() => setI((x) => Math.max(0, x - 1))} style={{ position: "absolute", inset: "0 66% 0 0", background: "transparent", border: 0, zIndex: 1, cursor: "pointer" }} />
        <button aria-label="Next" data-testid="recap-next" onClick={() => setI((x) => Math.min(last, x + 1))} style={{ position: "absolute", inset: "0 0 0 34%", background: "transparent", border: 0, zIndex: 1, cursor: "pointer" }} />
      </>}
      <div style={{ position: "absolute", inset: 0, padding: "56px 28px 32px", display: "flex", flexDirection: "column", justifyContent: card.key === "summary" ? "flex-start" : "center", gap: 14 }}>
        <span style={{ fontSize: 56, lineHeight: 1 }}>{card.emoji}</span>
        <h2 data-testid="recap-title" style={{ margin: 0, fontSize: 28, fontWeight: 900, lineHeight: 1.15 }}>{card.title}</h2>
        {card.lines.map((line, k) => <div key={k} style={{ fontSize: 18, fontWeight: 600, opacity: k === 0 ? 1 : 0.9 }}>{line}</div>)}
        {card.key === "summary" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }} data-testid="recap-summary">
              {stats.map(([e, v, k]) => (
                <div key={k} style={{ background: "rgba(255,255,255,.16)", borderRadius: 18, padding: "12px 14px" }}>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>{e} {k}</div>
                  <div style={{ fontSize: 30, fontWeight: 900 }}>{v}</div>
                </div>
              ))}
            </div>
            {w.bestWord && <div style={{ fontSize: 15, opacity: 0.9 }}>{T("recap.bestWord", "Best solve: {word} in {n}", { word: w.bestWord.word, n: w.bestWord.guesses })}</div>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "auto", position: "relative", zIndex: 2 }}>
              <button style={{ ...btn, background: "#fff", color: c1 }} onClick={shareImage} disabled={busy} data-testid="recap-share">{T("recap.shareImage", "Share image")}</button>
              {onSend && <button style={{ ...btn, background: "rgba(255,255,255,.2)", color: "#fff" }} onClick={onSend} data-testid="recap-send">{T("recap.send", "Send to a chat")}</button>}
              <button style={{ ...btn, background: "transparent", color: "#fff" }} onClick={() => setI(0)}>{T("recap.again", "Watch again")}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** The summary as a 1080×1350 picture (for sharing anywhere). */
async function drawSummary(recap: Recap, label: string, stats: [string, string, string][]): Promise<Blob> {
  const W = 1080, H = 1350, cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#7c3aed"); grad.addColorStop(1, "#db2777");
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.fillStyle = "#fff"; g.textBaseline = "top";
  g.font = "800 44px system-ui, sans-serif"; g.globalAlpha = 0.85; g.fillText(recap.name, 80, 90);
  g.globalAlpha = 1; g.font = "900 84px system-ui, sans-serif"; g.fillText(label, 80, 150);
  stats.forEach(([emoji, value, name], k) => {
    const x = 80 + (k % 2) * 470, y = 340 + Math.floor(k / 2) * 330;
    g.globalAlpha = 0.16; g.fillStyle = "#fff"; roundRect(g, x, y, 440, 290, 40); g.fill();
    g.globalAlpha = 1; g.fillStyle = "#fff";
    g.font = "600 42px system-ui, sans-serif"; g.fillText(`${emoji} ${name}`, x + 40, y + 40);
    g.font = "900 110px system-ui, sans-serif"; g.fillText(value, x + 40, y + 120);
  });
  if (recap.wordle.bestWord) { g.font = "700 44px system-ui, sans-serif"; g.fillText(`🟩 ${recap.wordle.bestWord.word} in ${recap.wordle.bestWord.guesses}`, 80, 1040); }
  g.globalAlpha = 0.8; g.font = "700 36px system-ui, sans-serif"; g.fillText("Wordle Unlimited · Lingora · Banter", 80, 1220);
  return new Promise((resolve) => cv.toBlob((b) => resolve(b!), "image/png"));
}
function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
