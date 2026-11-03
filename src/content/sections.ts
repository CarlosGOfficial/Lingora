import type { Course, LangCode, Lesson, Unit } from './types'

/**
 * Sections are the big blocks of a course (like Duolingo's): one per level of the
 * course's standard — HSK 1 / 2 / 3, JLPT N5 / N4 / N3, CEFR A1 / A2 / B1.
 */
export interface Section {
  /** 0-based position in the course. */
  index: number
  level: string
  title: string
  blurb: string
  units: Unit[]
}

const INFO: Record<LangCode, Record<string, { title: string; blurb: string }>> = {
  zh: {
    'HSK 1': { title: 'Foundations', blurb: 'Greetings, numbers, family, time and shopping — the 150 words of HSK 1 and the core sentence patterns.' },
    'HSK 2': { title: 'Everyday Life', blurb: 'Get around town, talk about weather, health and free time, describe experiences and compare things.' },
    'HSK 3': { title: 'Getting Independent', blurb: 'Work, study, plans and opinions — longer sentences joined with connectors and complements.' },
  },
  ja: {
    N5: { title: 'Foundations', blurb: 'Greetings, numbers, time, shopping and family — polite です / ます sentences with the basic particles.' },
    N4: { title: 'Everyday Japanese', blurb: 'Hobbies, health, requests and travel — the て-form, can and can’t, and giving reasons.' },
    N3: { title: 'Real Conversations', blurb: 'Work, opinions, plans and manners — casual and polite speech side by side.' },
  },
  pt: {
    A1: { title: 'Foundations', blurb: 'Greetings, numbers, family, routines and shopping in Brazilian Portuguese.' },
    A2: { title: 'Everyday Life', blurb: 'Weekends, weather, clothes and health — the past tense and making plans.' },
    B1: { title: 'Independent Speaker', blurb: 'Work, travel, opinions and hypotheticals — say what you think and what would happen if.' },
  },
}

/** The course's sections, in order (consecutive units of the same level). */
export function sections(course: Course): Section[] {
  const out: Section[] = []
  for (const unit of course.units) {
    const last = out[out.length - 1]
    if (last && last.level === unit.level) last.units.push(unit)
    else {
      const info = INFO[course.lang][unit.level] ?? { title: unit.level, blurb: '' }
      out.push({ index: out.length, level: unit.level, ...info, units: [unit] })
    }
  }
  return out
}

export const sectionLessons = (s: Section): Lesson[] => s.units.flatMap((u) => u.lessons)

export function sectionProgress(s: Section, completed: string[]): { done: number; total: number } {
  const lessons = sectionLessons(s)
  return { done: lessons.filter((l) => completed.includes(l.id)).length, total: lessons.length }
}

export const isSectionComplete = (s: Section, completed: string[]) => sectionLessons(s).every((l) => completed.includes(l.id))

/** The section you're working in: the one holding your next lesson (or the last one when all are done). */
export function currentSectionIndex(course: Course, completed: string[]): number {
  const all = sections(course)
  const i = all.findIndex((s) => !isSectionComplete(s, completed))
  return i === -1 ? all.length - 1 : i
}

/** Every lesson before a section — what a "jump here" test covers and, if passed, completes. */
export const lessonsBefore = (course: Course, index: number): Lesson[] => sections(course).slice(0, index).flatMap(sectionLessons)

/** "HSK 1", "JLPT N5", "CEFR A1" — the level with its standard, without repeating it. */
export const levelLabel = (course: Course, level: string) => (level.startsWith(course.standard.split(' ')[0]) ? level : `${course.standard} ${level}`)

/** Share of first-try answers needed to jump ahead to a later section. */
export const JUMP_PASS = 0.8
