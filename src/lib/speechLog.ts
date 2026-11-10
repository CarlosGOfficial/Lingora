import type { LangCode } from '../content/types'
import { useStore } from '../store/useStore'
import { api } from '../sync/api'

/*
 * Speaking tries, sent to the server in small batches (server/speech.ts): they make the
 * "Tricky to say" list, the profile's speaking score and the daily speaking quest. Kept
 * in localStorage until sent, so tries made offline still count.
 */

type Entry = { id: string; itemId: string; lang: LangCode; score: number; at: number }
const QUEUE = 'lingora-speech-queue', PAUSE = 'lingora-speak-pause'
const read = (): Entry[] => { try { return JSON.parse(localStorage.getItem(QUEUE) ?? '[]') } catch { return [] } }
const write = (q: Entry[]) => { try { localStorage.setItem(QUEUE, JSON.stringify(q.slice(-500))) } catch { /* full or blocked */ } }
let timer: ReturnType<typeof setTimeout> | null = null

export function logSpeech(itemId: string, lang: LangCode, score: number) {
  const at = Date.now()
  write([...read(), { id: `${useStore.getState().deviceId}-${at}-${itemId}`.slice(0, 120), itemId, lang, score: Math.round(score * 100) / 100, at }])
  if (!timer) timer = setTimeout(() => { timer = null; void flushSpeech() }, 3000)
}

export async function flushSpeech() {
  if (!useStore.getState().account) return
  const q = read()
  if (!q.length) return
  const batch = q.slice(0, 50)
  try {
    await api.speech(batch)
    const sent = new Set(batch.map((e) => e.id))
    write(read().filter((e) => !sent.has(e.id)))
  } catch { /* try again next time */ }
}

/** "Can't speak now": speaking exercises skip themselves for a while. */
export const pauseSpeaking = (minutes = 15) => { try { localStorage.setItem(PAUSE, String(Date.now() + minutes * 60_000)) } catch { /* ignore */ } }
export const speakingPaused = () => { try { return Number(localStorage.getItem(PAUSE) ?? 0) > Date.now() } catch { return false } }
export const resumeSpeaking = () => { try { localStorage.removeItem(PAUSE) } catch { /* ignore */ } }
