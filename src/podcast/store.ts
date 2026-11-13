import type { Episode } from './episode'

/*
 * Episodes from the server, kept on this device so they play offline too, and which
 * episodes you've finished (for the "done" ticks). localStorage, with a size cap.
 */
const KEY = 'lingora-podcasts'
const DONE = 'lingora-podcasts-done'
const MAX = 40

function read<T>(key: string, fallback: T): T {
  try {
    return (JSON.parse(localStorage.getItem(key) ?? 'null') as T) ?? fallback
  } catch {
    return fallback
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* full or private mode */ }
}

export const savedEpisodes = (): Episode[] => read<Episode[]>(KEY, [])
export const savedEpisode = (id: string) => savedEpisodes().find((e) => e.id === id) ?? null
export function saveEpisodes(list: Episode[]) {
  const ids = new Set(list.map((e) => e.id))
  write(KEY, [...list, ...savedEpisodes().filter((e) => !ids.has(e.id))].slice(0, MAX))
}
export const doneEpisodes = (): string[] => read<string[]>(DONE, [])
export const markDone = (id: string) => write(DONE, [id, ...doneEpisodes().filter((x) => x !== id)].slice(0, 500))
