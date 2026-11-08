import { useState } from 'react'
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

/*
 * Mistakes notebook: the words and sentences you've forgotten most (each "Again" after you'd
 * learned it counts), worst first, with how well you remember each one right now. "Drill
 * these" runs a Weak words practice with exactly these items.
 * Everything comes from your review history, which is already on this device.
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
    </div>
  )
}
