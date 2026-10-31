/** Local-time day key, e.g. "2026-10-30". Streaks follow the learner's own midnight. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Whole calendar days from a to b (b later → positive). DST-safe via rounding. */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDayKey(b).getTime() - parseDayKey(a).getTime()) / 86_400_000)
}

export function addDays(key: string, n: number): string {
  const d = parseDayKey(key)
  d.setDate(d.getDate() + n)
  return dayKey(d)
}

/** Monday-based start of the week containing `key`. */
export function weekStart(key: string): string {
  const d = parseDayKey(key)
  const offset = (d.getDay() + 6) % 7
  return addDays(key, -offset)
}

export function formatAgo(ms: number, now = Date.now()): string {
  const min = Math.floor((now - ms) / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.floor(min / 60)
  return h < 24 ? `${h} h ago` : `${Math.floor(h / 24)} d ago`
}

export function formatRelative(ms: number, now = Date.now()): string {
  const diff = ms - now
  if (diff <= 0) return 'now'
  const min = Math.round(diff / 60_000)
  if (min < 60) return `in ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `in ${h} h`
  const days = Math.round(h / 24)
  return `in ${days} day${days === 1 ? '' : 's'}`
}
