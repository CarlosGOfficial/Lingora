import { useMemo, useState } from 'react'
import type { Exercise } from '../../engine/exercises'
import { speak } from '../../lib/speech'
import { shuffle } from '../../lib/random'
import { useStore } from '../../store/useStore'
import type { ExerciseProps } from './types'

export function Match({ ex, course, onSubmit }: ExerciseProps<Extract<Exercise, { type: 'match' }>>) {
  const rate = useStore((s) => s.settings.speechRate)
  const left = useMemo(() => shuffle(ex.items), [ex.items])
  const right = useMemo(() => shuffle(ex.items), [ex.items])
  const [selL, setSelL] = useState<string | null>(null)
  const [selR, setSelR] = useState<string | null>(null)
  const [matched, setMatched] = useState<string[]>([])
  const [wrong, setWrong] = useState<[string, string] | null>(null)

  const attempt = (l: string | null, r: string | null) => {
    if (!l || !r) return
    if (l === r) {
      const next = [...matched, l]
      setMatched(next)
      setSelL(null)
      setSelR(null)
      if (next.length === ex.items.length) setTimeout(() => onSubmit({ quality: 'skip', advance: true }), 500)
    } else {
      setWrong([l, r])
      setTimeout(() => {
        setWrong(null)
        setSelL(null)
        setSelR(null)
      }, 600)
    }
  }

  const cls = (id: string, side: 'l' | 'r') => {
    if (matched.includes(id)) return 'tile is-matched'
    if (wrong && wrong[side === 'l' ? 0 : 1] === id) return 'tile is-wrong'
    if ((side === 'l' ? selL : selR) === id) return 'tile is-selected'
    return 'tile'
  }

  return (
    <div className="ex">
      <h2 className="ex-title">Tap the matching pairs</h2>
      <div className="match-grid">
        <div className="match-col stagger">
          {left.map((it) => (
            <button
              key={it.id}
              className={cls(it.id, 'l')}
              disabled={matched.includes(it.id)}
              lang={course.bcp47}
              onClick={() => {
                speak(it.target, course.bcp47, rate)
                setSelL(it.id)
                attempt(it.id, selR)
              }}
            >
              {it.target}
            </button>
          ))}
        </div>
        <div className="match-col stagger">
          {right.map((it) => (
            <button
              key={it.id}
              className={cls(it.id, 'r')}
              disabled={matched.includes(it.id)}
              onClick={() => {
                setSelR(it.id)
                attempt(selL, it.id)
              }}
            >
              {it.meaning}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
