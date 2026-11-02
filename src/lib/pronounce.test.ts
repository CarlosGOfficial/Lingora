import { describe, expect, it } from 'vitest'
import { COURSES, allItems } from '../content'
import { hanziToSyllables, kanaVariants, pinyinSyllables, scoreSpeech, spellNumbers, toneVariants } from './pronounce'

const zh = (id: string) => allItems(COURSES.zh).find((i) => i.id === id)!
const ja = (id: string) => allItems(COURSES.ja).find((i) => i.id === id)!
const pt = (id: string) => allItems(COURSES.pt).find((i) => i.id === id)!

describe('pinyin', () => {
  it('splits pinyin into toneless syllables', () => {
    expect(pinyinSyllables('nǐ hǎo')).toEqual(['ni', 'hao'])
    expect(pinyinSyllables('xièxie')).toEqual(['xie', 'xie'])
    expect(pinyinSyllables('méi guānxi')).toEqual(['mei', 'guan', 'xi'])
    expect(pinyinSyllables('nǚ’ér')).toEqual(['nü', 'er'])
    expect(pinyinSyllables('Zhōngguó rén')).toEqual(['zhong', 'guo', 'ren'])
  })

  it('parses the reading of nearly every Chinese item', () => {
    const items = allItems(COURSES.zh).filter((i) => i.reading)
    const parsed = items.filter((i) => pinyinSyllables(i.reading!))
    expect(parsed.length / items.length).toBeGreaterThan(0.97)
  })

  it('maps characters to sounds learned from the course', () => {
    expect(hanziToSyllables('你好')).toEqual(['ni', 'hao'])
    expect(hanziToSyllables('他她')).toEqual(['ta', 'ta'])
  })

  it('makes tone-only variants', () => {
    const v = toneVariants('nǐ hǎo', 3, () => 0.4)
    expect(v.length).toBeGreaterThan(0)
    for (const x of v) {
      expect(x).not.toBe('nǐ hǎo')
      expect(pinyinSyllables(x)).toEqual(['ni', 'hao'])
    }
  })
})

describe('kana variants', () => {
  it('makes plausible misreadings', () => {
    const v = kanaVariants('がくせい', 2)
    expect(v.length).toBe(2)
    expect(v).not.toContain('がくせい')
  })
})

describe('speech scoring', () => {
  it('accepts homophones in Chinese (scored by sound)', () => {
    const she = zh('zh-s-tashilaoshi') // 她是老师。
    const r = scoreSpeech(['他是老师'], she, 'zh')
    expect(r.score).toBe(1)
    expect(r.units.every((u) => u.ok)).toBe(true)
  })

  it('marks the missed parts', () => {
    const r = scoreSpeech(['我是学'], zh('zh-s-woshixuesheng'), 'zh')
    expect(r.score).toBeLessThan(1)
    expect(r.units.filter((u) => !u.ok).map((u) => u.text)).toEqual(['生'])
  })

  it('understands digits as numbers', () => {
    expect(spellNumbers('3', 'zh')).toBe('三')
    expect(spellNumbers('25', 'ja')).toBe('二十五')
    expect(spellNumbers('3', 'pt')).toBe('três')
    expect(scoreSpeech(['3'], pt('pt-tres'), 'pt').score).toBe(1)
  })

  it('accepts kana transcripts for kanji targets in Japanese', () => {
    const r = scoreSpeech(['わたしはがくせいです'], ja('ja-s-watashiwagakusei'), 'ja')
    expect(r.score).toBe(1)
  })

  it('scores Portuguese word by word, ignoring accents', () => {
    const r = scoreSpeech(['eu sou estudante'], pt('pt-s-eusouestudante'), 'pt')
    expect(r.score).toBe(1)
    const partial = scoreSpeech(['eu sou'], pt('pt-s-eusouestudante'), 'pt')
    expect(partial.units.map((u) => u.ok)).toEqual([true, true, false])
  })
})
