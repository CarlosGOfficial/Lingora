/*
 * Writes the course words Banter's chat quiz uses (/lingoquiz): every word item with its
 * reading and meanings. Banter keeps an identical copy at shared/lingoraWords.json, which
 * its `npm run check:shared` compares with this file.
 *
 *   npx tsx scripts/export-banter-words.ts   (then copy it to ../chat/shared/lingoraWords.json)
 */
import { writeFileSync } from 'node:fs'
import { COURSES, allItems } from '../src/content'

const out = Object.values(COURSES).flatMap((c) =>
  allItems(c)
    .filter((i) => i.kind === 'word')
    .map((i) => ({ id: i.id, lang: c.lang, target: i.target, ...(i.reading ? { reading: i.reading } : {}), meaning: i.meaning, ...(i.meaningAlt?.length ? { alt: i.meaningAlt } : {}) })),
)
writeFileSync(new URL('./banter-words.json', import.meta.url), JSON.stringify(out) + '\n')
console.log(`${out.length} words`)
