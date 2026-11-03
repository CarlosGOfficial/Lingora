import { useState } from 'react'
import { logIn, signUp } from '../sync/sync'

export type AuthMode = 'signup' | 'login'

/** Username + password, for a new account or an existing one (shared with Wordle Unlimited). */
export function AuthForm({ mode, onModeChange, onDone }: { mode: AuthMode; onModeChange: (m: AuthMode) => void; onDone?: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const signup = mode === 'signup'

  return (
    <form
      className="auth-form"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        try {
          await (signup ? signUp(username.trim(), password) : logIn(username.trim(), password))
          onDone?.()
        } catch (err) {
          setError((err as Error).message)
          setBusy(false)
        }
      }}
    >
      <label className="field">
        <span>Username</span>
        <input
          className="text-input"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          pattern={signup ? '[A-Za-z0-9_]{3,20}' : undefined}
          title={signup ? '3–20 letters, numbers or underscores' : undefined}
          required
        />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          className="text-input"
          type="password"
          autoComplete={signup ? 'new-password' : 'current-password'}
          minLength={signup ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {signup && <span className="small muted">At least 8 characters.</span>}
      </label>
      {error && (
        <p className="error small" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary btn-lg block" disabled={busy}>
        {busy ? (signup ? 'Creating your account…' : 'Logging in…') : signup ? 'Create account' : 'Log in'}
      </button>
      <p className="small muted center-text">
        {signup ? 'Already have an account? ' : 'New to Lingora? '}
        <button type="button" className="link-btn" onClick={() => onModeChange(signup ? 'login' : 'signup')}>
          {signup ? 'Log in' : 'Create an account'}
        </button>
      </p>
      <p className="small muted center-text auth-note">
        One account for Lingora and <strong>Wordle Unlimited</strong> — already play Wordle? Log in with the same username.
        {!signup && ' (PIN-only Wordle accounts need to set a password in Wordle first.)'}
      </p>
    </form>
  )
}
