import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AudioButton } from '../components/AudioButton'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { TargetText } from '../components/TargetText'
import { COURSES, getItem } from '../content'
import type { Item, LangCode } from '../content/types'
import { DAY_MS, retrievability } from '../lib/fsrs'
import { timeAgo } from '../lib/time'
import { useStore, type CardRecord } from '../store/useStore'
import { api, type SpeechStats } from '../sync/api'
import { flushSpeech } from '../lib/speechLog'
import { recognitionSupported } from '../lib/speech'
import { CharChips } from './CharactersPage'

/*
 * Mistakes notebook: the words and sentences you've forgotten most (each "Again" after you'd
 * learned it counts), worst first, with how well you remember each one right now. "Drill
 * these" runs a Weak words practice with exactly these items.
 * Everything comes from your review history, which is already on this device. Below it,
 * "Tricky to say": what you find hard to pronounce, from your speaking scores.
 */

const MAX_DRILL = 20

export type Mistake = { card: CardRecord; item: Item; recall: number }

/** Items you've forgotten at least once, worst first. */
export function mistakesIn(cards: Record<string, CardRecord>, now = Date.now()): Mistake[] {
  return Object.values(cards)
    .filter((c) => c.lapses > 0)
    .map((card) => {
      const item = getItem(card.itemId)
      const recall = card.lastReview ? retrievability((now - card.lastReview) / DAY_MS, card.stability) : 0
      return item ? { card, item, recall } : null
    })
    .filter((m): m is Mistake => !!m)
    .sort((a, b) => b.card.lapses - a.card.lapses || a.recall - b.recall)
}

function Strength({ recall }: { recall: number }) {
  const pct = Math.round(recall * 100)
  const tone = pct >= 85 ? 'good' : pct >= 60 ? 'ok' : 'weak'
  return (
    <span className={`recall recall-${tone}`} title="How likely you are to remember it right now">
      <span className="recall-bar" style={{ width: `${Math.max(4, pct)}%` }} />
      <span className="recall-pct">{pct}%</span>
    </span>
  )
}

export function MistakesPage() {
  const navigate = useNavigate()
  const { activeLang, languages, progress, setActiveLang } = useStore()
  const [lang, setLang] = useState<LangCode>(activeLang)
  const course = COURSES[lang]
  const list = mistakesIn(progress[lang]?.cards ?? {})
  const drill = () => {
    if (lang !== activeLang) setActiveLang(lang)
    const ids = list.slice(0, MAX_DRILL).map((m) => m.item.id)
    navigate(`/practice/weak?items=${encodeURIComponent(ids.join(','))}`)
  }
  return (
    <div className="stack" data-testid="mistakes-page">
      <PageHeader icon="target" title="Mistakes notebook" subtitle="The words you’ve forgotten most, worst first. Drill them until they stick." />
      {languages.length > 1 && (
        <div className="tabs" role="tablist">
          {languages.map((l) => (
            <button key={l} role="tab" aria-selected={lang === l} className={`tab-btn ${lang === l ? 'active' : ''}`} onClick={() => setLang(l)}>
              {COURSES[l].name}
            </button>
          ))}
        </div>
      )}
      {!list.length ? (
        <div className="cta-card calm" data-testid="mistakes-empty">
          No mistakes to work on in {course.name} yet. When you forget something you’d learned, it lands here.
          <div>
            <Link to="/review" className="btn small">
              Go to reviews
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="row">
            <span className="muted small grow">
              {list.length} {list.length === 1 ? 'item' : 'items'} · forgotten {list.reduce((n, m) => n + m.card.lapses, 0)} times in all
            </span>
            <button className="btn btn-primary" onClick={drill} disabled={list.length < 4} data-testid="mistakes-drill">
              <Icon name="target" size={18} /> Drill {Math.min(list.length, MAX_DRILL)}
            </button>
          </div>
          {list.length < 4 && <p className="small muted">A drill needs at least 4 items.</p>}
          <ul className="mistake-list">
            {list.map(({ card, item, recall }) => (
              <li key={item.id} data-testid="mistake">
                <AudioButton text={item.target} lang={course.bcp47} />
                <div className="mistake-text">
                  <TargetText item={item} course={course} size="sm" />
                  <span className="muted small">{item.meaning}</span>
                  {item.kind === 'word' && <CharChips text={item.target} lang={lang} />}
                </div>
                <div className="mistake-stats">
                  <strong>
                    {card.lapses}× forgotten
                  </strong>
                  <span className="muted small">{card.lastReview ? `last seen ${timeAgo(new Date(card.lastReview).toISOString())}` : 'not seen yet'}</span>
                  <Strength recall={recall} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <TrickyToSay lang={lang} onPractise={(ids) => { if (lang !== activeLang) setActiveLang(lang); navigate(`/practice/speaking?items=${encodeURIComponent(ids.join(','))}`) }} />
    </div>
  )
}

/** Things you find hard to say (server/speech.ts), with your speaking score. */
function TrickyToSay({ lang, onPractise }: { lang: LangCode; onPractise: (ids: string[]) => void }) {
  const account = useStore((s) => s.account)
  const [stats, setStats] = useState<SpeechStats | null>(null)
  useEffect(() => {
    if (!account) return
    let live = true
    void flushSpeech().then(() => api.speechStats(lang)).then((r) => live && setStats(r), () => {})
    return () => { live = false }
  }, [account, lang])
  if (!stats || !stats.attempts) return null
  const course = COURSES[lang]
  const list = stats.tricky.map((t) => ({ ...t, item: getItem(t.itemId) })).filter((t): t is typeof t & { item: Item } => !!t.item)
  return (
    <section className="stack-sm" data-testid="tricky-to-say">
      <div className="row">
        <h3 className="grow">🎤 Tricky to say</h3>
        <span className="pill" title="Average match over your last 30 days of speaking">Speaking score {Math.round(stats.avg * 100)}% · {stats.attempts} tries</span>
      </div>
      {list.length === 0 ? <p className="small muted">Nothing tricky right now: everything you’ve said lately came out well.</p> : (
        <>
          <ul className="mistake-list">
            {list.map((t) => (
              <li key={t.itemId} data-testid="tricky">
                <AudioButton text={t.item.target} lang={course.bcp47} />
                <div className="mistake-text">
                  <TargetText item={t.item} course={course} size="sm" />
                  <span className="muted small">{t.item.meaning}</span>
                </div>
                <div className="mistake-stats">
                  <strong>{Math.round(t.avg * 100)}% match</strong>
                  <span className="muted small">{t.attempts} {t.attempts === 1 ? 'try' : 'tries'} · best {Math.round(t.best * 100)}%</span>
                </div>
              </li>
            ))}
          </ul>
          {recognitionSupported() && (
            <div><button className="btn" onClick={() => onPractise(list.slice(0, MAX_DRILL).map((t) => t.itemId))} data-testid="tricky-practise"><Icon name="mic" size={16} /> Practise saying these</button></div>
          )}
        </>
      )}
    </section>
  )
}
