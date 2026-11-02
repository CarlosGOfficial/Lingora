import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../sync/api'
import type { ChatBody, ChatKind, ChatMessage } from './chat'
import { refreshFriends } from './useFriends'

const POLL_MS = 3_000

/**
 * One conversation (a friend's DM or a group): polls for new messages while open and
 * offers send / react / edit / delete. Reactions show straight away; the next poll confirms.
 */
export function useChat(kind: ChatKind, id: string) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const live = useRef(true)

  const load = useCallback(async () => {
    try {
      const m = await api.messages(kind, id)
      if (live.current) {
        setMessages(m)
        setError('')
      }
    } catch (e) {
      if (live.current) setError((e as Error).message)
    }
  }, [kind, id])

  useEffect(() => {
    live.current = true
    setMessages(null)
    void load().then(refreshFriends) // reading clears the unread badge
    const t = setInterval(() => document.visibilityState === 'visible' && void load(), POLL_MS)
    return () => {
      live.current = false
      clearInterval(t)
    }
  }, [load])

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn()
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
    await load()
  }

  return {
    messages,
    error,
    setError,
    sending,
    async send(body: ChatBody): Promise<boolean> {
      setSending(true)
      try {
        const m = await api.sendMessage(kind, id, body)
        setMessages((old) => [...(old ?? []), m])
        setError('')
        return true
      } catch (e) {
        setError((e as Error).message)
        return false
      } finally {
        setSending(false)
      }
    },
    react(messageId: number, emoji: string) {
      setMessages((old) =>
        old?.map((m) => {
          if (m.id !== messageId) return m
          const had = m.reactions.find((r) => r.emoji === emoji)
          const reactions = had?.mine
            ? m.reactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, mine: false } : r)).filter((r) => r.count > 0)
            : had
              ? m.reactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r))
              : [...m.reactions, { emoji, count: 1, mine: true, userIds: [] }]
          return { ...m, reactions }
        }) ?? old,
      )
      return run(() => api.react(kind, messageId, emoji))
    },
    edit: (messageId: number, content: string) => run(() => api.editMessage(kind, messageId, content)),
    remove: (messageId: number) => run(() => api.deleteMessage(kind, messageId)),
  }
}

export type Chat = ReturnType<typeof useChat>

/** Your starred GIPHY GIFs, with a toggle that shows the change straight away. */
export function useGifFavorites() {
  const [favorites, setFavorites] = useState<{ id: string }[]>([])
  useEffect(() => {
    api.gifFavorites().then(setFavorites, () => {})
  }, [])
  const ids = new Set(favorites.map((f) => f.id))
  return {
    favorites,
    isFavorite: (id: string) => ids.has(id),
    async toggle(id: string) {
      const favorite = !ids.has(id)
      const before = favorites
      setFavorites(favorite ? [{ id }, ...favorites.filter((f) => f.id !== id)] : favorites.filter((f) => f.id !== id))
      try {
        await api.setGifFavorite(id, favorite)
      } catch {
        setFavorites(before)
      }
    },
  }
}
