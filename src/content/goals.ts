/*
 * Goals: daily quests, achievements (badges), weekly leagues and friend XP challenges.
 * Shared by the server (server/goals.ts), which works them out from synced progress,
 * and the Goals screen.
 */

/* ---------- Stats the server counts from your synced events ---------- */

export interface GoalStats {
  totalXp: number
  level: number
  bestStreak: number
  words: number // different items reviewed at least once
  reviews: number
  lessons: number
  readings: number
  stories: number
  langs: number
  leaguePromotions: number
  challengesWon: number
}

/* ---------- Daily quests ---------- */

export type QuestMetric = 'xp' | 'reviews' | 'good_reviews' | 'lessons' | 'readings' | 'stories' | 'speak'
export interface QuestDef { id: string; metric: QuestMetric; target: number; coins: number; text: string }
export const QUEST_POOL: QuestDef[] = [
  { id: 'xp30', metric: 'xp', target: 30, coins: 30, text: 'Earn 30 XP' },
  { id: 'xp60', metric: 'xp', target: 60, coins: 50, text: 'Earn 60 XP' },
  { id: 'rev20', metric: 'reviews', target: 20, coins: 35, text: 'Review 20 cards' },
  { id: 'good15', metric: 'good_reviews', target: 15, coins: 40, text: 'Remember 15 cards (Good or Easy)' },
  { id: 'lesson1', metric: 'lessons', target: 1, coins: 30, text: 'Finish a lesson' },
  { id: 'lesson2', metric: 'lessons', target: 2, coins: 45, text: 'Finish 2 lessons' },
  { id: 'read1', metric: 'readings', target: 1, coins: 35, text: 'Read a graded reader' },
  { id: 'story1', metric: 'stories', target: 1, coins: 40, text: 'Finish a story' },
  // Only offered to people who've used speaking before (see questsFor).
  { id: 'speak10', metric: 'speak', target: 10, coins: 40, text: 'Say 10 things right out loud' },
]
export const DAILY_QUEST_COUNT = 3
export type QuestView = QuestDef & { progress: number; claimed: boolean; day: string }

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}
/** Today's quests for someone: picked from the pool, the same on every device. The speaking
 * quest is only for people who spoke in the two weeks before today (so it's doable). */
export const questsFor = (userId: string, day: string, opts: { speaker?: boolean } = {}) =>
  QUEST_POOL.filter((q) => q.metric !== 'speak' || opts.speaker).sort((a, b) => hash(`${userId}:${day}:${a.id}`) - hash(`${userId}:${day}:${b.id}`)).slice(0, DAILY_QUEST_COUNT)

/* ---------- Achievements ---------- */

export interface AchievementDef { id: string; name: string; icon: string; description: string; coins: number; test: (s: GoalStats) => boolean }
const count = (id: string, name: string, icon: string, description: string, coins: number, test: (s: GoalStats) => boolean): AchievementDef => ({ id, name, icon, description, coins, test })
export const ACHIEVEMENTS: AchievementDef[] = [
  count('first_lesson', 'First Steps', '👣', 'Finish your first lesson.', 25, (s) => s.lessons >= 1),
  count('lessons_10', 'Getting Going', '📗', 'Finish 10 lessons.', 50, (s) => s.lessons >= 10),
  count('lessons_50', 'Dedicated', '📚', 'Finish 50 lessons.', 150, (s) => s.lessons >= 50),
  count('streak_7', 'One Week Strong', '🔥', 'Reach a 7-day streak.', 75, (s) => s.bestStreak >= 7),
  count('streak_30', 'Unstoppable', '🌋', 'Reach a 30-day streak.', 250, (s) => s.bestStreak >= 30),
  count('streak_100', 'Centurion', '💯', 'Reach a 100-day streak.', 750, (s) => s.bestStreak >= 100),
  count('words_100', 'Word Collector', '🧺', 'Learn 100 words and phrases.', 100, (s) => s.words >= 100),
  count('words_500', 'Walking Dictionary', '📖', 'Learn 500 words and phrases.', 300, (s) => s.words >= 500),
  count('reviews_500', 'Spaced Out', '🧠', 'Do 500 reviews.', 150, (s) => s.reviews >= 500),
  count('reviews_2000', 'Memory Palace', '🏛️', 'Do 2,000 reviews.', 400, (s) => s.reviews >= 2000),
  count('reader_1', 'Bookworm', '🐛', 'Finish a graded reader.', 40, (s) => s.readings >= 1),
  count('story_1', 'Storyteller', '🎭', 'Finish a story.', 40, (s) => s.stories >= 1),
  count('story_10', 'Page Turner', '📜', 'Finish 10 stories.', 200, (s) => s.stories >= 10),
  count('level_10', 'Double Digits', '🔟', 'Reach level 10.', 100, (s) => s.level >= 10),
  count('level_25', 'Seasoned', '🎖️', 'Reach level 25.', 300, (s) => s.level >= 25),
  count('polyglot', 'Polyglot', '🌏', 'Study all three languages.', 150, (s) => s.langs >= 3),
  count('promoted', 'Moving Up', '⬆️', 'Get promoted in a weekly league.', 75, (s) => s.leaguePromotions >= 1),
  count('challenger', 'Challenger', '⚔️', 'Win an XP challenge against a friend.', 75, (s) => s.challengesWon >= 1),
]
export type AchievementView = Omit<AchievementDef, 'test'> & { unlockedAt: string | null }

/* ---------- Leagues ---------- */

export const DIVISIONS = ['Bronze', 'Silver', 'Gold', 'Sapphire', 'Ruby', 'Emerald', 'Amethyst', 'Diamond'] as const
export const DIVISION_ICONS = ['🥉', '🥈', '🥇', '💙', '❤️', '💚', '💜', '💎']
export const LEAGUE_SIZE = 20
export const LEAGUE_MOVES = 5 // top 5 move up, bottom 5 down
export const LEAGUE_PRIZES = [150, 100, 60] // coins for 1st, 2nd, 3rd
export interface LeagueRow { userId: string; name: string; avatar: string | null; xp: number; friend: boolean; me: boolean }
export interface LeagueView {
  week: string // Monday (YYYY-MM-DD)
  division: number
  rows: LeagueRow[]
  endsAt: string
  last: { division: number; place: number; moved: 'up' | 'down' | 'stay'; coins: number } | null
}

/* ---------- XP challenges ---------- */

export const CHALLENGE_HOURS = [24, 72, 168] as const
export const CHALLENGE_PRIZE = 100
export interface ChallengeView {
  id: number
  from: { id: string; name: string }
  to: { id: string; name: string }
  hours: number
  status: 'pending' | 'active' | 'done' | 'declined'
  startedAt: string | null
  endsAt: string | null
  fromXp: number
  toXp: number
  winner: string | null
  mine: boolean // you sent it
}

export interface GoalsView {
  quests: QuestView[]
  achievements: AchievementView[]
  league: LeagueView | null
  challenges: ChallengeView[]
  stats: GoalStats
}
