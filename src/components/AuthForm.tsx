import { useState } from 'react'
import { logIn, logInWithPin, signUp } from '../sync/sync'

export type AuthMode = 'signup' | 'login'

/**
 * Username + password, for a new account or an existing one (shared with Wordle
 * Unlimited and Banter), or Wordle's 4-digit PIN.
 */
export function AuthForm({ mode, onModeChange, onDone }: { mode: AuthMode; onModeChange: (m: AuthMode) => void; onDone?: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [usePin, setUsePin] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const signup = mode === 'signup'
  const pinMode = !signup && usePin

  return (
    <form
      className="auth-form"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        try {
          await (signup ? signUp(username.trim(), password) : pinMode ? logInWithPin(pin) : logIn(username.trim(), password))
          onDone?.()
        } catch (err) {
          setError((err as Error).message)
          setBusy(false)
        }
      }}
    >
      {pinMode ? (
        <label className="field">
          <span>Wordle PIN</span>
          <input
            className="text-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={4}
            placeholder="1234"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            pattern="\d{4}"
            title="4 digits"
            style={{ letterSpacing: '0.4em', fontWeight: 700 }}
            required
          />
          <span className="small muted">The 4-digit PIN from Wordle Unlimited. Once you're in, Lingora shows it in Settings.</span>
        </label>
      ) : (
        <>
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
        </>
      )}
      {error && (
        <p className="error small" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary btn-lg block" disabled={busy || (pinMode && pin.length !== 4)}>
        {busy ? (signup ? 'Creating your account…' : 'Logging in…') : signup ? 'Create account' : 'Log in'}
      </button>
      {!signup && (
        <p className="small muted center-text">
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setUsePin(!usePin)
              setError(null)
            }}
          >
            {usePin ? 'Use my username and password instead' : 'Sign in with a Wordle PIN instead'}
          </button>
        </p>
      )}
      <p className="small muted center-text">
        {signup ? 'Already have an account? ' : 'New to Lingora? '}
        <button type="button" className="link-btn" onClick={() => onModeChange(signup ? 'login' : 'signup')}>
          {signup ? 'Log in' : 'Create an account'}
        </button>
      </p>
      <p className="small muted center-text auth-note">
        One account for Lingora, <strong>Banter</strong> and <strong>Wordle Unlimited</strong> — already have one? Log in with the same username
        {signup ? '.' : ', or with your Wordle PIN.'}
      </p>
    </form>
  )
}
