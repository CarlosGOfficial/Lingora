import type { Course } from '../content/types'
import { readingOn, useStore } from '../store/useStore'

/** Show / hide furigana (Japanese) or pinyin (Chinese) for this course; remembered per language. */
export function ReadingToggle({ course }: { course: Course }) {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  if (course.lang === 'pt') return null
  const on = readingOn(settings, course.lang)
  return (
    <label className="toggle small" title={`Show ${course.readingLabel ?? 'readings'}`}>
      <input type="checkbox" checked={on} data-testid="reading-toggle"
        onChange={(e) => updateSettings({ readingByLang: { ...(settings.readingByLang ?? {}), [course.lang]: e.target.checked } })} />
      {course.readingLabel ?? 'Hints'}
    </label>
  )
}
