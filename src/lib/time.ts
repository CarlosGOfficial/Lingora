/** "just now", "5 min ago", "3 h ago", "2 d ago", then a short date. */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`
  if (s < 7 * 86_400) return `${Math.floor(s / 86_400)} d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Clock time for a chat message, with the date when it isn't today. */
export function messageTime(iso: string): string {
  const d = new Date(iso)
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return d.toDateString() === new Date().toDateString() ? time : `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`
}

const APP_NAMES = { lingora: 'Lingora', banter: 'Banter', wordle: 'Wordle Unlimited' } as const

/** "Online in Banter", "Online in Lingora and Wordle Unlimited", or `plain` ("Online"). */
export function onlineText(p: { openIn?: (keyof typeof APP_NAMES)[] }, plain = 'Online'): string {
  if (!p.openIn?.length) return plain
  const names = p.openIn.map((a) => APP_NAMES[a])
  let list = names.join(', ')
  try { list = new (Intl as unknown as { ListFormat: new (l: string, o: object) => { format: (x: string[]) => string } }).ListFormat('en', { type: 'conjunction' }).format(names) } catch { /* old browser */ }
  return `Online in ${list}`
}
