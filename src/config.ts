export const APP_NAME = 'Lingora'
export const STORAGE_KEY = 'lingora-v1'

export const DAILY_GOALS = [
  { xp: 10, label: 'Casual' },
  { xp: 20, label: 'Regular' },
  { xp: 30, label: 'Serious' },
  { xp: 50, label: 'Intense' },
] as const

/**
 * Duolingo-style XP: finishing a session pays a flat base, then bonuses for
 * answering correctly in a row (combo) and for a mistake-free run (perfect).
 */
export const XP = {
  lessonBase: 10,
  reviewBase: 10,
  practiceBase: 5,
  reading: 15,
  story: 20,
  perfectBonus: 5,
  /** +1 XP every time the combo reaches a multiple of this… */
  comboStep: 5,
  /** …up to this much per session. */
  comboMax: 5,
  /** Conversation practice: practiceBase, +1 per message you send (up to the max), +bonus for reaching the goal. */
  chatPerMessage: 1,
  chatMaxMessages: 10,
  chatGoalBonus: 5,
}

/** A streak freeze is earned every N streak days, up to MAX held at once. */
export const FREEZE_EVERY = 7
export const MAX_FREEZES = 2

/** Similarity (0..1) needed between speech transcript and target to pass… */
export const SPEAK_PASS_THRESHOLD = 0.7
/** …and to count as "close" (encouraging retry feedback). */
export const SPEAK_CLOSE_THRESHOLD = 0.45

export const REVIEW_SESSION_SIZE = 20
