/*
 * Switching theme right after a click or tap reveals the new look in a circle that grows
 * from where you pressed (the View Transitions API, where the browser has it).
 * KEEP THIS FILE IDENTICAL in Banter, Wordle Unlimited and Lingora (npm run check:shared
 * in Banter compares them).
 *
 * Two things keep it fluid:
 *  - `change` must apply the whole new theme synchronously (React callers wrap their state
 *    update in flushSync and paint in a layout effect), and it's called *before* anything
 *    has re-rendered, so the "before" picture really is the old page.
 *  - While the theme changes, every CSS transition is switched off (`theme-switching` on
 *    <html>), so buttons and cards don't fade their colours separately underneath the
 *    circle, or after it. This also applies when there's no circle (older browsers,
 *    reduced motion, slower devices): the theme simply changes at once.
 */
let last = { x: 0, y: 0, at: 0 };
let running = false;
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", (e) => { last = { x: e.clientX, y: e.clientY, at: Date.now() }; }, { capture: true, passive: true });
  // Keyboard switches (Enter on a button) grow from the focused control.
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const r = (document.activeElement as HTMLElement | null)?.getBoundingClientRect?.();
    if (r) last = { x: r.left + r.width / 2, y: r.top + r.height / 2, at: Date.now() };
  }, { capture: true, passive: true });
}

type Doc = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };

function ensureStyle() {
  if (document.getElementById("theme-reveal-style")) return;
  const style = document.createElement("style");
  style.id = "theme-reveal-style";
  style.textContent = [
    "html.theme-switching, html.theme-switching *, html.theme-switching *::before, html.theme-switching *::after { transition: none !important; }",
    "html.theme-reveal::view-transition-old(root), html.theme-reveal::view-transition-new(root) { animation: none; mix-blend-mode: normal; }",
    "html.theme-reveal::view-transition-new(root) { z-index: 1; will-change: clip-path; }",
  ].join("\n");
  document.head.appendChild(style);
}

/** Two frames later: the new colours are on screen. */
const afterPaint = (fn: () => void) => requestAnimationFrame(() => requestAnimationFrame(fn));

/** Can this device animate a full-page reveal smoothly? */
function canReveal() {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  if (nav.connection?.saveData) return false;
  if ((nav.hardwareConcurrency ?? 8) <= 4 && (nav.deviceMemory ?? 8) <= 4) return false;
  return document.visibilityState === "visible";
}

/** Run `change` (which restyles the page); if you just pressed something, reveal it from there. */
export function themeReveal(change: () => void) {
  if (typeof document === "undefined") { change(); return; }
  ensureStyle();
  const root = document.documentElement;
  const doc = document as Doc;
  const recent = Date.now() - last.at < 900;
  if (running || !recent || !doc.startViewTransition || !canReveal()) {
    // No circle: change at once, with no per-element fades.
    root.classList.add("theme-switching");
    change();
    afterPaint(() => { if (!running) root.classList.remove("theme-switching"); });
    return;
  }
  running = true;
  const { x, y } = last;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  root.classList.add("theme-switching", "theme-reveal");
  const done = () => {
    running = false;
    root.classList.remove("theme-reveal");
    afterPaint(() => { if (!running) root.classList.remove("theme-switching"); });
  };
  try {
    const vt = doc.startViewTransition(change);
    vt.ready
      .then(() => root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 420, easing: "cubic-bezier(.22,.61,.36,1)", pseudoElement: "::view-transition-new(root)" },
      ).finished)
      .catch(() => {});
    vt.finished.catch(() => {}).finally(done);
  } catch {
    change();
    done();
  }
}
