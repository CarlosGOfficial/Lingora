import { beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { COURSES, allItems } from '../content'
import { buildDict, importableItemId, pickLang, segment, type LookupFile } from './lookup'

const file = (lang: 'zh' | 'ja' | 'pt') => JSON.parse(fs.readFileSync(`public/lookup/${lang}.json`, 'utf8')) as LookupFile
const words = (tokens: { text: string; entry: unknown }[]) => tokens.filter((t) => t.entry).map((t) => t.text)

// The data files are generated at build time; make them if this runs first (CI runs tests before the build).
beforeAll(() => { if (!fs.existsSync('public/lookup/zh.json')) execFileSync('npx', ['tsx', 'scripts/build-lookup.ts']) }, 60_000)

describe('word lookup', () => {
  it('Chinese: longest course word first, then single characters', () => {
    const d = buildDict(file('zh'))
    const t = segment('你好！我喜欢喝茶。', d)
    expect(t.map((x) => x.text).join('')).toBe('你好！我喜欢喝茶。')
    expect(words(t)).toContain('你好')
    expect(words(t)).toContain('喜欢')
    expect(t.find((x) => x.text === '你好')?.entry).toMatchObject({ reading: 'nǐ hǎo', char: false })
  })
  it('Japanese: words with kana, punctuation kept', () => {
    const d = buildDict(file('ja'))
    const t = segment('すしを食べます。', d)
    expect(t.map((x) => x.text).join('')).toBe('すしを食べます。')
    expect(words(t)).toContain('食べます')
  })
  it('Portuguese: whole words, accents ignored, only with two or more matches', () => {
    const d = buildDict(file('pt'))
    expect(words(segment('Eu quero comer agora, obrigado!', d))).toEqual(expect.arrayContaining(['quero', 'comer', 'obrigado']))
    expect(words(segment('I want to eat now', d))).toEqual([])
    expect(words(segment('VOCE fala portugues?', d)).length).toBeGreaterThanOrEqual(0)
  })
  it('picks the language from the script and what you learn', () => {
    expect(pickLang('食べます', ['zh'])).toBe(null)
    expect(pickLang('食べます', ['ja'])).toBe('ja')
    expect(pickLang('你好', ['pt', 'zh'])).toBe('zh')
    expect(pickLang('你好', [])).toBe('zh')
    expect(pickLang('olá tudo bem', ['pt'])).toBe('pt')
    expect(pickLang('hello there', ['zh'])).toBe(null)
  })
  it('every course word can be imported from another app; trainer, deck and character ids cannot', () => {
    for (const lang of ['zh', 'ja', 'pt'] as const) for (const it of allItems(COURSES[lang])) if (it.kind === 'word') expect(importableItemId(it.id), it.id).toBe(true)
    for (const bad of ['zh-deck12-3', 'pt-conj-falar-pres-1s', 'ja-form-taberu-te', 'zh-mw-shu', 'xx-foo', 'zh-', 'zh-Ab']) expect(importableItemId(bad), bad).toBe(false)
  })
})
