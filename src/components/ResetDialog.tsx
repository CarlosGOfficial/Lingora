import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { COURSES, LANG_CODES } from '../content'
import type { LangCode } from '../content/types'
import { useStore } from '../store/useStore'
import { eraseAllProgress, restartCourse } from '../sync/sync'
import { Icon } from './Icon'

export type ResetMode = 'course' | 'everything'

const CONFIRM_WORD: Record<ResetMode, string> = { course: 'RESTART', everything: 'ERASE' }

/** Asks before wiping anything: says exactly what goes and what stays, and wants a typed word. */
export function ResetDialog({ mode, onClose }: { mode: ResetMode; onClose: () => void }) {
  const activeLang = useStore((s) => s.activeLang)
  const signedIn = useStore((s) => !!s.account)
  const [lang, setLang] = useState<LangCode>(activeLang)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const word = CONFIRM_WORD[mode]
  const ready = typed.trim().toUpperCase() === word

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const run = async () => {
    setBusy(true)
    setError('')
    try {
      await (mode === 'course' ? restartCourse(lang) : eraseAllProgress())
      onClose()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  // Rendered into <body> so no animated (transformed) page wrapper can trap the fixed overlay.
  return createPortal(
    <div className="modal-backdrop" onClick={() => !busy && onClose()}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="reset-title" onClick={(e) => e.stopPropagation()}>
        <span className="modal-icon">
          <Icon name={mode === 'course' ? 'layers' : 'trash'} size={24} />
        </span>
        <h2 id="reset-title">{mode === 'course' ? 'Restart a course?' : 'Erase all progress?'}</h2>

        {mode === 'course' && (
          <label className="field">
            <span>Course</span>
            <select className="text-input" value={lang} onChange={(e) => setLang(e.target.value as LangCode)}>
              {LANG_CODES.map((code) => (
                <option key={code} value={code}>
                  {COURSES[code].name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="reset-lists">
          <div>
            <strong className="c-danger">Deleted</strong>
            <ul>
              {mode === 'course' ? (
                <>
                  <li>Finished lessons, unit reviews and stories in {COURSES[lang].name}</li>
                  <li>Every {COURSES[lang].name} word’s review history</li>
                </>
              ) : (
                <>
                  <li>All lessons, stories and review history in every course</li>
                  <li>Your XP, streak and level</li>
                  <li>Coins, and everything bought in the shop</li>
                </>
              )}
            </ul>
          </div>
          <div>
            <strong className="c-success">Kept</strong>
            <ul>
              {mode === 'course' ? (
                <>
                  <li>Your XP, streak, coins and shop items</li>
                  <li>Your other courses</li>
                </>
              ) : (
                <li>{signedIn ? 'Your account, friends and chats (shared with Wordle Unlimited)' : 'Your settings'}</li>
              )}
            </ul>
          </div>
        </div>
        <p className="small muted">
          {signedIn ? 'This also deletes it from your account on every device.' : 'This only affects this device.'} It can’t be undone.
        </p>

        <label className="field">
          <span>
            Type <strong>{word}</strong> to confirm
          </span>
          <input className="text-input" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus autoComplete="off" autoCapitalize="characters" spellCheck={false} />
        </label>
        {error && (
          <p className="error small" role="alert">
            {error}
          </p>
        )}
        <div className="row modal-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-danger-solid" disabled={!ready || busy} onClick={run}>
            {busy ? 'Working…' : mode === 'course' ? `Restart ${COURSES[lang].name}` : 'Erase everything'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
