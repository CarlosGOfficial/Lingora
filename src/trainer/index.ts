import type { Item, LangCode } from '../content/types'
import { stripDiacritics } from '../lib/answer'
import { JA_ADJS, JA_ADJ_FORMS, JA_VERBS, JA_VERB_FORMS, conjugateJa, conjugateJaAdj, jaVerbForms, romaji } from './ja'
import { PT_PERSONS, PT_TENSES, PT_VERBS, conjugatePt, type PtPerson } from './pt'
import { CLASSIFIERS, MEASURE_WORDS } from './zh'

/*
 * The verb & grammar trainer (/trainer). Every form is its own card, an ordinary item
 * with an id like "pt-conj-falar-pres-1p", "ja-form-taberu-te", "ja-adj-takai-past" or
 * "zh-mw-shu", registered with the course lookups (setExtraItems) so reviews, sync and
 * the mistakes notebook treat it like any other word.
 *
 * Each item belongs to a "group" (a verb, an adjective, or all measure words): the
 * other forms in the group are the wrong answers in multiple choice.
 */

export type Drill = { id: string; label: string; hint: string }
export type TrainerWord = { key: string; title: string; reading?: string; gloss: string; tag?: string; items: { item: Item; drill: string; row?: string }[] }
export type TrainerSet = { lang: LangCode; kinds: { id: string; label: string; drills: Drill[]; words: TrainerWord[] }[] }

const slug = (s: string) => stripDiacritics(s).toLowerCase().replace(/[^a-z0-9]+/g, '')
const PT_SHORT: Record<PtPerson, string> = { '1s': 'eu', '3s': 'você', '1p': 'nós', '3p': 'eles' }

function ptSet(): TrainerSet {
  const words: TrainerWord[] = PT_VERBS.map(({ inf, gloss }) => ({
    key: `pt-${slug(inf)}`, title: inf, gloss,
    items: PT_TENSES.flatMap((t) => PT_PERSONS.map((p) => {
      const who = (t.id === 'subj' ? 'que ' : '') + PT_SHORT[p.id]
      const item: Item = {
        id: `pt-conj-${slug(inf)}-${t.id}-${p.id}`, kind: 'word', target: conjugatePt(inf, t.id, p.id),
        meaning: `${inf} → ${who} (${t.label.toLowerCase()})`,
        note: `${inf}: ${gloss}. ${p.en}, ${t.label.toLowerCase()}.`,
      }
      return { item, drill: t.id, row: p.id }
    })),
  }))
  return { lang: 'pt', kinds: [{ id: 'verbs', label: 'Verbs', drills: PT_TENSES.map((t) => ({ id: t.id, label: t.label, hint: t.hint })), words }] }
}

function jaSet(): TrainerSet {
  const label = (f: { label: string }) => f.label.replace(/ \(.*\)$/, '').toLowerCase()
  const verbs: TrainerWord[] = JA_VERBS.map((verb) => ({
    key: `ja-${romaji(verb.reading)}`, title: verb.dict, reading: verb.reading, gloss: verb.gloss,
    tag: verb.cls === 'godan' ? 'godan (u-verb)' : verb.cls === 'ichidan' ? 'ichidan (ru-verb)' : 'irregular',
    items: jaVerbForms(verb).map((f) => {
      const form = conjugateJa(verb, f)
      const spec = JA_VERB_FORMS.find((x) => x.id === f)!
      const item: Item = {
        id: `ja-form-${romaji(verb.reading)}-${f}`, kind: 'word', target: form.target,
        ...(form.reading !== form.target ? { reading: form.reading } : {}), romanization: romaji(form.reading),
        ...(form.alt ? { alt: [...form.alt, ...form.alt.filter((s) => /^[ぁ-ゖ]+$/.test(s)).map(romaji)] } : {}),
        meaning: `${verb.dict} (${verb.gloss}) → ${label(spec)}`,
        note: `${spec.label}: like “${spec.hint}”.`,
      }
      return { item, drill: f }
    }),
  }))
  const adjs: TrainerWord[] = JA_ADJS.map((adj) => ({
    key: `ja-adj-${romaji(adj.reading)}`, title: adj.word, reading: adj.reading, gloss: adj.gloss, tag: adj.kind === 'i' ? 'い-adjective' : 'な-adjective',
    items: JA_ADJ_FORMS.map((f) => {
      const form = conjugateJaAdj(adj, f.id)
      const item: Item = {
        id: `ja-adj-${romaji(adj.reading)}-${f.id}`, kind: 'word', target: form.target,
        ...(form.reading !== form.target ? { reading: form.reading } : {}), romanization: romaji(form.reading),
        ...(form.alt ? { alt: [...form.alt, ...form.alt.filter((s) => /^[ぁ-ゖ]+$/.test(s)).map(romaji)] } : {}),
        meaning: `${adj.word} (${adj.gloss}) → ${f.label.toLowerCase()}`,
        note: `${f.label}: like “${f.hint}”.`,
      }
      return { item, drill: f.id }
    }),
  }))
  return {
    lang: 'ja', kinds: [
      { id: 'verbs', label: 'Verbs', drills: JA_VERB_FORMS.map(({ id, label, hint }) => ({ id, label, hint })), words: verbs },
      { id: 'adjectives', label: 'Adjectives', drills: JA_ADJ_FORMS.map(({ id, label, hint }) => ({ id, label, hint })), words: adjs },
    ],
  }
}

function zhSet(): TrainerSet {
  const words: TrainerWord[] = MEASURE_WORDS.map((w) => {
    const c = CLASSIFIERS[w.mw]
    const alsoPinyin = (w.also ?? []).map((x) => CLASSIFIERS[x]?.pinyin).filter((x): x is string => !!x)
    const item: Item = {
      id: `zh-mw-${slug(w.pinyin)}`, kind: 'word', target: c.char, reading: c.pinyin,
      ...(w.also?.length ? { alt: [...w.also, ...alsoPinyin] } : {}),
      meaning: `一 __ ${w.noun} (a ${w.gloss})`,
      note: `${c.char} (${c.pinyin}): ${c.use}.${w.also?.length ? ` Also heard: ${w.also.join(', ')}.` : ''}`,
    }
    return { key: `zh-${slug(w.pinyin)}`, title: w.noun, reading: w.pinyin, gloss: w.gloss, tag: w.mw, items: [{ item, drill: 'mw' }] }
  })
  return { lang: 'zh', kinds: [{ id: 'measure', label: 'Measure words', drills: [{ id: 'mw', label: 'Measure words', hint: '一本书, 两只猫…' }], words }] }
}

let sets: Record<LangCode, TrainerSet> | null = null
const groupOf = new Map<string, Item[]>()
const index = new Map<string, Item>()

export function trainerSets(): Record<LangCode, TrainerSet> {
  if (sets) return sets
  sets = { pt: ptSet(), ja: jaSet(), zh: zhSet() }
  for (const set of Object.values(sets)) for (const kind of set.kinds) {
    // Measure words share one group (every classifier is a wrong answer for the others).
    const shared = set.lang === 'zh' ? kind.words.flatMap((w) => w.items.map((x) => x.item)) : null
    for (const word of kind.words) {
      const group = shared ?? word.items.map((x) => x.item)
      for (const { item } of word.items) { index.set(item.id, item); groupOf.set(item.id, group) }
    }
  }
  return sets
}

export const isTrainerItem = (id: string) => /^(pt-conj|ja-form|ja-adj|zh-mw)-/.test(id)
export const trainerItems = (): Item[] => (trainerSets(), [...index.values()])
export const trainerItem = (id: string) => (trainerSets(), index.get(id))

/** Wrong answers for multiple choice: the item's siblings, with distinct answers. */
export function trainerPool(item: Item): Item[] {
  trainerSets()
  const group = groupOf.get(item.id) ?? []
  // Never offer another accepted answer as a wrong one (狗 takes 只 or 条).
  const seen = new Set([item.target, ...(item.alt ?? [])])
  return group.filter((x) => x.id !== item.id && !seen.has(x.target) && (seen.add(x.target), true))
}
