import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

/*
 * Chat formatting, the same as Banter's: **bold**, *italic*, __underline__, ~~strike~~,
 * `code`, ```code blocks```, ||spoilers||, > quotes, links and @mentions. Text only ever
 * becomes React elements (never HTML), so nothing typed can inject markup.
 */

const URL_RE = /https?:\/\/[^\s<>()]+[^\s<>().,!?;:'"]/

type Ctx = { me: string | null; go: (path: string) => void; banter?: string }
type Rule = { re: RegExp; render: (m: RegExpExecArray, key: number, ctx: Ctx) => ReactNode }

/** A link to Lingora itself: its path, so it opens here instead of in a new tab. */
function sameSite(href: string): string | null {
  try {
    const u = new URL(href)
    return u.origin === location.origin ? u.pathname + u.search + u.hash : null
  } catch {
    return null
  }
}

function Spoiler({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(false)
  return (
    <span className={`spoiler ${shown ? 'shown' : ''}`} onClick={() => setShown(true)} title={shown ? undefined : 'Spoiler: tap to show'}>
      {children}
    </span>
  )
}

/** A Banter custom emoji (<:name:id>), its picture from Banter; just :name: if it can't load. */
function CustomEmoji({ name, image, banter }: { name: string; image: string; banter?: string }) {
  const [broken, setBroken] = useState(false)
  if (!banter || broken) return <span title={`:${name}:`}>:{name}:</span>
  return <img className="custom-emoji" src={`${banter}/api/emoji-images/${image}`} alt={`:${name}:`} title={`:${name}:`} draggable={false} onError={() => setBroken(true)} />
}

const RULES: Rule[] = [
  { re: /<:([a-z0-9_]{2,32}):([0-9a-f-]{36})>/, render: (m, k, c) => <CustomEmoji key={k} name={m[1]} image={m[2]} banter={c.banter} /> },
  { re: /`([^`\n]+)`/, render: (m, k) => <code key={k} className="inline-code">{m[1]}</code> },
  { re: /\|\|(.+?)\|\|/, render: (m, k, c) => <Spoiler key={k}>{inline(m[1], c)}</Spoiler> },
  { re: /\*\*(.+?)\*\*/, render: (m, k, c) => <strong key={k}>{inline(m[1], c)}</strong> },
  { re: /__(.+?)__/, render: (m, k, c) => <u key={k}>{inline(m[1], c)}</u> },
  { re: /~~(.+?)~~/, render: (m, k, c) => <s key={k}>{inline(m[1], c)}</s> },
  { re: /(?:\*([^*\s][^*]*?)\*|\b_([^_\s][^_]*?)_\b)/, render: (m, k, c) => <em key={k}>{inline(m[1] ?? m[2], c)}</em> },
  {
    re: URL_RE,
    render: (m, k, c) => {
      const inApp = sameSite(m[0])
      return (
        <a key={k} href={m[0]} target={inApp ? undefined : '_blank'} rel="noopener noreferrer nofollow"
          onClick={inApp ? (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); c.go(inApp) } : undefined}>
          {m[0]}
        </a>
      )
    },
  },
  {
    re: /(^|[^A-Za-z0-9_])@([A-Za-z0-9_]{3,20}|everyone|here)\b/,
    render: (m, k, c) => (
      <span key={k}>
        {m[1]}
        <span className={`mention ${c.me && m[2].toLowerCase() === c.me.toLowerCase() ? 'me' : ''}`}
          onClick={() => !['everyone', 'here'].includes(m[2]) && c.go(`/u/${m[2]}`)}>@{m[2]}</span>
      </span>
    ),
  },
]

function inline(text: string, ctx: Ctx): ReactNode[] {
  const out: ReactNode[] = []
  let rest = text
  let key = 0
  while (rest) {
    let best: { m: RegExpExecArray; rule: Rule } | null = null
    for (const rule of RULES) {
      const m = rule.re.exec(rest)
      if (m && (!best || m.index < best.m.index)) best = { m, rule }
    }
    if (!best) {
      out.push(rest)
      break
    }
    if (best.m.index > 0) out.push(rest.slice(0, best.m.index))
    out.push(best.rule.render(best.m, key++, ctx))
    rest = rest.slice(best.m.index + best.m[0].length)
  }
  return out
}

export function Formatted({ text, me, banter }: { text: string; me: string | null; banter?: string }) {
  const go = useNavigate()
  const ctx: Ctx = { me, go: (p) => go(p), banter: banter?.replace(/\/+$/, '') }
  const blocks: ReactNode[] = []
  // Code blocks first; everything else line by line (so quotes work).
  const parts = text.split(/```(?:[a-z0-9]*\n)?([\s\S]*?)```/)
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      blocks.push(<pre key={`c${i}`} className="code-block">{part}</pre>)
      return
    }
    const lines = part.split('\n')
    lines.forEach((line, j) => {
      const quote = /^>\s?(.*)$/.exec(line)
      blocks.push(
        quote ? <span key={`${i}-${j}`} className="quote-line">{inline(quote[1], ctx)}</span>
          : <span key={`${i}-${j}`}>{inline(line, ctx)}{j < lines.length - 1 && <br />}</span>,
      )
    })
  })
  return <>{blocks}</>
}

/** True when `text` @mentions this username (or @everyone / @here). */
export function mentions(text: string, username: string | null) {
  return new RegExp(`(^|[^A-Za-z0-9_])@(${username ? `${username}|` : ''}everyone|here)\\b`, 'i').test(text)
}
