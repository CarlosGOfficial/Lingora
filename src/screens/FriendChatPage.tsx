import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Avatar, ChatPanel } from '../components/chat/ChatPanel'
import { Icon } from '../components/Icon'
import { NameTag } from '../components/NameTag'
import { StreakBadge } from '../components/StreakBadge'
import { ProfileLink } from '../components/ProfileLink'
import { onlineText, timeAgo } from '../lib/time'
import { GROUP_NAME_MAX, MAX_GROUP_MEMBERS, type GroupSummary } from '../social/chat'
import { useChat } from '../social/useChat'
import { useAppLinks } from '../social/apps'
import { refreshFriends, useFriends } from '../social/useFriends'
import { useStore } from '../store/useStore'
import { api } from '../sync/api'

/** A private chat with a friend — the same conversation as in Wordle Unlimited. */
export function FriendChatPage() {
  const { userId = '' } = useParams()
  const meId = useStore((s) => s.account?.id)
  const { data } = useFriends()
  const friend = data?.friends.find((f) => f.id === userId)
  const chat = useChat('dm', userId)

  if (!meId) return <Navigate to="/friends" replace />
  if (data && !friend) return <Navigate to="/friends" replace />

  return (
    <div className="chat-page">
      <header className="chat-head">
        <Link to="/friends" className="icon-btn" aria-label="Back to friends">
          <Icon name="back" />
        </Link>
        {friend && (
          <>
            <ProfileLink id={friend.id} label={`${friend.username}’s profile`}>
              <Avatar person={friend} online={friend.online} />
            </ProfileLink>
            <span className="grow person-text">
              <ProfileLink id={friend.id}>
                <NameTag name={friend.username} nameColor={friend.nameColor} title={friend.title} />
                <StreakBadge friendId={friend.id} />
              </ProfileLink>
              <span className={`small ${friend.online ? 'c-success' : 'muted'}`}>
                {friend.online ? onlineText(friend) : friend.lastSeen ? `Last online ${timeAgo(friend.lastSeen)}` : 'Offline'}
              </span>
            </span>
            <OpenInBanter path={`/chats/dm/${friend.id}`} />
          </>
        )}
      </header>
      <ChatPanel
        kind="dm"
        chat={chat}
        meId={meId}
        person={(id) => (id === friend?.id ? friend : undefined)}
        group={false}
        placeholder={friend ? `Message ${friend.username}…` : 'Message…'}
        emptyText={`Say hi to ${friend?.username ?? 'your friend'}! 👋`}
      />
    </div>
  )
}

/** A group chat (shared with Wordle Unlimited's group chats). */
export function GroupChatPage() {
  const { groupId = '' } = useParams()
  const navigate = useNavigate()
  const meId = useStore((s) => s.account?.id)
  const { groups } = useFriends()
  const group = groups?.find((g) => String(g.id) === groupId)
  const chat = useChat('group', groupId)
  const [showMembers, setShowMembers] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)

  if (!meId) return <Navigate to="/friends" replace />
  if (groups && !group) return <Navigate to="/friends" replace />

  const owner = group?.ownerId === meId
  const onlineCount = group?.members.filter((m) => m.online && m.id !== meId).length ?? 0
  const rename = async () => {
    const name = renaming?.trim()
    if (!group || !name) return
    try {
      await api.renameGroup(group.id, name)
      setRenaming(null)
      await refreshFriends()
    } catch (e) {
      chat.setError((e as Error).message)
    }
  }

  return (
    <div className="chat-page">
      <header className="chat-head">
        <Link to="/friends" className="icon-btn" aria-label="Back to friends">
          <Icon name="back" />
        </Link>
        {group &&
          (renaming !== null ? (
            <form
              className="row grow"
              onSubmit={(e) => {
                e.preventDefault()
                void rename()
              }}
            >
              <input autoFocus className="text-input grow" value={renaming} maxLength={GROUP_NAME_MAX} onChange={(e) => setRenaming(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setRenaming(null)} />
              <button className="btn btn-primary small" disabled={!renaming.trim()} aria-label="Save name">
                <Icon name="check" size={16} />
              </button>
              <button type="button" className="icon-btn small" onClick={() => setRenaming(null)} aria-label="Cancel">
                <Icon name="x" size={16} />
              </button>
            </form>
          ) : (
            <>
              <GroupAvatar group={group} meId={meId} />
              <span className="grow person-text">
                <span className="row tight">
                  <strong>{group.name}</strong>
                  {owner && (
                    <button className="icon-btn small" onClick={() => setRenaming(group.name)} aria-label="Rename group">
                      <Icon name="pencil" size={14} />
                    </button>
                  )}
                </span>
                <span className="small muted ellipsis">
                  {onlineCount > 0 && <span className="c-success">{onlineCount} online · </span>}
                  {group.members.map((m) => m.username).join(', ')}
                </span>
              </span>
              <OpenInBanter path={`/chats/group/${group.id}`} />
              <button className={`btn small ${showMembers ? 'btn-primary' : ''}`} onClick={() => setShowMembers(!showMembers)} aria-pressed={showMembers}>
                <Icon name="users" size={16} /> {group.members.length}
              </button>
            </>
          ))}
      </header>
      {group && showMembers && <Members group={group} meId={meId} onLeft={() => navigate('/friends')} onError={chat.setError} />}
      <ChatPanel
        kind="group"
        chat={chat}
        meId={meId}
        person={(id) => group?.members.find((m) => m.id === id)}
        group
        readers={group?.members}
        placeholder={group ? `Message ${group.name}…` : 'Message…'}
      />
    </div>
  )
}

export function GroupAvatar({ group, meId }: { group: GroupSummary; meId: string }) {
  const anyOnline = group.members.some((m) => m.online && m.id !== meId)
  return (
    <span className="group-avatar">
      {group.members.slice(0, 3).map((m) => (
        <Avatar key={m.id} person={m} size="xs" />
      ))}
      {anyOnline && <i className="presence on" />}
    </span>
  )
}

/** Tick friends to put in a group (new, or to add to an existing one). */
function FriendPicker({ exclude, picked, onToggle }: { exclude: Set<string>; picked: Set<string>; onToggle: (id: string) => void }) {
  const { data } = useFriends()
  const friends = (data?.friends ?? []).filter((f) => !exclude.has(f.id))
  if (data && !friends.length) return <p className="small muted">{data.friends.length ? 'All your friends are already in it.' : 'Add some friends first.'}</p>
  return (
    <div className="stack-sm">
      {friends.map((f) => (
        <button type="button" key={f.id} className={`pick-row ${picked.has(f.id) ? 'on' : ''}`} onClick={() => onToggle(f.id)} aria-pressed={picked.has(f.id)}>
          <span className="tick">{picked.has(f.id) && <Icon name="check" size={14} />}</span>
          <Avatar person={f} online={f.online} size="sm" />
          <NameTag name={f.username} nameColor={f.nameColor} title={f.title} />
        </button>
      ))}
    </div>
  )
}

function Members({ group, meId, onLeft, onError }: { group: GroupSummary; meId: string; onLeft: () => void; onError: (m: string) => void }) {
  const [adding, setAdding] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [confirmLeave, setConfirmLeave] = useState(false)
  const owner = group.ownerId === meId
  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn()
    } catch (e) {
      onError((e as Error).message)
    }
    await refreshFriends()
  }
  return (
    <div className="members-panel">
      {group.members.map((m) => (
        <div key={m.id} className="row">
          <Avatar person={m} online={m.online} size="sm" />
          <span className="grow person-text">
            <ProfileLink id={m.id}>
              <NameTag name={m.id === meId ? `${m.username} (you)` : m.username} nameColor={m.nameColor} title={m.title} />
            </ProfileLink>
            <span className="small">
              {m.id === group.ownerId && (
                <>
                  <span className="owner-tag">
                    <Icon name="crown" size={12} /> Owner
                  </span>{' '}
                  ·{' '}
                </>
              )}
              <span className={m.online ? 'c-success' : 'muted'}>{m.online ? 'Online' : 'Offline'}</span>
            </span>
          </span>
          {owner && m.id !== meId && (
            <button className="icon-btn small" aria-label={`Remove ${m.username}`} onClick={() => run(() => api.removeGroupMember(group.id, m.id))}>
              <Icon name="userMinus" size={16} />
            </button>
          )}
        </div>
      ))}
      {adding ? (
        <div className="stack-sm">
          <FriendPicker
            exclude={new Set(group.members.map((m) => m.id))}
            picked={picked}
            onToggle={(id) =>
              setPicked((s) => {
                const n = new Set(s)
                if (n.has(id)) n.delete(id)
                else n.add(id)
                return n
              })
            }
          />
          <div className="row">
            <button
              className="btn btn-primary small grow"
              disabled={!picked.size}
              onClick={async () => {
                for (const id of picked) await run(() => api.addGroupMember(group.id, id))
                setPicked(new Set())
                setAdding(false)
              }}
            >
              Add {picked.size || ''}
            </button>
            <button className="btn btn-ghost small" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="row">
          {group.members.length < MAX_GROUP_MEMBERS && (
            <button className="btn small grow" onClick={() => setAdding(true)}>
              <Icon name="userPlus" size={16} /> Add friends
            </button>
          )}
          {confirmLeave ? (
            <button className="btn btn-danger small" onBlur={() => setConfirmLeave(false)} autoFocus onClick={() => run(() => api.removeGroupMember(group.id, meId)).then(onLeft)}>
              Leave group?
            </button>
          ) : (
            <button className="btn btn-ghost small" onClick={() => setConfirmLeave(true)}>
              <Icon name="logout" size={16} /> Leave
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function NewGroupPage() {
  const navigate = useNavigate()
  const signedIn = useStore((s) => !!s.account)
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (!signedIn) return <Navigate to="/friends" replace />
  return (
    <form
      className="stack chat-page"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        try {
          const r = await api.createGroup(name.trim(), [...picked])
          await refreshFriends()
          navigate(`/friends/group/${r.id}`, { replace: true })
        } catch (err) {
          setError((err as Error).message)
          setBusy(false)
        }
      }}
    >
      <header className="chat-head">
        <Link to="/friends" className="icon-btn" aria-label="Back to friends">
          <Icon name="back" />
        </Link>
        <h2 className="grow">New group chat</h2>
      </header>
      <input autoFocus className="text-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={GROUP_NAME_MAX} placeholder="Group name" />
      <h3 className="small muted">Add friends ({picked.size})</h3>
      <FriendPicker
        exclude={new Set()}
        picked={picked}
        onToggle={(id) =>
          setPicked((s) => {
            const n = new Set(s)
            if (n.has(id)) n.delete(id)
            else if (n.size < MAX_GROUP_MEMBERS - 1) n.add(id)
            return n
          })
        }
      />
      {error && <p className="error small">{error}</p>}
      <button className="btn btn-primary" disabled={!name.trim() || !picked.size || busy}>
        Create group
      </button>
    </form>
  )
}

/** The same chat in Banter (voice calls, screen sharing and servers live there). */
function OpenInBanter({ path }: { path: string }) {
  const links = useAppLinks()
  if (!links?.banterUrl) return null
  return (
    <a className="btn btn-ghost small open-banter" href={`${links.banterUrl}${path}`} target="_blank" rel="noopener noreferrer" title="Open this chat in Banter, for voice calls and more">
      <Icon name="chat" size={16} /> <span className="hide-narrow">Open in Banter</span> <Icon name="external" size={13} />
    </a>
  )
}
