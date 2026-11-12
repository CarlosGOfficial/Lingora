/*
 * Switching theme right after a click or tap reveals the new look in a circle that grows
 * from where you pressed (the View Transitions API, where the browser has it; elsewhere,
 * and with reduced motion, the theme just changes).
 * KEEP THIS FILE IDENTICAL in Banter, Wordle Unlimited and Lingora (npm run check:shared
 * in Banter compares them).
 */
let last = { x: 0, y: 0, at: 0 };
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", (e) => { last = { x: e.clientX, y: e.clientY, at: Date.now() }; }, { capture: true, passive: true });
  // Keyboard switches (Enter on a button) grow from the focused control.
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const r = (document.activeElement as HTMLElement | null)?.getBoundingClientRect?.();
    if (r) last = { x: r.left + r.width / 2, y: r.top + r.height / 2, at: Date.now() };
  }, { capture: true, passive: true });
}

type Doc = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };

/** Run `change` (which restyles the page); if you just pressed something, reveal it from there. */
export function themeReveal(change: () => void) {
  const doc = document as Doc;
  const recent = Date.now() - last.at < 900;
  if (!recent || !doc.startViewTransition || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches || document.visibilityState !== "visible") { change(); return; }
  const { x, y } = last;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  if (!document.getElementById("theme-reveal-style")) {
    const style = document.createElement("style");
    style.id = "theme-reveal-style";
    style.textContent = "html.theme-reveal::view-transition-old(root),html.theme-reveal::view-transition-new(root){animation:none;mix-blend-mode:normal}html.theme-reveal::view-transition-new(root){z-index:1}";
    document.head.appendChild(style);
  }
  const root = document.documentElement;
  root.classList.add("theme-reveal");
  try {
    const vt = doc.startViewTransition(change);
    vt.ready
      .then(() => root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] }, { duration: 480, easing: "cubic-bezier(.4,0,.2,1)", pseudoElement: "::view-transition-new(root)" }).finished)
      .catch(() => {})
      .finally(() => root.classList.remove("theme-reveal"));
  } catch { root.classList.remove("theme-reveal"); change(); }
}
