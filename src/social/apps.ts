import { useEffect, useState } from 'react'

/** Where Banter and Wordle Unlimited live (the server's /api/config), for "Open in Banter" links. */
export type AppLinks = { banterUrl: string; wordleUrl: string }

let cached: AppLinks | null = null
let pending: Promise<AppLinks | null> | null = null

function load(): Promise<AppLinks | null> {
  pending ??= fetch('/api/config')
    .then((r) => (r.ok ? (r.json() as Promise<AppLinks>) : null))
    .then((v) => (cached = v))
    .catch(() => null)
  return pending
}

export function useAppLinks(): AppLinks | null {
  const [links, setLinks] = useState(cached)
  useEffect(() => {
    if (!cached) void load().then(setLinks)
  }, [])
  return links
}
