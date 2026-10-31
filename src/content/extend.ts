import type { Lesson, Unit } from './types'

/** Inserts whole units into their tier: each goes after the last existing unit with the same level. */
export function insertUnits(units: Unit[], extra: Unit[]): Unit[] {
  const out = [...units]
  for (const unit of extra) {
    let at = -1
    out.forEach((u, i) => u.level === unit.level && (at = i))
    out.splice(at === -1 ? out.length : at + 1, 0, unit)
  }
  return out
}

/** Appends extra lessons (keyed by unit id) to their units, before each unit's story. */
export function addLessons(units: Unit[], extra: Record<string, Lesson[]>): Unit[] {
  return units.map((u) => (extra[u.id] ? { ...u, lessons: [...u.lessons, ...extra[u.id]] } : u))
}
