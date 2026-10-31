import { useEffect, useState } from 'react'
import type { Course } from '../content/types'
import { hasVoiceFor, onVoicesChanged } from '../lib/speech'
import { Icon } from './Icon'

export function useVoiceAvailable(lang: string): boolean {
  const [ok, setOk] = useState(() => hasVoiceFor(lang))
  useEffect(() => {
    setOk(hasVoiceFor(lang))
    return onVoicesChanged(() => setOk(hasVoiceFor(lang)))
  }, [lang])
  return ok
}

const dismissKey = (lang: string) => `lingora-voice-notice-${lang}`

function wasDismissed(lang: string) {
  try {
    return localStorage.getItem(dismissKey(lang)) === '1'
  } catch {
    return false
  }
}

/** Compact, dismissible hint shown when the device has no TTS voice for the course. */
export function VoiceNotice({ course }: { course: Course }) {
  const ok = useVoiceAvailable(course.bcp47)
  const [hidden, setHidden] = useState(() => wasDismissed(course.bcp47))
  const [open, setOpen] = useState(false)
  useEffect(() => setHidden(wasDismissed(course.bcp47)), [course.bcp47])
  if (ok || hidden) return null

  return (
    <div className="notice compact" role="status">
      <Icon name="volume" size={18} />
      <div className="grow">
        <strong>No {course.name} voice on this device</strong> — listening drills are paused.{' '}
        <button className="link-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? 'Hide' : 'How to fix'}
        </button>
        {open && (
          <div className="small notice-more">
            Windows: Settings → Time &amp; language → Speech → Add voices ({course.bcp47}). macOS: System Settings → Accessibility → Spoken
            Content. Chrome and Edge also include online voices.
          </div>
        )}
      </div>
      <button
        className="icon-btn small"
        aria-label="Dismiss"
        onClick={() => {
          try {
            localStorage.setItem(dismissKey(course.bcp47), '1')
          } catch {
            /* storage blocked: hide for this visit only */
          }
          setHidden(true)
        }}
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  )
}
