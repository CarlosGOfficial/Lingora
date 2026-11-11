import { jaGrammar } from './grammar/ja'
import { ptGrammar } from './grammar/pt'
import { zhGrammar } from './grammar/zh'
import { ja } from './ja'
import { jaTier23Grammar } from './ja-tier2-3'
import { pt } from './pt'
import { ptTier23Grammar } from './pt-tier2-3'
import { zhTier23Grammar } from './zh-tier2-3'
import { jaMoreGrammar } from './ja-more'
import { jaMoreUnitsGrammar } from './ja-units-more'
import { jaSectionUnitsGrammar } from './ja-units-sections'
import { ptMoreGrammar } from './pt-more'
import { ptMoreUnitsGrammar } from './pt-units-more'
import { ptSectionUnitsGrammar } from './pt-units-sections'
import { zhMoreGrammar } from './zh-more'
import { zhMoreUnitsGrammar } from './zh-units-more'
import { zhSectionUnitsGrammar } from './zh-units-sections'
import type { Course, GrammarPoint, Item, LangCode, Lesson, Reading, Unit } from './types'
import { zh } from './zh'
import { trainerItems } from '../trainer'

export const COURSES: Record<LangCode, Course> = { zh, ja, pt }
export const LANG_CODES: LangCode[] = ['zh', 'ja', 'pt']

/** Grammar notes keyed by lesson id. */
export const GRAMMAR: Record<string, GrammarPoint[]> = {
  ...zhGrammar,
  ...zhTier23Grammar,
  ...zhMoreGrammar,
  ...zhMoreUnitsGrammar,
  ...zhSectionUnitsGrammar,
  ...jaGrammar,
  ...jaTier23Grammar,
  ...jaMoreGrammar,
  ...jaMoreUnitsGrammar,
  ...jaSectionUnitsGrammar,
  ...ptGrammar,
  ...ptTier23Grammar,
  ...ptMoreGrammar,
  ...ptMoreUnitsGrammar,
  ...ptSectionUnitsGrammar,
}

export function getGrammar(lessonId: string): GrammarPoint[] {
  return GRAMMAR[lessonId] ?? []
}

export function courseFor(id: string): Course | undefined {
  return COURSES[id.slice(0, 2) as LangCode]
}

/** Every learnable item (words + lesson sentences), in course order. */
export function allItems(course: Course): Item[] {
  return course.units.flatMap((u) => u.lessons.flatMap((l) => [...l.items, ...l.sentences]))
}

const itemIndex = new Map<string, Item>()
for (const c of Object.values(COURSES)) for (const it of allItems(c)) itemIndex.set(it.id, it)

export function getItem(id: string): Item | undefined {
  const hit = itemIndex.get(id)
  if (hit) return hit
  for (const items of extraItems.values()) { const x = items.get(id); if (x) return x }
  return undefined
}

/**
 * Items from outside the courses, by source: "decks" (community decks you own or follow,
 * src/social/decks.ts) and "trainer" (verb forms and measure words, src/trainer).
 */
const extraItems = new Map<string, Map<string, Item>>()
/** Replace one source's extra items (decks: whenever your decks change). */
export function setExtraItems(items: Item[], source = 'decks') {
  extraItems.set(source, new Map(items.map((it) => [it.id, it])))
}
setExtraItems(trainerItems(), 'trainer')

export function allLessons(course: Course): { unit: Unit; lesson: Lesson }[] {
  return course.units.flatMap((unit) => unit.lessons.map((lesson) => ({ unit, lesson })))
}

export function findLesson(lessonId: string): { course: Course; unit: Unit; lesson: Lesson } | undefined {
  const course = courseFor(lessonId)
  if (!course) return undefined
  const hit = allLessons(course).find((x) => x.lesson.id === lessonId)
  return hit && { course, ...hit }
}

export function findReading(readingId: string): { course: Course; unit: Unit; reading: Reading } | undefined {
  const course = courseFor(readingId)
  const unit = course?.units.find((u) => u.reading?.id === readingId)
  return course && unit?.reading ? { course, unit, reading: unit.reading } : undefined
}

/** The first lesson not yet completed; lessons unlock strictly in order. */
export function nextLessonId(course: Course, completed: string[]): string | undefined {
  return allLessons(course).find((x) => !completed.includes(x.lesson.id))?.lesson.id
}

export function isLessonUnlocked(course: Course, completed: string[], lessonId: string): boolean {
  return completed.includes(lessonId) || nextLessonId(course, completed) === lessonId
}

/** Completion id for a unit's review checkpoint (stored alongside lesson completions). */
export const unitReviewId = (unitId: string) => `${unitId}-review`

export function findUnit(unitId: string): { course: Course; unit: Unit } | undefined {
  const course = courseFor(unitId)
  const unit = course?.units.find((u) => u.id === unitId)
  return course && unit ? { course, unit } : undefined
}

export function isUnitComplete(unit: Unit, completed: string[]): boolean {
  return unit.lessons.every((l) => completed.includes(l.id))
}

export type { Course, GrammarPoint, Item, LangCode, Lesson, Reading, Unit }
