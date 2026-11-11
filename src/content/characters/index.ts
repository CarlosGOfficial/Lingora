import { useEffect, useState } from 'react'

/*
 * Character data for the character explorer (scripts/build-characters.mjs; sources and
 * licences in LICENSES.md). Loaded on demand: each language's file is its own chunk.
 */

export type CharLang = 'zh' | 'ja'
export type CharInfo = {
  /** Kangxi radical number, and the form it takes in this character (讠 for 言). */
  r: number; rf: string
  s: number | null
  /** Chinese: pinyin. */
  py?: string | null
  /** Japanese: on and kun readings (KANJIDIC; "た.べる" marks the okurigana). */
  on?: string[]; kun?: string[]
  m: string | null
  jlpt?: number; g?: number
  /** Top-level parts. */
  p: string[]
}
export type CharData = { radicals: Record<string, { char: string; name: string }>; chars: Record<string, CharInfo> }

const cache: Partial<Record<CharLang, Promise<CharData>>> = {}
export function loadCharacters(lang: CharLang): Promise<CharData> {
  return (cache[lang] ??= (lang === 'zh' ? import('./zh.json') : import('./ja.json')).then((m) => (m as unknown as { default: CharData }).default))
}

export function useCharacters(lang: CharLang | null): CharData | null {
  const [data, setData] = useState<CharData | null>(null)
  useEffect(() => {
    setData(null)
    if (!lang) return
    let live = true
    void loadCharacters(lang).then((d) => live && setData(d))
    return () => { live = false }
  }, [lang])
  return data
}

export const HAN_RE = /[一-鿿]/
export const hanIn = (text: string) => [...new Set(Array.from(text).filter((c) => HAN_RE.test(c)))]
export const isCharLang = (l: string): l is CharLang => l === 'zh' || l === 'ja'
