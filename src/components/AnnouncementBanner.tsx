import { useEffect, useState } from 'react'
import { Icon } from './Icon'

/**
 * Announcements from the admin dashboard (shown in Lingora, Banter and/or Wordle Unlimited).
 * Each one can be closed; that's remembered on this device.
 */
type Announcement = { id: number; text: string; tone: 'info' | 'warn' | 'celebrate'; endsAt: string }
const KEY = 'lingora-dismissed-announcements'

function dismissed(): number[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function AnnouncementBanner() {
  const [list, setList] = useState<Announcement[]>([])
  const [closed, setClosed] = useState<number[]>(dismissed)
  useEffect(() => {
    let alive = true
    const load = () =>
      fetch('/api/ops/announcements')
        .then((r) => (r.ok ? r.json() : []))
        .then((x: Announcement[]) => alive && setList(Array.isArray(x) ? x : []))
        .catch(() => {})
    void load()
    const id = setInterval(load, 5 * 60_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])
  const a = list.find((x) => !closed.includes(x.id))
  if (!a) return null
  const close = () => {
    const next = [...closed, a.id].slice(-50)
    setClosed(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* private mode */
    }
  }
  return (
    <div className="announcement-wrap" role="status" data-testid="announcement">
      <div className={`announcement tone-${a.tone}`}>
        <Icon name={a.tone === 'warn' ? 'flag' : 'star'} size={16} />
        <p>{a.text}</p>
        <button type="button" onClick={close} aria-label="Close">
          <Icon name="x" size={16} />
        </button>
      </div>
    </div>
  )
}
