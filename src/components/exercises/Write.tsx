import { useEffect, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import type { Item } from '../../content/types'
import { TargetText } from '../TargetText'
import type { ExerciseProps } from './types'

/** Stroke data is bundled per character (scripts/build-strokes.mjs), Chinese and Japanese separately. */
export const strokeUrl = (lang: string, char: string) => `/strokes/${lang}/${encodeURIComponent(char)}.json`

/** A theme colour as a plain colour value (Hanzi Writer can't read CSS variables). */
function cssColor(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return /^(#[0-9a-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))$/i.test(v) ? v : fallback
}

/** Characters worth tracing in a word (hanzi, kanji, kana). */
export const traceable = (text: string) => Array.from(text).filter((c) => /[぀-ヿ一-鿿]/.test(c) && c !== '・' && c !== 'ー')

/**
 * Trace a character stroke by stroke: each stroke is checked for its place, direction
 * and order as you draw it. After 3 misses on a stroke it's shown to you.
 */
export function Write({ ex, course, locked, onSubmit }: ExerciseProps<{ type: 'write'; item: Item; char: string }>) {
  const box = useRef<HTMLDivElement>(null)
  const writer = useRef<HanziWriter | null>(null)
  const [state, setState] = useState<'loading' | 'tracing' | 'done' | 'missing'>('loading')
  const [mistakes, setMistakes] = useState(0)
  const [strokes, setStrokes] = useState({ done: 0, total: 0 })
  const size = Math.min(300, typeof window !== 'undefined' ? window.innerWidth - 64 : 300)

  useEffect(() => {
    if (!box.current) return
    box.current.innerHTML = ''
    const w = HanziWriter.create(box.current, ex.char, {
      width: size, height: size, padding: 12, showCharacter: false, showOutline: true, drawingWidth: 28,
      strokeColor: cssColor('--text', '#222222'), outlineColor: 'rgba(127,127,127,0.25)', drawingColor: cssColor('--primary', '#6c5ce7'), highlightColor: '#22c55e',
      charDataLoader: (char, onLoad, onError) => {
        fetch(strokeUrl(course.lang, char)).then((r) => (r.ok ? r.json() : Promise.reject(new Error('missing')))).then(onLoad, (e) => { setState('missing'); onError(e) })
      },
      onLoadCharDataSuccess: (d: { strokes: string[] }) => { setStrokes({ done: 0, total: d.strokes.length }); setState('tracing') },
    })
    writer.current = w
    w.quiz({
      showHintAfterMisses: 3,
      onMistake: (s: { totalMistakes: number }) => setMistakes(s.totalMistakes),
      onCorrectStroke: (s: { strokeNum: number; totalMistakes: number }) => { setStrokes((x) => ({ ...x, done: s.strokeNum + 1 })); setMistakes(s.totalMistakes) },
      onComplete: (s: { totalMistakes: number }) => {
        setState('done')
        const total = Math.max(1, strokesRef.current)
        // A slip or two is fine; lots of misses means it needs more practice.
        const quality = s.totalMistakes === 0 ? 'correct' : s.totalMistakes <= Math.max(2, Math.round(total / 3)) ? 'almost' : 'wrong'
        onSubmit({ quality, given: ex.char, note: s.totalMistakes ? `${s.totalMistakes} stroke${s.totalMistakes === 1 ? '' : 's'} missed` : 'Every stroke right!' })
      },
    })
    return () => { writer.current = null }
  }, [ex.char])
  const strokesRef = useRef(0)
  strokesRef.current = strokes.total

  useEffect(() => {
    // No stroke data for this character: don't block the session.
    if (state === 'missing' && !locked) onSubmit({ quality: 'skip', advance: true })
  }, [state])

  return (
    <div className="exercise write-ex">
      <p className="prompt">Write <strong>{ex.char}</strong>{ex.item.target !== ex.char && <> from <TargetText item={ex.item} course={course} size="sm" /></>}</p>
      <p className="muted small">{ex.item.meaning}</p>
      <div className="write-pad" ref={box} style={{ width: size, height: size }} aria-label={`Trace ${ex.char}`} data-testid="write-pad" />
      <div className="write-bar">
        <span className="muted small" data-testid="write-progress">{strokes.total ? `Stroke ${Math.min(strokes.done + 1, strokes.total)} of ${strokes.total}` : 'Loading…'}{mistakes > 0 && ` · ${mistakes} miss${mistakes === 1 ? '' : 'es'}`}</span>
        <button className="btn ghost small" disabled={locked || state !== 'tracing'} onClick={() => writer.current?.animateCharacter({ onComplete: () => writer.current?.quiz({ showHintAfterMisses: 3, onComplete: () => onSubmit({ quality: 'wrong', given: ex.char, note: 'You watched it first: try again in a later review.' }) }) })}>Show me</button>
      </div>
    </div>
  )
}
