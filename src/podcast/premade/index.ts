import { COURSES } from '../../content'
import type { LangCode } from '../../content/types'
import type { Episode } from '../episode'
import { knownItems, knownRatio, knownSet } from '../episode'
import type { Premade } from './types'
import { ZH_PODCASTS } from './zh'
import { JA_PODCASTS } from './ja'
import { PT_PODCASTS } from './pt'

const RAW: Record<LangCode, Premade[]> = { zh: ZH_PODCASTS, ja: JA_PODCASTS, pt: PT_PODCASTS }

function toEpisode(lang: LangCode, p: Premade, i: number): Episode {
  const course = COURSES[lang]
  const at = course.units.findIndex((u) => u.id === p.after)
  const lines = p.lines.map(([speaker, target, reading, translation]) => ({ speaker, target, reading, translation }))
  return {
    id: `pre-${lang}-${i + 1}`,
    lang,
    unitId: p.after,
    source: 'course',
    title: p.title,
    summary: p.summary,
    lines,
    questions: p.questions.map(([q, options, answer]) => ({ q, options, answer })),
    known: knownRatio(lang, lines, knownSet(lang, knownItems(course.units.slice(0, at + 1)))).ratio,
  }
}

const cache = new Map<LangCode, Episode[]>()
/** The premade episodes of a course, in course order. */
export function premadeEpisodes(lang: LangCode): Episode[] {
  if (!cache.has(lang)) cache.set(lang, RAW[lang].map((p, i) => toEpisode(lang, p, i)))
  return cache.get(lang)!
}
