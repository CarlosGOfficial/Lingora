import type { LangCode } from '../types'
import { JA_STORIES } from './ja'
import { PT_STORIES } from './pt'
import type { Story } from './types'
import { ZH_STORIES } from './zh'

export type { Story, StoryLine, StoryScene } from './types'
export const STORIES: Record<LangCode, Story[]> = { ja: JA_STORIES, zh: ZH_STORIES, pt: PT_STORIES }
export const findStory = (id: string): Story | undefined => Object.values(STORIES).flat().find((s) => s.id === id)
