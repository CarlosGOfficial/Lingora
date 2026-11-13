/*
 * Builds public/lookup/{zh,ja,pt}.json: Lingora's course words (written form, reading,
 * meaning, item id) and single characters, for word lookup in the sister apps
 * (src/lib/lookup.ts). Runs before `vite build`; the output isn't committed.
 */
import fs from 'node:fs'
import path from 'node:path'
import { COURSES, allItems } from '../src/content'
import { LOOKUP_LANGS, type LookupFile, type LookupWord } from '../src/lib/lookup'

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname))
const out = path.join(root, 'public/lookup')
fs.mkdirSync(out, { recursive: true })

type CharFile = { chars: Record<string, { py?: string | null; on?: string[]; kun?: string[]; m: string | null }> }
const charsOf = (lang: 'zh' | 'ja'): CharFile => JSON.parse(fs.readFileSync(path.join(root, `src/content/characters/${lang}.json`), 'utf8'))

for (const lang of LOOKUP_LANGS) {
  const seen = new Set<string>()
  const words: LookupWord[] = []
  for (const it of allItems(COURSES[lang])) {
    if (it.kind !== 'word') continue
    // A word can be taught in two lessons: keep the first.
    for (const form of [it.target, ...(lang === 'pt' ? it.alt ?? [] : [])]) {
      const key = form.toLowerCase()
      if (seen.has(key) || !form.trim()) continue
      seen.add(key)
      words.push([form, it.reading ?? it.romanization ?? '', it.meaning, it.id])
    }
  }
  const chars: LookupFile['chars'] = {}
  if (lang !== 'pt') {
    for (const [c, info] of Object.entries(charsOf(lang).chars)) {
      const reading = lang === 'zh' ? info.py ?? '' : [...(info.on ?? []), ...(info.kun ?? []).map((k) => k.replace('.', ''))].slice(0, 4).join('、')
      chars[c] = [reading, info.m ?? '']
    }
  }
  const file: LookupFile = { v: 1, lang, words, chars }
  fs.writeFileSync(path.join(out, `${lang}.json`), JSON.stringify(file))
  console.log(`lookup: ${lang} ${words.length} words, ${Object.keys(chars).length} characters`)
}
