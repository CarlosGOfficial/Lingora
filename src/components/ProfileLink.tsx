import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** A name or avatar that opens the person's profile (plain when there's no account). */
export function ProfileLink({ id, children, label }: { id?: string | null; children: ReactNode; label?: string }) {
  return id ? (
    <Link to={`/u/${encodeURIComponent(id)}`} className="profile-link" aria-label={label}>
      {children}
    </Link>
  ) : (
    <>{children}</>
  )
}
