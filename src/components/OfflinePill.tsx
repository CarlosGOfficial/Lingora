import { useLocation } from 'react-router-dom'
import { serverOnly, useOnline } from '../lib/offline'
import { useStore } from '../store/useStore'
import { pending } from '../sync/sync'
import { Icon } from './Icon'

/** While offline: a small pill saying lessons and reviews still count and will sync. */
export function OfflinePill() {
  const online = useOnline()
  const queued = useStore((s) => (s.account ? pending(s.outbox) : 0))
  if (online) return null
  return (
    <div className="offline-pill" role="status" data-testid="offline-pill">
      <span className="offline-dot" />
      Offline: {queued ? `${queued} ${queued === 1 ? 'change' : 'changes'} will sync` : 'will sync'}
    </div>
  )
}

/** On a page that needs the server: say so, instead of spinners and errors. */
export function OfflineNotice() {
  const online = useOnline()
  const { pathname } = useLocation()
  const what = serverOnly(pathname)
  if (online || !what) return null
  return (
    <div className="offline-notice" data-testid="offline-notice">
      <Icon name="lock" size={18} />
      <span>
        <strong>{what} need{what.endsWith('s') && !what.startsWith('The') ? '' : 's'} a connection.</strong> Lessons, reviews, practice, podcasts and the character explorer all work offline.
      </span>
    </div>
  )
}
