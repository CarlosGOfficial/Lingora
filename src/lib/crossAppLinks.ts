/*
 * One sign-in across Banter, Wordle Unlimited and Lingora.
 * KEEP THIS FILE IDENTICAL in all three apps (`npm run check:shared` in Banter compares them).
 *
 * Clicking a link to one of the other two apps asks this app's server for a one-time
 * sign-in link (POST /api/handoff, see server/ops.ts) and opens that instead, so you arrive
 * signed in. Signed out, or if anything fails, the link opens as it is.
 */
type AppName = "banter" | "wordle" | "lingora";
let apps: Partial<Record<AppName, string | null>> = {};

function targetApp(url: URL, thisApp: AppName): AppName | null {
  for (const [name, base] of Object.entries(apps) as [AppName, string | null][]) {
    if (!base || name === thisApp) continue;
    try {
      if (new URL(base).origin === url.origin) return name;
    } catch {
      /* a bad address in the settings: ignore it */
    }
  }
  return null;
}

async function signedInUrl(to: AppName, url: URL): Promise<string> {
  try {
    const res = await fetch("/api/handoff", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to, path: url.pathname + url.search + url.hash }),
    });
    if (res.ok) return String((await res.json()).url);
  } catch {
    /* offline or not signed in */
  }
  return url.href;
}

export function installCrossAppLinks(thisApp: AppName) {
  fetch("/api/ops/apps")
    .then((r) => (r.ok ? r.json() : {}))
    .then((x) => { apps = x ?? {}; })
    .catch(() => {});
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a || a.hasAttribute("download")) return;
    let url: URL;
    try {
      url = new URL(a.href, location.href);
    } catch {
      return;
    }
    const to = targetApp(url, thisApp);
    if (!to) return;
    e.preventDefault();
    // Open the new tab right away (popup blockers allow it during the click), then point it.
    const tab = a.target === "_blank" ? window.open("", "_blank") : null;
    if (tab) tab.opener = null;
    void signedInUrl(to, url).then((dest) => {
      if (tab) tab.location.href = dest;
      else if (a.target === "_blank") window.open(dest, "_blank", "noopener");
      else location.href = dest;
    });
  });
}
