// Builds public/strokes/{zh,ja}/<char>.json (stroke shapes + medians for Hanzi Writer)
// for just the characters the courses use.
//   Chinese: hanzi-writer-data (from Make Me a Hanzi, Arphic Public License)
//   Japanese kanji and kana: AnimCJK graphicsJa.txt / graphicsJaKana.txt (Arphic Public
//   License; kana also LGPL), downloaded from https://github.com/parsimonhi/animCJK
// Usage: node scripts/build-strokes.mjs <folder with graphicsJa.txt and graphicsJaKana.txt>
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const root = path.dirname(path.dirname(new URL(import.meta.url).pathname))
const acjk = process.argv[2]
if (!acjk) throw new Error('Pass the folder holding graphicsJa.txt and graphicsJaKana.txt')

const charsOf = (lang) => {
  const set = new Set()
  for (const f of fs.readdirSync(path.join(root, 'src/content'))) {
    if (!f.startsWith(lang) || !f.endsWith('.ts')) continue
    for (const c of fs.readFileSync(path.join(root, 'src/content', f), 'utf8').match(/[぀-ヿ一-鿿]/g) ?? []) set.add(c)
  }
  return set
}

const out = (lang) => {
  const dir = path.join(root, 'public/strokes', lang)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

// Chinese
let zh = 0, zhMissing = []
const zhDir = out('zh')
for (const c of charsOf('zh')) {
  try {
    const d = require(`hanzi-writer-data/${c}.json`)
    fs.writeFileSync(path.join(zhDir, `${c}.json`), JSON.stringify({ strokes: d.strokes, medians: d.medians }))
    zh++
  } catch { zhMissing.push(c) }
}

// Japanese
const jaChars = charsOf('ja')
const jaDir = out('ja')
let ja = 0
for (const file of ['graphicsJa.txt', 'graphicsJaKana.txt']) {
  for (const line of fs.readFileSync(path.join(acjk, file), 'utf8').split('\n')) {
    if (!line.trim()) continue
    let d
    try { d = JSON.parse(line) } catch { continue }
    if (!jaChars.has(d.character)) continue
    fs.writeFileSync(path.join(jaDir, `${d.character}.json`), JSON.stringify({ strokes: d.strokes, medians: d.medians }))
    jaChars.delete(d.character)
    ja++
  }
}
const lic = path.join(root, 'public/strokes/LICENSES')
fs.mkdirSync(lic, { recursive: true })
fs.copyFileSync(require.resolve('hanzi-writer-data/ARPHICPL.TXT'), path.join(lic, 'ARPHICPL.TXT'))
if (fs.existsSync(path.join(acjk, 'COPYING.txt'))) fs.copyFileSync(path.join(acjk, 'COPYING.txt'), path.join(lic, 'AnimCJK-COPYING.txt'))
console.log(`zh: ${zh} (missing ${zhMissing.join('')}) · ja: ${ja} (missing ${[...jaChars].join('')})`)
