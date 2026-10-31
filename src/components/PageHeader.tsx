import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

/** Consistent page title: icon tile, title, optional subtitle and right-side slot. */
export function PageHeader({ icon, title, subtitle, right }: { icon: IconName; title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <header className="page-header">
      <span className="page-icon">
        <Icon name={icon} size={24} />
      </span>
      <div className="grow">
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}
