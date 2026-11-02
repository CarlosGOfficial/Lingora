import type { Exercise } from '../../engine/exercises'
import { TargetText } from '../TargetText'
import { ChoiceList } from './ChoiceList'
import type { ExerciseProps } from './types'

/** How is this pronounced? Pick the right pinyin (with tones) or kana reading. */
export function ReadingDrill({ ex, course, locked, onSubmit }: ExerciseProps<Extract<Exercise, { type: 'reading' }>>) {
  const { item } = ex
  return (
    <div className="ex">
      <h2 className="ex-title">{course.lang === 'zh' ? 'Which pinyin is right? Watch the tones!' : 'How do you read this?'}</h2>
      <div className="prompt-row center">
        <TargetText item={item} course={course} size="xl" reading={false} />
      </div>
      <p className="muted small" style={{ textAlign: 'center', margin: 0 }}>
        {item.meaning}
      </p>
      <ChoiceList
        options={ex.options}
        answer={item.reading!}
        lang={course.lang === 'ja' ? course.bcp47 : undefined}
        locked={locked}
        grid
        onSubmit={(correct, given) => onSubmit({ quality: correct ? 'correct' : 'wrong', given })}
      />
    </div>
  )
}
