import { useEffect, useState } from 'react'
import { formatAgo } from '../lib/date'
import { useStore } from '../store/useStore'
import { api } from '../sync/api'
import { logOut, syncNow } from '../sync/sync'
import { AuthForm, type AuthMode } from './AuthForm'

type Server = 'checking' | 'ready' | 'no-db' | 'offline'

export function AccountPanel() {
  const { account, lastSyncedAt, syncError, outbox } = useStore()
  const [server, setServer] = useState<Server>('checking')
  const [mode, setMode] = useState<AuthMode>('signup')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .health()
      .then((h) => setServer(h.db ? 'ready' : 'no-db'))
      .catch(() => setServer('offline'))
  }, [])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (account) {
    const pending = outbox.reviews.length + outbox.xp.length + outbox.completions.length + outbox.purchases.length + outbox.claims.length
    return (
      <div className="settings">
        <div>
          Signed in as <strong>{account.username}</strong>
        </div>
        <div className="muted small">
          {lastSyncedAt ? `Last synced ${formatAgo(lastSyncedAt)}` : 'Not synced yet'}
          {pending > 0 && ` · ${pending} change${pending === 1 ? '' : 's'} waiting`}
        </div>
        {syncError && <p className="error small">{syncError}</p>}
        {error && <p className="error small">{error}</p>}
        <div className="row">
          <button className="btn" disabled={busy} onClick={() => run(syncNow)}>
            Sync now
          </button>
          <button
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => {
              if (confirm('Log out? Your progress stays in your account; this device will be cleared.')) void run(logOut)
            }}
          >
            Log out
          </button>
        </div>
      </div>
    )
  }

  if (server !== 'ready') {
    return (
      <div className="settings muted">
        {server === 'checking' && 'Checking the sync server…'}
        {server === 'no-db' && 'Cloud accounts aren’t set up on this server yet — progress is saved on this device.'}
        {server === 'offline' && 'The sync server isn’t reachable — progress is saved on this device.'}
      </div>
    )
  }

  // Device-only mode (the server couldn't hold accounts earlier): offer to create one now.
  return (
    <div className="settings">
      <p className="muted small" style={{ margin: 0 }}>
        Create an account to back up your progress, sync across devices and add real friends. Your progress on this device comes with you.
      </p>
      <AuthForm mode={mode} onModeChange={setMode} />
    </div>
  )
}
