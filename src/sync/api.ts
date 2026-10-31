import type { CustomTheme } from '../theme/themes'
import type { Account, LeaderboardRow, SavedTheme, Snapshot, SyncRequest } from './types'

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
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  sync: (body: SyncRequest) => request<Snapshot>('/sync', { body }),
  friends: (today: string) => request<LeaderboardRow[]>(`/friends?today=${today}`),
  addFriend: (username: string) => request<{ ok: boolean }>('/friends', { body: { username } }),
  removeFriend: (username: string) => request<{ ok: boolean }>(`/friends/${encodeURIComponent(username)}`, { method: 'DELETE' }),
  themes: () => request<SavedTheme[]>('/themes'),
  saveTheme: (name: string, theme: CustomTheme) => request<SavedTheme>('/themes', { body: { name, theme } }),
  updateTheme: (id: string, patch: { name?: string; theme?: CustomTheme }) => request<SavedTheme>(`/themes/${id}`, { method: 'PATCH', body: patch }),
  deleteTheme: (id: string) => request<{ ok: boolean }>(`/themes/${id}`, { method: 'DELETE' }),
}
