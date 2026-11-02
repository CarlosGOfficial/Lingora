import { useEffect, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'

/** Small pop-up notices (new messages, friend requests…) with an optional link. */
export interface Toast {
  id: number
  title: string
  description?: string
  action?: { label: string; to: string }
}

const SHOW_MS = 7_000
const MAX_SHOWN = 4

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function toast(t: Omit<Toast, 'id'>): void {
  toasts = [...toasts, { ...t, id: nextId++ }].slice(-MAX_SHOWN)
  emit()
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function Toaster() {
  const list = useSyncExternalStore(subscribe, () => toasts)
  return (
    <div className="toaster" aria-live="polite">
      {list.map((t) => (
        <ToastCard key={t.id} t={t} />
      ))}
    </div>
  )
}

function ToastCard({ t }: { t: Toast }) {
  useEffect(() => {
    const timer = setTimeout(() => dismiss(t.id), SHOW_MS)
    return () => clearTimeout(timer)
  }, [t.id])
  return (
    <div className="toast" role="status">
      <div className="grow toast-text">
        <strong>{t.title}</strong>
        {t.description && <span className="small muted">{t.description}</span>}
      </div>
      {t.action && (
        <Link to={t.action.to} className="btn btn-primary small" onClick={() => dismiss(t.id)}>
          {t.action.label}
        </Link>
      )}
      <button className="icon-btn small" onClick={() => dismiss(t.id)} aria-label="Dismiss">
        <Icon name="x" size={14} />
      </button>
    </div>
  )
}
