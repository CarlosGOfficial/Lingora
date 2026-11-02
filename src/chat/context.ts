import { getGrammar } from '../content'
import type { Course, Unit } from '../content/types'
import type { ChatRequest, ChatScenario } from './types'

const MAX_WORDS = 200
const MAX_GRAMMAR = 30

const started = (course: Course, completed: string[]) => course.units.filter((u) => u.lessons.some((l) => completed.includes(l.id)))

/** The unit the learner is working in (the latest one they've started). */
export function currentUnit(course: Course, completed: string[]): Unit {
  const units = started(course, completed)
  return units[units.length - 1] ?? course.units[0]
}

/** Role-plays drawn from the can-do goals of units the learner has started, newest first. */
export function scenarios(course: Course, completed: string[]): ChatScenario[] {
  const units = started(course, completed).reverse()
  const out: ChatScenario[] = units.flatMap((u) =>
    u.canDo.map((goal, i) => ({ id: `${u.id}:${i}`, title: `${u.title} · ${u.level}`, goal })),
  )
  out.push({ id: 'free', title: 'Free chat', goal: 'Have a relaxed chat about yourself and your day using what you know.' })
  return out
}

/** What the conversation partner needs to stay within what the learner has studied. */
export function learnerContext(course: Course, completed: string[], scenario: ChatScenario): Omit<ChatRequest, 'messages'> {
  const lessons = course.units.flatMap((u) => u.lessons).filter((l) => completed.includes(l.id))
  const unit = currentUnit(course, completed)
  const words = lessons
    .flatMap((l) => l.items)
    .filter((i) => i.kind === 'word')
    .slice(-MAX_WORDS)
    .map((i) => ({ target: i.target, reading: i.reading ?? '', meaning: i.meaning.slice(0, 120) }))
  const grammar = lessons
    .flatMap((l) => getGrammar(l.id))
    .map((g) => (g.pattern ? `${g.title} (${g.pattern})` : g.title).slice(0, 160))
    .slice(-MAX_GRAMMAR)
  return {
    lang: course.lang,
    level: unit.level.slice(0, 40),
    unit: unit.title.slice(0, 120),
    scenario: { title: scenario.title.slice(0, 120), goal: scenario.goal.slice(0, 300) },
    words,
    grammar,
  }
}
