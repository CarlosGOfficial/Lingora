import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../sync/api'
import { Icon } from './Icon'
import { toast } from './Toaster'

/** The same reasons as Banter and Wordle Unlimited (REPORT_REASONS in server/ops.ts). */
const REASONS = [
  ['spam', 'Spam or scams'],
  ['harassment', 'Bullying or harassment'],
  ['hate', 'Hate speech'],
  ['sexual', 'Sexual content'],
  ['violence', 'Threats or violence'],
  ['self_harm', 'Self-harm'],
  ['impersonation', 'Pretending to be someone'],
  ['other', 'Something else'],
] as const

export type ReportTarget = { kind: 'user'; userId: string; name: string } | { kind: 'dm' | 'group'; messageId: number }

/** Report a person or one of their messages. Reports go to the people who run the apps. */
export function ReportDialog({ target, onClose }: { target: ReportTarget; onClose: () => void }) {
  const [reason, setReason] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const send = async () => {
    setBusy(true)
    setError('')
    try {
      await api.report({ ...target, reason: reason!, note })
      toast({ title: 'Report sent. Thanks for telling us.' })
      onClose()
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return createPortal(
    <div className="modal-backdrop" onClick={() => !busy && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="report-title" onClick={(e) => e.stopPropagation()} data-testid="report-dialog">
        <span className="modal-icon">
          <Icon name="flag" size={24} />
        </span>
        <h2 id="report-title">{target.kind === 'user' ? `Report ${target.name}` : 'Report this message'}</h2>
        <p className="small muted">Reports go to the people who run Lingora, Banter and Wordle Unlimited. The person you report isn’t told who sent it.</p>
        <div className="report-reasons" role="radiogroup" aria-label="Why are you reporting this?">
          {REASONS.map(([id, label]) => (
            <button key={id} type="button" role="radio" aria-checked={reason === id} className={`report-reason ${reason === id ? 'on' : ''}`} onClick={() => setReason(id)}>
              {label}
            </button>
          ))}
        </div>
        <textarea className="text-input" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything else we should know? (optional)" />
        {error && <p className="error small">{error}</p>}
        <div className="row modal-actions">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" disabled={!reason || busy} onClick={send}>
            Send report
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
