import type { CSSProperties } from 'react'

/** A learner's name in their equipped name colour, with their title. */
export function NameTag({ name, nameColor, title }: { name: string; nameColor?: string | null; title?: string | null }) {
  const style: CSSProperties | undefined = nameColor?.startsWith('linear-gradient')
    ? { backgroundImage: nameColor, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }
    : nameColor
      ? { color: nameColor }
      : undefined
  return (
    <span className="name-tag">
      <strong style={style}>{name}</strong>
      {title && <span className="title-chip">{title}</span>}
    </span>
  )
}
