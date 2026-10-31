import { useEffect, useState } from 'react'
import { formatAgo } from '../lib/date'
import { useStore } from '../store/useStore'
import { api } from '../sync/api'
import { logIn, logOut, signUp, syncNow } from '../sync/sync'

type Server = 'checking' | 'ready' | 'no-db' | 'offline'

export function AccountPanel() {
  const { account, lastSyncedAt, syncError, outbox } = useStore()
  const [server, setServer] = useState<Server>('checking')
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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

  return (
    <form
      className="settings"
      onSubmit={(e) => {
        e.preventDefault()
        void run(() => (mode === 'signup' ? signUp(username, password) : logIn(username, password)))
      }}
    >
      <p className="muted small" style={{ margin: 0 }}>
        {mode === 'signup'
          ? 'Create an account to back up your progress, sync across devices and add real friends. Your current progress comes with you.'
          : 'Log in to sync. Progress on this device will be merged into your account.'}{' '}
        Accounts are shared with <strong>Wordle Unlimited</strong> — already have one? Just log in.
      </p>
      <label className="field">
        <span>Username</span>
        <input
          className="text-input"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          pattern="[A-Za-z0-9_]{3,20}"
          title="3–20 letters, numbers or underscores"
          required
        />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          className="text-input"
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          minLength={mode === 'signup' ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error && <p className="error small">{error}</p>}
      <div className="row">
        <button className="btn btn-primary" disabled={busy}>
          {mode === 'signup' ? 'Create account' : 'Log in'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
          {mode === 'signup' ? 'I already have an account' : 'Create a new account'}
        </button>
      </div>
      <div className="muted small">
        {mode === 'login' && 'PIN-only Wordle accounts need a password first: set one in Wordle Unlimited.'}
      </div>
    </form>
  )
}
