export type LangCode = 'zh' | 'ja' | 'pt'

export interface Item {
  id: string
  kind: 'word' | 'sentence'
  /** Text in the target script (hanzi / kanji+kana / Portuguese). */
  target: string
  /** Pinyin (zh) or kana (ja) when it differs from target. */
  reading?: string
  /** Latin transcription accepted when typing (romaji for ja). */
  romanization?: string
  meaning: string
  /** Other accepted English meanings (used for display / future meaning-typing). */
  meaningAlt?: string[]
  /** Other accepted target-language answers (e.g. obrigado/obrigada). */
  alt?: string[]
  /** Word tiles for sentence-building (sentences only). */
  tokens?: string[]
  note?: string
}

export interface GrammarExample {
  target: string
  reading?: string
  romanization?: string
  meaning: string
}

export interface GrammarPoint {
  title: string
  /** Sentence pattern, e.g. "Subject + 是 + Noun". */
  pattern?: string
  explanation: string
  examples: GrammarExample[]
}

export interface Lesson {
  id: string
  title: string
  /** Can-do goal for this lesson. */
  goal: string
  items: Item[]
  sentences: Item[]
}

export interface ReadingQuestion {
  q: string
  options: string[]
  answer: number
}

export interface Reading {
  id: string
  title: string
  sentences: Item[]
  questions: ReadingQuestion[]
}

export interface Unit {
  id: string
  title: string
  /** Level within the course standard, e.g. "HSK 1", "N5", "A1". */
  level: string
  canDo: string[]
  lessons: Lesson[]
  reading?: Reading
}

export interface Course {
  lang: LangCode
  name: string
  nativeName: string
  /** Short glyph used as the course badge. */
  badge: string
  standard: string
  standardFull: string
  /** BCP-47 tag for TTS, speech recognition and the `lang` attribute (font selection). */
  bcp47: string
  readingLabel?: string
  typingHint: string
  units: Unit[]
}
