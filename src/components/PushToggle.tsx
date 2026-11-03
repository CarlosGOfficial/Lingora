import { useEffect, useState } from 'react'
import { disablePush, enablePush, pushStatus, sendTestPush, type PushStatus } from '../lib/push'

/** Turns push notifications (friend messages, group chats, friend requests) on for this browser. */
export function PushToggle() {
  const [status, setStatus] = useState<PushStatus | 'checking'>('checking')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    pushStatus().then(setStatus).catch(() => setStatus('unsupported'))
  }, [])

  const run = async (fn: () => Promise<PushStatus | void>) => {
    setBusy(true)
    setError(null)
    try {
      const next = await fn()
      if (next) setStatus(next)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (status === 'checking' || status === 'off-server') return null
  return (
    <div className="settings">
      <label className="toggle">
        <input
          type="checkbox"
          checked={status === 'on'}
          disabled={busy || status === 'unsupported' || status === 'needs-install' || status === 'blocked'}
          onChange={(e) => void run(e.target.checked ? enablePush : disablePush)}
        />
        Notifications for messages and friend requests
      </label>
      <p className="small muted" style={{ margin: 0 }}>
        {status === 'needs-install' && 'On iPhone and iPad: tap Share → Add to Home Screen, open Lingora from there, then turn this on.'}
        {status === 'unsupported' && 'This browser can’t show notifications.'}
        {status === 'blocked' && 'Notifications are blocked for this site. Allow them in your browser’s site settings, then reload.'}
        {(status === 'on' || status === 'off') && 'If you also use Banter or Wordle Unlimited on this device, each message notifies you once, in one app.'}
      </p>
      {status === 'on' && (
        <div className="row">
          <button className="btn btn-ghost" disabled={busy} onClick={() => void run(sendTestPush)}>
            Send a test
          </button>
        </div>
      )}
      {error && <p className="error small">{error}</p>}
    </div>
  )
}
