import type { LangCode, ReadingQuestion } from '../types'

export interface StoryLine {
  speaker: string
  target: string
  /** Kana (ja) or pinyin (zh) for the whole line, when it has characters. */
  reading?: string
  meaning: string
}
export interface StoryScene { lines: StoryLine[]; question: ReadingQuestion }
export interface Story {
  id: string // "story:<lang>-<slug>"
  lang: LangCode
  emoji: string
  title: string
  titleMeaning: string
  level: string
  scenes: StoryScene[]
  /** Words you can tap for a translation (longest match wins). */
  glossary: Record<string, string>
}
