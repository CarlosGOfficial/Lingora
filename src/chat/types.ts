import type { LangCode } from '../content/types'

/** One line of the conversation as sent to the server (assistant lines are the target text). */
export interface ChatTurn {
  role: 'user' | 'assistant'
  text: string
}

export interface ChatScenario {
  id: string
  title: string
  goal: string
}

export interface ChatRequest {
  lang: LangCode
  level: string
  unit: string
  scenario: { title: string; goal: string }
  words: { target: string; reading?: string; meaning: string }[]
  grammar: string[]
  messages: ChatTurn[]
}

export interface ChatLine {
  target: string
  reading: string
  translation: string
}

export interface ChatReply {
  feedback: { verdict: 'none' | 'great' | 'ok' | 'fix'; corrected: string; note: string }
  reply: ChatLine
  suggestions: ChatLine[]
  goalMet: boolean
}
