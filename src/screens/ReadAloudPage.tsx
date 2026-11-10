import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CompleteScreen } from '../components/CompleteScreen'
import { SessionRunner, type SessionSummary } from '../components/SessionRunner'
import { COURSES, findReading } from '../content'
import type { Item } from '../content/types'
import { findStory } from '../content/stories'
import { buildReadAloud } from '../engine/exercises'
import { sessionXp, type XpBreakdown } from '../engine/xp'
import { useStore } from '../store/useStore'

/*
 * Read aloud: a graded reader or a story, sentence by sentence, scored by how it sounds.
 * It pays practice XP but doesn't touch your review cards (story lines aren't cards).
 */
export function ReadAloudPage() {
  const { kind = '', id = '' } = useParams()
  const navigate = useNavigate()
  const { recordSession, streak } = useStore()
  const source = (() => {
    if (kind === 'reading') {
      const r = findReading(id)
      return r ? { course: r.course, title: r.reading.title, sentences: r.reading.sentences, back: `/reading/${id}` } : null
    }
    const story = findStory(decodeURIComponent(id))
    if (!story) return null
    const sentences: Item[] = story.scenes.flatMap((sc, si) => sc.lines.map((l, li) => ({ id: `${story.id}:${si}:${li}`, kind: 'sentence' as const, target: l.target, reading: l.reading, meaning: l.meaning })))
    return { course: COURSES[story.lang], title: story.title, sentences, back: `/story/${encodeURIComponent(story.id)}` }
  })()
  const [exercises] = useState(() => (source ? buildReadAloud(source.sentences) : []))
  const [done, setDone] = useState<{ xp: XpBreakdown; accuracy: number; durationMs: number; streakBefore: number } | null>(null)
  if (!source || !exercises.length) return <Navigate to="/" replace />
  const finish = (sum: SessionSummary) => {
    const xp = sessionXp('practice', sum)
    const before = streak.current
    recordSession({ lang: source.course.lang, xp: xp.total, ratings: {} })
    setDone({ xp, accuracy: sum.graded ? sum.correct / sum.graded : 1, durationMs: sum.durationMs, streakBefore: before })
  }
  if (done) return <CompleteScreen title="Read aloud: done!" xp={done.xp.total} breakdown={done.xp} baseLabel="Read aloud" accuracy={done.accuracy} durationMs={done.durationMs} streakBefore={done.streakBefore} onContinue={() => navigate(source.back)} />
  return <SessionRunner exercises={exercises} course={source.course} onFinish={finish} onExit={() => navigate(source.back)} />
}
