import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CompleteScreen } from '../components/CompleteScreen'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { SessionRunner, type SessionSummary } from '../components/SessionRunner'
import { REVIEW_SESSION_SIZE } from '../config'
import { COURSES, getItem } from '../content'
import type { Item } from '../content/types'
import { buildReview, effectiveOpts, type Exercise } from '../engine/exercises'
import { sessionXp, type XpBreakdown } from '../engine/xp'
import { formatRelative } from '../lib/date'
import { isLearned, retrievability, DAY_MS } from '../lib/fsrs'
import { dueCards, useStore, type CardRecord } from '../store/useStore'

export function ReviewPage() {
  const navigate = useNavigate()
  const { activeLang, progress, settings, recordSession, streak } = useStore()
  const course = COURSES[activeLang]
  const prog = progress[activeLang]
  const [session, setSession] = useState<Exercise[] | null>(null)
  const [done, setDone] = useState<{ xp: XpBreakdown; accuracy: number; durationMs: number; streakBefore: number } | null>(null)

  const cards = Object.values(prog.cards)
  const due = dueCards(prog)
  const learned = cards.filter(isLearned).length
  const upcoming = [...cards].sort((a, b) => a.due - b.due).find((c) => c.due > Date.now())
  const now = Date.now()
  const avgRecall = cards.length
    ? cards.reduce((sum, c) => sum + (c.lastReview ? retrievability((now - c.lastReview) / DAY_MS, c.stability) : 0), 0) / cards.length
    : 0

  const start = () => {
    const batch = due
      .slice(0, REVIEW_SESSION_SIZE)
      .map((card) => ({ card, item: getItem(card.itemId) }))
      .filter((x): x is { card: CardRecord; item: Item } => !!x.item)
    setSession(buildReview(batch, course, effectiveOpts(settings, course)))
  }

  const finish = (sum: SessionSummary) => {
    const xp = sessionXp('review', sum)
    const before = streak.current
    recordSession({ lang: activeLang, xp: xp.total, ratings: sum.ratings })
    setDone({ xp, accuracy: sum.graded ? sum.correct / sum.graded : 1, durationMs: sum.durationMs, streakBefore: before })
    setSession(null)
  }

  if (done) {
    return (
      <CompleteScreen
        title="Review complete!"
        xp={done.xp.total}
        breakdown={done.xp}
        baseLabel="Review complete"
        accuracy={done.accuracy}
        durationMs={done.durationMs}
        streakBefore={done.streakBefore}
        onContinue={() => navigate('/')}
      />
    )
  }
  if (session) return <SessionRunner exercises={session} course={course} onFinish={finish} onExit={() => setSession(null)} />

  return (
    <div className="stack">
      <PageHeader icon="layers" title="Review" subtitle="Each word comes back right before you’d forget it — the fastest way to remember for good." />

      <div className="dash stagger">
        <div className="stat-tile tone-accent">
          <span className="stat-label">Due now</span>
          <span className="stat-value">{due.length}</span>
        </div>
        <div className="stat-tile tone-success">
          <span className="stat-label">Learned</span>
          <span className="stat-value">{learned}</span>
        </div>
        <div className="stat-tile tone-xp">
          <span className="stat-label">Est. recall</span>
          <span className="stat-value">{cards.length ? `${Math.round(avgRecall * 100)}%` : '—'}</span>
        </div>
      </div>

      {due.length > 0 ? (
        <div className="cta-card">
          <div>
            <h2>{Math.min(due.length, REVIEW_SESSION_SIZE)} cards ready</h2>
            <p className="muted">Mixed exercise types, interleaved across lessons.</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={start}>
            Start review
          </button>
        </div>
      ) : (
        <div className="cta-card calm">
          <Icon name="check" size={32} className="c-success" />
          <div>
            <h2>All caught up</h2>
            <p className="muted">
              {upcoming ? `Next card is due ${formatRelative(upcoming.due)}.` : 'Finish a lesson to add cards.'}{' '}
              {cards.length > 0 && (
                <>
                  Want more? Try <Link to="/practice/weak">weak words</Link>.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {cards.length > 0 && (
        <section>
          <h3>Your deck</h3>
          <div className="deck">
            {cards
              .map((c) => ({ c, item: getItem(c.itemId) }))
              .filter((x) => x.item)
              .sort((a, b) => a.c.due - b.c.due)
              .map(({ c, item }) => {
                const r = c.lastReview ? retrievability((now - c.lastReview) / DAY_MS, c.stability) : 0
                const level = r >= 0.85 ? 'strong' : r >= 0.6 ? 'fading' : 'weak'
                return (
                  <div key={c.itemId} className="deck-row">
                    <span lang={course.bcp47} className="deck-target">
                      {item!.target}
                    </span>
                    <span className="muted small grow">{item!.meaning}</span>
                    <span className={`strength ${level}`} title={`Recall probability ${Math.round(r * 100)}%`}>
                      <span style={{ width: `${Math.round(r * 100)}%` }} />
                    </span>
                    <span className="small muted due-col">{c.due <= now ? 'due' : formatRelative(c.due)}</span>
                  </div>
                )
              })}
          </div>
        </section>
      )}
    </div>
  )
}
