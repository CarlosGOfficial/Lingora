import type { Course, Item } from '../content/types'
import { useStore } from '../store/useStore'

/** Target-language text with its reading (pinyin / kana / romaji) above it. */
type Text = Pick<Item, 'target' | 'reading' | 'romanization'>

export function TargetText({ item, course, size = 'md', reading }: { item: Text; course: Course; size?: 'sm' | 'md' | 'lg' | 'xl'; reading?: boolean }) {
  const showReading = useStore((s) => s.settings.showReading)
  const show = reading ?? showReading
  const sub = item.reading && item.reading !== item.target ? item.reading : item.romanization
  return (
    <span className={`target target-${size}`}>
      {show && sub && <span className="target-reading">{sub}</span>}
      <span className="target-main" lang={course.bcp47}>
        {item.target}
      </span>
    </span>
  )
}
