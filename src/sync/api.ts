export type SpeechStats = { attempts: number; avg: number; passed: number; tricky: { itemId: string; lang: string; attempts: number; avg: number; best: number; last: number; close: boolean }[] }
import type { Crew } from '../screens/CrewPage'
import type { Recap } from '../components/RecapStory'
import type { DeckDetail, DeckSummary, MyDeck } from '../social/decks'
import type { TrophyCaseData } from '../components/TrophyCase'
import type { ChatReply, ChatRequest } from '../chat/types'
import type { CustomTheme } from '../theme/themes'
import type { LangCode } from '../content/types'
import type { ChatBody, ChatKind, ChatMessage, GifResult, GroupSummary } from '../social/chat'
import type { Notifications, PublicProfile } from '../social/profile'
import type { GoalsView } from '../content/goals'
import { dayKey as localDay } from '../lib/date'
import type { Account, FriendsData, SavedTheme, Snapshot, SyncRequest } from './types'

const chatPath = (kind: ChatKind, id: string) => (kind === 'dm' ? `/dm/${encodeURIComponent(id)}` : `/groups/${encodeURIComponent(id)}/messages`)

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

async function request<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method: init?.method ?? (init?.body ? 'POST' : 'GET'),
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiError('Can’t reach the sync server.', 0)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? `Request failed (${res.status})`, res.status)
  return data as T
}

export const api = {
  health: () => request<{ ok: boolean; db: boolean }>('/health'),
  me: () => request<Account>('/me'),
  signup: (body: { username: string; password: string }) => request<Account>('/auth/signup', { body }),
  login: (body: { username: string; password: string }) => request<Account>('/auth/login', { body }),
  loginPin: (pin: string) => request<Account>('/auth/login-pin', { body: { pin } }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  sync: (body: SyncRequest) => request<Snapshot>('/sync', { body }),
  goals: () => request<GoalsView>(`/goals?day=${localDay()}&tz=${new Date().getTimezoneOffset()}`),
  claimQuest: (questId: string) => request<{ coins: number }>('/goals/quests/claim', { body: { day: localDay(), tz: new Date().getTimezoneOffset(), questId } }),
  challenge: (to: string, hours: number) => request<{ id: number }>('/challenges', { body: { to, hours } }),
  answerChallenge: (id: number, action: 'accept' | 'decline') => request<{ ok: true }>(`/challenges/${id}/${action}`, { method: 'POST' }),
  resetProgress: (lang?: LangCode) => request<{ ok: boolean }>('/progress/reset', { body: lang ? { lang } : {}, method: 'POST' }),
  presence: (detail?: { lang: string; doing: string }) => request<{ ok: boolean }>('/presence', { method: 'POST', body: detail ?? {} }),
  friends: (today: string) => request<FriendsData>(`/friends?today=${today}`),
  requestFriend: (username: string) => request<{ status: 'pending' | 'accepted'; name: string }>('/friends/request', { body: { username } }),
  respondRequest: (requestId: number, action: 'accept' | 'decline' | 'cancel') =>
    request<{ ok: boolean }>(`/friends/requests/${requestId}/${action}`, { method: 'POST' }),
  // Live duels (server/duels.ts).
  duels: () => request<any>('/duels'),
  duel: (id: number) => request<any>(`/duels/${id}`),
  duelLadder: (lang: LangCode) => request<any[]>(`/duels/ladder/${lang}`),
  challengeDuel: (friendId: string, lang: LangCode, tier: string) => request<{ id: number }>('/duels', { body: { friendId, lang, tier } }),
  acceptDuel: (id: number) => request<any>(`/duels/${id}/accept`, { method: 'POST' }),
  declineDuel: (id: number) => request<{ ok: true }>(`/duels/${id}/decline`, { method: 'POST' }),
  duelQueue: (lang: LangCode) => request<{ id?: number; waiting?: true }>('/duels/queue', { body: { lang } }),
  leaveDuelQueue: () => request<{ ok: true }>('/duels/queue', { method: 'DELETE' }),
  answerDuel: (id: number, index: number, optionId: string) => request<{ correct: boolean; answer: string; view: any }>(`/duels/${id}/answer`, { body: { index, optionId } }),
  // Study rooms (server/study.ts).
  studyRooms: () => request<any>('/study'),
  decks: (q: { lang?: string; q?: string; sort?: string }) => request<DeckSummary[]>(`/decks?${new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][])}`),
  myDecks: () => request<MyDeck[]>('/decks/mine'),
  crew: () => request<Crew | null>('/crew'),
  recap: (period: string) => request<Recap>(`/recap/${period}`),
  crewWars: (on: boolean) => request<Crew>('/crew/wars', { method: 'PUT', body: { on } }),
  crewStudy: () => request<{ id: number }>('/crew/study', { method: 'POST' }),
  speech: (scores: { id: string; itemId: string; lang: string; score: number; at: number }[]) => request<{ saved: number }>('/speech', { body: { scores } }),
  speechStats: (lang?: string) => request<SpeechStats>(`/speech${lang ? `?lang=${lang}` : ''}`),
  deck: (id: number, code?: string | null) => request<DeckDetail>(`/decks/${id}${code ? `?code=${encodeURIComponent(code)}` : ''}`),
  createDeck: (body: unknown) => request<DeckDetail>('/decks', { body }),
  saveDeck: (id: number, body: unknown) => request<DeckDetail>(`/decks/${id}`, { method: 'PUT', body }),
  deleteDeck: (id: number) => request<{ ok: true }>(`/decks/${id}`, { method: 'DELETE' }),
  subscribeDeck: (id: number, code?: string | null) => request<DeckDetail>(`/decks/${id}/subscribe`, { body: { code: code ?? undefined } }),
  unsubscribeDeck: (id: number) => request<{ ok: true }>(`/decks/${id}/subscribe`, { method: 'DELETE' }),
  rateDeck: (id: number, stars: number) => request<DeckDetail>(`/decks/${id}/rate`, { body: { stars } }),
  reportDeck: (id: number, reason: string, note: string) => request<{ ok: true }>(`/decks/${id}/report`, { body: { reason, note } }),
  hideDeck: (id: number, hidden: boolean) => request<{ ok: true }>(`/decks/${id}/hide`, { body: { hidden } }),
  studyRoom: (id: number) => request<any>(`/study/${id}`),
  createStudy: (name: string, focus: number, rest: number) => request<{ id: number; code: string }>('/study', { body: { name, focus, rest } }),
  joinStudy: (code: string) => request<{ id: number }>(`/study/join/${encodeURIComponent(code)}`, { method: 'POST' }),
  studyTimer: (id: number, action: 'start' | 'stop', focus?: number, rest?: number) => request<any>(`/study/${id}/timer`, { body: { action, focus, rest } }),
  inviteStudy: (id: number, friendId: string) => request<{ ok: true }>(`/study/${id}/invite`, { body: { friendId } }),
  leaveStudy: (id: number) => request<{ ok: true }>(`/study/${id}/leave`, { method: 'POST' }),
  season: () => request<any>('/season'),
  trophies: (userId: string) => request<TrophyCaseData>(`/trophies/${encodeURIComponent(userId)}`),
  pinTrophies: (ids: string[]) => request<{ pinned: string[] }>('/trophies/pins', { method: 'PUT', body: { ids } }),
  claimSeason: (tier: number, track: 'free' | 'premium') => request<any>('/season/claim', { body: { tier, track } }),
  buySeasonPremium: () => request<{ ok: true }>('/season/premium', { method: 'POST' }),
  crossEvents: () => request<any[]>('/cross-events'),
  claimCrossEvent: (id: number) => request<{ coins: number; item: string | null }>(`/cross-events/${id}/claim`, { method: 'POST' }),
  hubInbox: () => request<{ items: any[]; unread: number }>('/hub/inbox'),
  hubRead: (ids?: number[]) => request<{ ok: boolean }>('/hub/read', { body: ids ? { ids } : {} }),
  hubFeed: () => request<any[]>('/hub/feed'),
  hubSharing: () => request<{ hidden: string[] }>('/hub/sharing'),
  hubSetSharing: (hidden: string[]) => request<{ hidden: string[] }>('/hub/sharing', { method: 'PUT', body: { hidden } }),
  report: (body: { kind: string; userId?: string; messageId?: number; reason: string; note?: string }) => request<{ ok: boolean }>('/reports', { body }),
  block: (userId: string) => request<{ ok: boolean }>(`/blocks/${encodeURIComponent(userId)}`, { method: 'PUT' }),
  unblock: (userId: string) => request<{ ok: boolean }>(`/blocks/${encodeURIComponent(userId)}`, { method: 'DELETE' }),
  removeFriend: (userId: string) => request<{ ok: boolean }>(`/friends/${encodeURIComponent(userId)}`, { method: 'DELETE' }),
  // Chats: kind "dm" (id = their user id) or "group" (id = group id).
  messages: (kind: ChatKind, id: string) => request<ChatMessage[]>(chatPath(kind, id)),
  sendMessage: (kind: ChatKind, id: string, body: ChatBody) => request<ChatMessage>(chatPath(kind, id), { body }),
  react: (kind: ChatKind, messageId: number, emoji: string) => request<{ reacted: boolean }>(`/messages/${kind}/${messageId}/reactions`, { body: { emoji } }),
  editMessage: (kind: ChatKind, messageId: number, content: string) => request<{ ok: boolean }>(`/messages/${kind}/${messageId}`, { method: 'PATCH', body: { content } }),
  deleteMessage: (kind: ChatKind, messageId: number) => request<{ ok: boolean }>(`/messages/${kind}/${messageId}`, { method: 'DELETE' }),
  profile: (key: string, today: string) => request<PublicProfile>(`/profiles/${encodeURIComponent(key)}?today=${today}`),
  saveBio: (bio: string) => request<{ ok: boolean }>('/profile', { method: 'PATCH', body: { bio } }),
  notifications: () => request<Notifications>('/notifications'),
  groups: () => request<GroupSummary[]>('/groups'),
  createGroup: (name: string, memberIds: string[]) => request<{ id: number; skipped: number }>('/groups', { body: { name, memberIds } }),
  renameGroup: (id: number, name: string) => request<{ ok: boolean }>(`/groups/${id}`, { method: 'PATCH', body: { name } }),
  addGroupMember: (id: number, userId: string) => request<{ ok: boolean }>(`/groups/${id}/members`, { body: { userId } }),
  removeGroupMember: (id: number, userId: string) => request<{ ok: boolean }>(`/groups/${id}/members/${encodeURIComponent(userId)}`, { method: 'DELETE' }),
  gifs: (q: string) => request<{ enabled: boolean; results: GifResult[] }>(`/gifs?q=${encodeURIComponent(q)}`),
  gifFavorites: () => request<{ id: string }[]>('/gifs/favorites'),
  setGifFavorite: (id: string, favorite: boolean) => request<{ favorite: boolean }>('/gifs/favorites', { body: { id, favorite } }),
  themes: () => request<SavedTheme[]>('/themes'),
  saveTheme: (name: string, theme: CustomTheme) => request<SavedTheme>('/themes', { body: { name, theme } }),
  updateTheme: (id: string, patch: { name?: string; theme?: CustomTheme }) => request<SavedTheme>(`/themes/${id}`, { method: 'PATCH', body: patch }),
  deleteTheme: (id: string) => request<{ ok: boolean }>(`/themes/${id}`, { method: 'DELETE' }),
  chatStatus: () => request<{ enabled: boolean }>('/chat/status'),
  chat: (body: ChatRequest) => request<ChatReply>('/chat', { body }),
}
