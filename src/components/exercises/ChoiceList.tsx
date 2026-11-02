import { useEffect, useState } from 'react'

interface Props {
  options: string[]
  answer: string
  lang?: string
  locked: boolean
  grid?: boolean
  /** Shows the picked option elsewhere (e.g. inside a sentence blank). */
  onPick?(option: string | null): void
  onSubmit(correct: boolean, given: string): void
}

/** Text options with 1–4 / Enter keyboard support and a Check button. */
export function ChoiceList({ options, answer, lang, locked, grid, onPick, onSubmit }: Props) {
  const [choice, setChoice] = useState<string | null>(null)

  const pick = (o: string) => {
    setChoice(o)
    onPick?.(o)
  }
  const submit = () => {
    if (!choice || locked) return
    onSubmit(choice === answer, choice)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (locked) return
      const n = Number(e.key)
      if (n >= 1 && n <= options.length) pick(options[n - 1])
      else if (e.key === 'Enter' && choice) {
        e.preventDefault()
        submit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <>
      <div className={`options stagger ${grid ? 'options-grid' : 'options-list'}`}>
        {options.map((o, i) => {
          const state = locked ? (o === answer ? 'is-correct' : o === choice ? 'is-wrong' : '') : o === choice ? 'is-selected' : ''
          return (
            <button key={o} className={`option ${state}`} disabled={locked} onClick={() => pick(o)}>
              <span className="option-key">{i + 1}</span>
              <span lang={lang} className="option-text">
                {o}
              </span>
            </button>
          )
        })}
      </div>
      {!locked && (
        <div className="ex-actions">
          <button className="btn btn-primary btn-lg" disabled={!choice} onClick={submit}>
            Check
          </button>
        </div>
      )}
    </>
  )
}
