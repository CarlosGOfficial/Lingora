import { useEffect } from 'react'
import { toast } from '../components/Toaster'
import { useStore } from '../store/useStore'
import { api } from '../sync/api'
import { inviteCode, messagePreview, partyCode, sharedClip } from './chat'
import { refreshFriends } from './useFriends'

const POLL_MS = 10_000

/**
 * While signed in, checks for new friend requests, messages and group messages and pops
 * a toast for each (like Wordle Unlimited's NotificationsWatcher). The server marks them
 * shown, so each appears once — here or in Wordle, whichever sees it first.
 */
export function NotificationsWatcher() {
  const signedIn = useStore((s) => !!s.account)

  useEffect(() => {
    if (!signedIn) return
    let live = true
    const check = async () => {
      if (document.visibilityState !== 'visible') return
      const n = await api.notifications().catch(() => null)
      if (!live || !n) return
      // Nothing to pop up for the chat you're already looking at.
      const open = location.pathname
      for (const r of n.friendRequests) {
        toast({ title: `👋 ${r.from} wants to be friends`, action: { label: 'View', to: '/friends' } })
      }
      for (const m of n.messages) {
        if (open === `/friends/chat/${m.fromId}`) continue
        const chat = `/friends/chat/${m.fromId}`
        toast(
          inviteCode(m.content) || partyCode(m.content)
            ? { title: `🎮 ${m.from} invited you to play`, description: 'Join from Wordle Unlimited.', action: { label: 'Open chat', to: chat } }
            : sharedClip(m.content)
              ? { title: `🎬 ${m.from} shared a clip`, description: sharedClip(m.content)!.title, action: { label: 'Open chat', to: chat } }
              : { title: `💬 ${m.from}`, description: messagePreview(m.content), action: { label: 'Reply', to: chat } },
        )
      }
      for (const g of n.groupMessages) {
        if (open === `/friends/group/${g.groupId}`) continue
        toast({
          title: `👥 ${g.group}`,
          description: `${g.from}: ${g.content}${g.count > 1 ? ` (+${g.count - 1} more)` : ''}`,
          action: { label: 'Open', to: `/friends/group/${g.groupId}` },
        })
      }
      if (n.friendRequests.length + n.messages.length + n.groupMessages.length) void refreshFriends()
    }
    void check()
    const t = setInterval(check, POLL_MS)
    return () => {
      live = false
      clearInterval(t)
    }
  }, [signedIn])

  return null
}
