import { useState } from 'react'
import type { Exercise } from '../../engine/exercises'
import { normalize } from '../../lib/answer'
import { ChoiceList } from './ChoiceList'
import type { ExerciseProps } from './types'

/** Fill in the blank: one word of a sentence is missing. */
export function Cloze({ ex, course, locked, onSubmit }: ExerciseProps<Extract<Exercise, { type: 'cloze' }>>) {
  const [picked, setPicked] = useState<string | null>(null)
  const tokens = ex.item.tokens ?? []
  const answer = tokens[ex.blank]
  const joiner = course.lang === 'pt' ? ' ' : ''

  return (
    <div className="ex">
      <h2 className="ex-title">Fill in the blank</h2>
      <div className="cloze-sentence" lang={course.bcp47}>
        {tokens.map((t, i) => (
          <span key={i}>
            {i === ex.blank ? <span className={`cloze-blank ${picked ? 'filled' : ''}`}>{locked ? answer : picked ?? ' '}</span> : t}
            {i < tokens.length - 1 ? joiner : ''}
          </span>
        ))}
      </div>
      <div className="prompt-bubble">{ex.item.meaning}</div>
      <ChoiceList
        options={ex.options}
        answer={answer}
        lang={course.bcp47}
        locked={locked}
        grid
        onPick={setPicked}
        // Accept any option that reads the same (e.g. a word repeated in the sentence).
        onSubmit={(_, given) => onSubmit({ quality: normalize(given) === normalize(answer) ? 'correct' : 'wrong', given })}
      />
    </div>
  )
}
