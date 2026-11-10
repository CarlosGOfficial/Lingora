import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CompleteScreen } from '../components/CompleteScreen'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { SessionRunner, type SessionSummary } from '../components/SessionRunner'
import { COURSES, allItems } from '../content'
import type { LangCode } from '../content/types'
import { buildDeckLearn } from '../engine/exercises'
import { sessionXp, type XpBreakdown } from '../engine/xp'
import { DECK_CARD_FIELDS, DECK_LIMITS, deckItem, type DeckCard, type DeckDetail, type DeckSummary } from '../social/decks'
import { useStore } from '../store/useStore'
import { api } from '../sync/api'
import { refreshDecks } from '../sync/sync'

/*
 * Community decks (server/decks.ts): browse and follow decks, make your own, and learn
 * their cards. Learned cards are ordinary review cards from then on.
 */

const LANGS: LangCode[] = ['zh', 'ja', 'pt']
const LEARN_BATCH = 8
const stars = (r: number | null) => (r == null ? '' : `★ ${r.toFixed(1)}`)

function DeckRow({ d }: { d: DeckSummary }) {
  return (
    <Link to={`/decks/${d.id}`} className="deck-row" data-testid="deck-row">
      <span className={`lang-badge small lang-${d.lang}`}>{COURSES[d.lang].badge}</span>
      <span className="grow person-text">
        <strong>{d.title}</strong>
        <span className="small muted">
          {d.cardCount} cards · {d.subscribers} following{d.rating != null && ` · ${stars(d.rating)}`} · by {d.mine ? 'you' : d.owner.name}
          {!d.public && ' · private'}{d.hidden && ' · taken down'}
        </span>
      </span>
      {d.subscribed && <span className="pill">Following</span>}
    </Link>
  )
}

export function DecksPage() {
  const { account, activeLang, decks } = useStore()
  const [lang, setLang] = useState<LangCode | ''>(activeLang)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'top' | 'new'>('top')
  const [list, setList] = useState<DeckSummary[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let live = true
    const t = setTimeout(() => api.decks({ lang, q, sort }).then((r) => live && setList(r), (e) => live && setError(e.message)), 200)
    return () => { live = false; clearTimeout(t) }
  }, [lang, q, sort])
  useEffect(() => { void refreshDecks() }, [])
  const mine = decks.filter((d) => d.mine), following = decks.filter((d) => !d.mine && d.subscribed)
  return (
    <div className="stack" data-testid="decks-page">
      <PageHeader icon="layers" title="Community decks" subtitle="Flashcard decks made by learners. Follow one to learn its cards; they join your reviews."
        right={account && <Link to="/decks/new" className="btn btn-primary small" data-testid="deck-new"><Icon name="plus" size={16} /> New deck</Link>} />
      {error && <div className="cta-card calm" role="alert">{error}</div>}
      {!!(mine.length || following.length) && (
        <section className="stack-sm">
          <h3>Yours</h3>
          <div className="deck-list">{[...mine, ...following].map((d) => <DeckRow key={d.id} d={{ ...d, cardCount: d.cards.length }} />)}</div>
        </section>
      )}
      <section className="stack-sm">
        <div className="row wrap">
          <h3 className="grow">Browse</h3>
          <div className="seg" role="radiogroup" aria-label="Language">
            <button role="radio" aria-checked={lang === ''} className={lang === '' ? 'active' : ''} onClick={() => setLang('')}>All</button>
            {LANGS.map((l) => <button key={l} role="radio" aria-checked={lang === l} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>{COURSES[l].name}</button>)}
          </div>
          <div className="seg" role="radiogroup" aria-label="Sort">
            {(['top', 'new'] as const).map((s) => <button key={s} role="radio" aria-checked={sort === s} className={sort === s ? 'active' : ''} onClick={() => setSort(s)}>{s === 'top' ? 'Top' : 'New'}</button>)}
          </div>
        </div>
        <input className="text-input" placeholder="Search decks, e.g. food, JLPT, travel" value={q} onChange={(e) => setQ(e.target.value)} data-testid="deck-search" />
        {list === null ? <p className="muted">Loading…</p> : list.length === 0 ? <p className="muted small">No decks yet{lang ? ` for ${COURSES[lang].name}` : ''}. Make the first one!</p> : (
          <div className="deck-list">{list.map((d) => <DeckRow key={d.id} d={d} />)}</div>
        )}
      </section>
    </div>
  )
}

export function DeckPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const code = params.get('code')
  const navigate = useNavigate()
  const { account, progress, decks } = useStore()
  const [d, setD] = useState<DeckDetail | null>(null)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [reporting, setReporting] = useState(false)
  const load = () => api.deck(Number(id), code).then(setD, (e) => setError(e.message))
  useEffect(() => { void load() }, [id, code])
  if (error) return <div className="stack"><div className="cta-card calm">{error}</div><Link to="/decks" className="btn">Community decks</Link></div>
  if (!d) return <div className="stack"><p className="muted">Loading…</p></div>
  const learned = d.cards.filter((c) => progress[d.lang].cards[deckItem(d, c).id]).length
  const fresh = d.cards.length - learned
  const run = (p: Promise<unknown>, then?: () => void) => p.then(async () => { await refreshDecks(); await load(); then?.() }, (e) => setNote(e.message))
  const isAdmin = !!account?.isAdmin
  const share = () => {
    const url = `${location.origin}/decks/${d.id}${d.public ? '' : `?code=${d.shareCode}`}`
    navigator.clipboard?.writeText(url).then(() => setNote('Link copied.'), () => setNote(url))
  }
  const following = d.subscribed || d.mine
  void decks
  return (
    <div className="stack" data-testid="deck-page">
      <div className="row"><Link to="/decks" className="btn small btn-ghost"><Icon name="back" size={16} /> Community decks</Link></div>
      <header className="deck-head">
        <span className={`lang-badge lang-${d.lang}`}>{COURSES[d.lang].badge}</span>
        <div className="grow person-text">
          <h2>{d.title}</h2>
          <span className="small muted">by {d.mine ? 'you' : <Link to={`/u/${d.owner.id}`}>{d.owner.name}</Link>} · {d.cardCount} cards · {d.subscribers} following{d.rating != null && ` · ${stars(d.rating)} (${d.ratings})`}{!d.public && ' · private'}</span>
          {d.description && <p className="small">{d.description}</p>}
          {d.hidden && <p className="small error">An admin took this deck down; only you and its followers can see it.</p>}
        </div>
      </header>
      <div className="row wrap">
        {following && account && (fresh > 0
          ? <Link to={`/decks/${d.id}/learn`} className="btn btn-primary" data-testid="deck-learn"><Icon name="book" size={16} /> Learn {Math.min(fresh, LEARN_BATCH)} new</Link>
          : <Link to="/review" className="btn btn-primary"><Icon name="layers" size={16} /> All learned: review</Link>)}
        {!d.mine && account && (d.subscribed
          ? <button className="btn" onClick={() => run(api.unsubscribeDeck(d.id))} data-testid="deck-unfollow">Unfollow</button>
          : <button className="btn btn-primary" onClick={() => run(api.subscribeDeck(d.id, code))} data-testid="deck-follow"><Icon name="plus" size={16} /> Follow</button>)}
        {d.mine && <Link to={`/decks/${d.id}/edit`} className="btn" data-testid="deck-edit"><Icon name="pencil" size={16} /> Edit</Link>}
        {d.mine && <button className="btn" onClick={share} data-testid="deck-share"><Icon name="copy" size={16} /> Share link</button>}
        {!d.mine && account && <button className="btn btn-ghost small" onClick={() => setReporting(!reporting)}><Icon name="flag" size={16} /> Report</button>}
        {isAdmin && d.public && <button className="btn btn-ghost small" onClick={() => run(api.hideDeck(d.id, !d.hidden))}>{d.hidden ? 'Put back up' : 'Take down (admin)'}</button>}
        {d.mine && <button className="btn btn-ghost small" onClick={() => window.confirm(`Delete “${d.title}”? Followers lose it too (their review history stays).`) && run(api.deleteDeck(d.id), () => navigate('/decks'))}>Delete</button>}
      </div>
      {note && <p className="small muted" role="status">{note}</p>}
      {reporting && <ReportDeck id={d.id} onDone={(m) => { setReporting(false); setNote(m) }} />}
      {following && learned > 0 && <p className="small muted">You’ve learned {learned} of {d.cards.length} cards.</p>}
      {!d.mine && account && d.subscribed && (
        <div className="row" data-testid="deck-rate">
          <span className="small muted">Your rating:</span>
          {[1, 2, 3, 4, 5].map((n) => <button key={n} className={`star-btn ${d.myRating && n <= d.myRating ? 'on' : ''}`} onClick={() => run(api.rateDeck(d.id, n))} aria-label={`${n} stars`}>★</button>)}
          {learned < DECK_LIMITS.rateAfter && <span className="small muted">(after {DECK_LIMITS.rateAfter} cards studied)</span>}
        </div>
      )}
      <ol className="deck-cards" data-testid="deck-cards">
        {d.cards.map((c) => (
          <li key={c.id}>
            <span lang={COURSES[d.lang].bcp47} className="deck-target">{c.target}</span>
            {c.reading && <span className="small muted">{c.reading}</span>}
            <span className="grow">{c.meaning}</span>
            {progress[d.lang].cards[deckItem(d, c).id] && <Icon name="check" size={14} />}
          </li>
        ))}
      </ol>
    </div>
  )
}

function ReportDeck({ id, onDone }: { id: number; onDone: (msg: string) => void }) {
  const [reason, setReason] = useState('spam')
  const [text, setText] = useState('')
  return (
    <form className="card stack-sm" onSubmit={(e) => { e.preventDefault(); api.reportDeck(id, reason, text).then(() => onDone('Thanks, an admin will take a look.'), (err) => onDone(err.message)) }}>
      <strong>Report this deck</strong>
      <select className="text-input" value={reason} onChange={(e) => setReason(e.target.value)}>
        {[['spam', 'Spam'], ['hate', 'Hateful'], ['sexual', 'Sexual content'], ['harassment', 'Harassment'], ['other', 'Something else']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <input className="text-input" maxLength={300} placeholder="Anything else? (optional)" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="row"><button className="btn btn-primary small">Send report</button></div>
    </form>
  )
}

type Row = { id: number | null; target: string; reading: string; meaning: string; example: string }
const blank = (): Row => ({ id: null, target: '', reading: '', meaning: '', example: '' })

export function DeckEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { activeLang, account } = useStore()
  const editing = id ? Number(id) : null
  const [lang, setLang] = useState<LangCode>(activeLang)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pub, setPub] = useState(true)
  const [rows, setRows] = useState<Row[]>([blank(), blank(), blank(), blank()])
  const [paste, setPaste] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!editing) return
    api.deck(editing).then((d) => {
      if (!d.mine) return navigate(`/decks/${d.id}`)
      setLang(d.lang); setTitle(d.title); setDescription(d.description); setPub(d.public)
      setRows(d.cards.map((c: DeckCard) => ({ id: c.id, target: c.target, reading: c.reading ?? '', meaning: c.meaning, example: c.example ?? '' })))
    }, (e) => setError(e.message))
  }, [editing])
  if (!account) return <div className="stack"><div className="cta-card calm">Sign in to make decks.</div></div>
  const set = (i: number, patch: Partial<Row>) => setRows(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)))
  const filled = rows.filter((r) => r.target.trim() && r.meaning.trim())
  // One card per line: "word | reading | meaning" or "word | meaning" (tabs work too).
  const addPasted = () => {
    const more = paste.split('\n').map((l) => l.split(/\t|\s\|\s|\|/).map((x) => x.trim())).filter((p) => p.length >= 2 && p[0] && p[p.length - 1])
      .map((p): Row => ({ id: null, target: p[0], reading: p.length >= 3 ? p[1] : '', meaning: p.length >= 3 ? p[2] : p[1], example: p[3] ?? '' }))
    setRows([...rows.filter((r) => r.target || r.meaning), ...more].slice(0, DECK_LIMITS.cards))
    setPaste('')
  }
  const save = async () => {
    setBusy(true)
    const body = { lang, title, description, public: pub, cards: filled.map((r) => ({ id: r.id ?? undefined, target: r.target, reading: r.reading, meaning: r.meaning, example: r.example })) }
    try {
      const d = editing ? await api.saveDeck(editing, body) : await api.createDeck(body)
      await refreshDecks()
      navigate(`/decks/${d.id}`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="stack" data-testid="deck-editor">
      <PageHeader icon="layers" title={editing ? 'Edit deck' : 'New deck'} subtitle="Up to 200 cards. Plain text only." />
      {error && <div className="cta-card calm" role="alert">{error}</div>}
      <section className="card stack-sm">
        <input className="text-input" maxLength={DECK_LIMITS.title} placeholder="Deck name, e.g. Kitchen words" value={title} onChange={(e) => setTitle(e.target.value)} data-testid="deck-title" />
        <textarea className="text-input" rows={2} maxLength={DECK_LIMITS.description} placeholder="What's it for? (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="row wrap">
          <div className="seg" role="radiogroup" aria-label="Language">
            {LANGS.map((l) => <button key={l} type="button" role="radio" aria-checked={lang === l} disabled={!!editing} className={lang === l ? 'active' : ''} onClick={() => setLang(l)}>{COURSES[l].name}</button>)}
          </div>
          <label className="row small"><input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} data-testid="deck-public" /> Public (anyone can find it). Otherwise only people with the link.</label>
        </div>
      </section>
      <section className="stack-sm">
        <h3>Cards · {filled.length}</h3>
        <div className="deck-edit-rows">
          {rows.map((r, i) => (
            <div key={i} className="deck-edit-row" data-testid="deck-row-edit">
              <input className="text-input" lang={COURSES[lang].bcp47} maxLength={DECK_CARD_FIELDS.target} placeholder={lang === 'pt' ? 'Word' : 'Word (characters)'} value={r.target} onChange={(e) => set(i, { target: e.target.value })} />
              {lang !== 'pt' && <input className="text-input" maxLength={DECK_CARD_FIELDS.reading} placeholder={lang === 'zh' ? 'Pinyin' : 'Kana'} value={r.reading} onChange={(e) => set(i, { reading: e.target.value })} />}
              <input className="text-input" maxLength={DECK_CARD_FIELDS.meaning} placeholder="Meaning" value={r.meaning} onChange={(e) => set(i, { meaning: e.target.value })} />
              <button type="button" className="btn btn-ghost small" aria-label="Remove" onClick={() => setRows(rows.filter((_, k) => k !== i))}><Icon name="x" size={14} /></button>
            </div>
          ))}
        </div>
        <div className="row wrap">
          <button type="button" className="btn small" disabled={rows.length >= DECK_LIMITS.cards} onClick={() => setRows([...rows, blank()])}><Icon name="plus" size={14} /> Add a card</button>
        </div>
        <details className="card">
          <summary className="small"><b>Paste a list</b> · one card per line: <code>word | reading | meaning</code> or <code>word | meaning</code></summary>
          <textarea className="text-input" rows={4} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={'猫 | māo | cat\n狗 | gǒu | dog'} data-testid="deck-paste" />
          <button type="button" className="btn small" onClick={addPasted} disabled={!paste.trim()}>Add these</button>
        </details>
      </section>
      <div className="row">
        <button className="btn btn-primary" disabled={busy || !title.trim()} onClick={save} data-testid="deck-save">{editing ? 'Save deck' : 'Create deck'}</button>
        <Link to={editing ? `/decks/${editing}` : '/decks'} className="btn btn-ghost">Cancel</Link>
      </div>
    </div>
  )
}

/** Learn the next few cards of a deck you follow (then they're in your reviews). */
export function DeckLearn() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { decks, progress, recordSession, streak } = useStore()
  const deck = decks.find((d) => d.id === Number(id) && (d.mine || d.subscribed))
  const [exercises] = useState(() => {
    if (!deck) return []
    const course = COURSES[deck.lang]
    const items = deck.cards.map((c) => deckItem(deck, c))
    const fresh = items.filter((it) => !progress[deck.lang].cards[it.id]).slice(0, LEARN_BATCH)
    const pool = [...items, ...allItems(course).filter((x) => x.kind === 'word')]
    return fresh.length ? buildDeckLearn(fresh, pool) : []
  })
  const [done, setDone] = useState<{ xp: XpBreakdown; accuracy: number; durationMs: number; streakBefore: number } | null>(null)
  const course = useMemo(() => (deck ? COURSES[deck.lang] : null), [deck])
  if (!deck || !course || !exercises.length) return <Navigate to={`/decks/${id}`} replace />
  const finish = (sum: SessionSummary) => {
    const xp = sessionXp('practice', sum)
    const before = streak.current
    recordSession({ lang: deck.lang, xp: xp.total, ratings: sum.ratings })
    setDone({ xp, accuracy: sum.graded ? sum.correct / sum.graded : 1, durationMs: sum.durationMs, streakBefore: before })
  }
  if (done) {
    return <CompleteScreen title="New cards learned!" xp={done.xp.total} breakdown={done.xp} baseLabel="Deck cards learned" accuracy={done.accuracy}
      durationMs={done.durationMs} streakBefore={done.streakBefore} onContinue={() => navigate(`/decks/${deck.id}`)} />
  }
  return <SessionRunner exercises={exercises} course={course} onFinish={finish} onExit={() => navigate(`/decks/${deck.id}`)} />
}
