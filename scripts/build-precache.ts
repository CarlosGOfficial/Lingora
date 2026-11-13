/*
 * After `vite build`: lists what the service worker (public/sw.js) stores for offline use.
 *  - shell: the page, its JS/CSS (all course content, character data and grammar are in the
 *    bundle), icons, the manifest and the word-lookup files; cached on install.
 *  - strokes: stroke-order data for every character, cached in the background afterwards.
 * The version changes whenever any file name or size changes, so an update replaces the cache.
 */
import { createHash } from 'crypto'
import { readdirSync, statSync, writeFileSync } from 'fs'
import { join, relative } from 'path'

const DIST = 'dist'
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]))
const url = (f: string) => '/' + relative(DIST, f).split('\\').join('/').split('/').map(encodeURIComponent).join('/')

const files = walk(DIST)
const shell = ['/', ...files.filter((f) => !/[\\/](strokes)[\\/]/.test(f) && !/(sw\.js|precache\.json|LICENSES?.*)$/.test(f)).map(url)]
const strokes = files.filter((f) => /[\\/]strokes[\\/](zh|ja)[\\/].+\.json$/.test(f)).map(url)
const hash = createHash('sha256')
for (const f of files) hash.update(`${f}:${statSync(f).size}\n`)
const version = hash.digest('hex').slice(0, 12)
writeFileSync(join(DIST, 'precache.json'), JSON.stringify({ version, shell, strokes }))
const mb = (list: string[]) => (list.reduce((n, u) => n + statSync(join(DIST, decodeURIComponent(u.slice(1)) || 'index.html')).size, 0) / 1e6).toFixed(1)
console.log(`precache ${version}: ${shell.length} shell files (${mb(shell.filter((u) => u !== '/'))} MB), ${strokes.length} stroke files (${mb(strokes)} MB)`)
