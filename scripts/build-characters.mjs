// Builds src/content/characters/{zh,ja}.json for the character explorer (/characters):
// for every hanzi / kanji the courses use, its radical, parts, stroke count, readings and
// meaning. Only the courses' characters are kept, so the files stay small.
//
// Sources (installed only to run this script, not app dependencies):
//   kanji-inspector         Unicode Unihan database: kRSUnicode (radical), kTotalStrokes,
//                           kMandarin, kDefinition (Unicode License v3)
//   chinese-characters-decomposition
//                           Wikimedia Commons "Chinese characters decomposition" table:
//                           the parts of Chinese characters (CC BY-SA)
//   kanji-data              KANJIDIC (EDRDG, CC BY-SA 4.0): on / kun readings, meanings,
//                           stroke counts, JLPT level and school grade for kanji
//   kanji                   kanji trees generated from KanjiVG (Ulrich Apel, CC BY-SA 3.0):
//                           the parts of Japanese kanji
//   hanzi                   English names of the Kangxi radicals (MIT)
//
// Usage:
//   npm i --prefix /tmp/chardata --ignore-scripts kanji-inspector chinese-characters-decomposition kanji-data kanji hanzi
//   node scripts/build-characters.mjs /tmp/chardata/node_modules
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname))
const mods = process.argv[2]
if (!mods) throw new Error('Pass the node_modules folder holding the data packages')
const require = createRequire(path.join(mods, 'x.js'))

const HAN = /[一-鿿]/g
const charsOf = (lang) => {
  const set = new Set()
  for (const f of fs.readdirSync(path.join(root, 'src/content'))) {
    if (!f.startsWith(lang) || !f.endsWith('.ts')) continue
    for (const c of fs.readFileSync(path.join(root, 'src/content', f), 'utf8').match(HAN) ?? []) set.add(c)
  }
  for (const f of [`grammar/${lang}.ts`]) {
    const file = path.join(root, 'src/content', f)
    if (fs.existsSync(file)) for (const c of fs.readFileSync(file, 'utf8').match(HAN) ?? []) set.add(c)
  }
  for (const f of fs.readdirSync(path.join(root, 'src/content/stories'))) {
    if (!f.startsWith(lang)) continue
    for (const c of fs.readFileSync(path.join(root, 'src/content/stories', f), 'utf8').match(HAN) ?? []) set.add(c)
  }
  return [...set].sort((a, b) => a.codePointAt(0) - b.codePointAt(0))
}

// Unihan, through the SQLite files kanji-inspector ships (read with the sqlite3 CLI or Python).
const db = (name) => path.join(mods, 'kanji-inspector/dist/db', name)
function unihan(chars) {
  const py = `
import sqlite3, json, sys
chars = json.loads(sys.argv[1]); out = {}
irg = sqlite3.connect(sys.argv[2]); rd = sqlite3.connect(sys.argv[3])
for c in chars:
    a = irg.execute('select kRSUnicode, kTotalStrokes from IRGSources where codepoint = ?', (ord(c),)).fetchone()
    b = rd.execute('select kMandarin, kDefinition from Readings where codepoint = ?', (ord(c),)).fetchone()
    out[c] = {'rs': a and a[0], 'strokes': a and a[1], 'mandarin': b and b[0], 'def': b and b[1]}
print(json.dumps(out, ensure_ascii=False))`
  return JSON.parse(execFileSync('python3', ['-c', py, JSON.stringify(chars), db('IRGSources.db'), db('Readings.db')], { maxBuffer: 64 << 20 }).toString())
}

// Kangxi radicals: number → character (the Kangxi Radicals block normalises to the
// ordinary character) and English name. Simplified forms (kRSUnicode "120'") by hand.
const radicalNames = require('hanzi/lib/data/radicalListWithMeaning.js').radicalListWithMeaning
const SIMPLIFIED = { 9: '亻', 18: '刂', 61: '忄', 64: '扌', 85: '氵', 86: '灬', 94: '犭', 113: '礻', 120: '纟', 140: '艹', 145: '衤', 147: '见', 149: '讠', 154: '贝', 159: '车', 162: '辶', 163: '阝', 167: '钅', 169: '门', 170: '阝', 178: '韦', 181: '页', 182: '风', 184: '饣', 187: '马', 195: '鱼', 196: '鸟', 199: '麦', 205: '黾', 210: '齐', 211: '齿', 212: '龙' }
const radicals = {}
function radical(rs) {
  const m = /^(\d+)('*)\.(-?\d+)/.exec(rs ?? '')
  if (!m) return null
  const n = Number(m[1])
  const base = String.fromCodePoint(0x2f00 + n - 1).normalize('NFKC')
  const form = m[2] && SIMPLIFIED[n] ? SIMPLIFIED[n] : base
  radicals[n] ??= { char: base, name: (radicalNames[base] ?? '').replace(/\//g, ', ') }
  return { n, form, extra: Number(m[3]) }
}

// Chinese parts (CCD): the two top-level components.
const ccd = require('chinese-characters-decomposition/ccd.json')
const ccdOf = new Map(ccd.rows.map((r) => [r[0], r]))
const isPart = (c) => !!c && /^[一-鿿㐀-䶿⺀-⿕]$/u.test(c) // drop placeholders like "*"
function zhParts(c) {
  const r = ccdOf.get(c)
  if (!r || r[2] === '一') return []
  return [r[3], r[5]].filter((x) => isPart(x) && x !== c)
}

// Japanese parts (KanjiVG trees): the top-level elements.
function jaParts(c) {
  const f = path.join(mods, 'kanji/dist/data/kanji-tree', c.codePointAt(0).toString(16).padStart(5, '0') + '.json')
  if (!fs.existsSync(f)) return []
  const t = JSON.parse(fs.readFileSync(f, 'utf8'))
  return [...new Set((t.g ?? []).map((g) => g.element).filter((x) => isPart(x) && x !== c))]
}
const kanjidic = JSON.parse(fs.readFileSync(path.join(mods, 'kanji-data/data/kanji-meta.json'), 'utf8'))

const clean = (s) => (s ?? '').replace(/\s+/g, ' ').trim()
const outDir = path.join(root, 'src/content/characters')
fs.mkdirSync(outDir, { recursive: true })
const report = []

// Chinese
{
  const chars = charsOf('zh'), u = unihan(chars), out = {}
  for (const c of chars) {
    const d = u[c], r = radical(d.rs)
    if (!r) { report.push(`zh ${c}: no Unihan entry`); continue }
    out[c] = {
      r: r.n, rf: r.form, s: Number(String(d.strokes).split(' ')[0]) || null,
      py: clean(d.mandarin).split(' ')[0] || null, m: clean(d.def).split(';').slice(0, 3).map((x) => x.trim()).filter(Boolean).join('; ') || null,
      p: zhParts(c),
    }
  }
  fs.writeFileSync(path.join(outDir, 'zh.json'), JSON.stringify({ radicals: pick(radicals, out), chars: out }))
  report.push(`zh: ${Object.keys(out).length} of ${chars.length} characters`)
}

// Japanese
{
  const chars = charsOf('ja'), u = unihan(chars), out = {}
  for (const c of chars) {
    const d = u[c], r = radical(d.rs), k = kanjidic[c]
    if (!r) { report.push(`ja ${c}: no Unihan entry`); continue }
    out[c] = {
      r: r.n, rf: r.form, s: k?.stroke_count ?? (Number(String(d.strokes).split(' ').pop()) || null),
      on: k?.on_readings ?? [], kun: (k?.kun_readings ?? []).slice(0, 6), m: (k?.meanings ?? []).slice(0, 4).join(', ') || clean(d.def).split(';')[0] || null,
      ...(k?.jlpt ? { jlpt: k.jlpt } : {}), ...(k?.grade ? { g: k.grade } : {}),
      p: jaParts(c),
    }
  }
  fs.writeFileSync(path.join(outDir, 'ja.json'), JSON.stringify({ radicals: pick(radicals, out), chars: out }))
  report.push(`ja: ${Object.keys(out).length} of ${chars.length} characters`)
}

function pick(all, chars) {
  const used = new Set(Object.values(chars).map((x) => x.r))
  return Object.fromEntries(Object.entries(all).filter(([n]) => used.has(Number(n))))
}
console.log(report.join('\n'))
