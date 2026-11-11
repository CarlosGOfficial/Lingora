import { useMemo, useState } from 'react'
import { AudioButton } from '../components/AudioButton'
import { CompleteScreen } from '../components/CompleteScreen'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { SessionRunner, type SessionSummary } from '../components/SessionRunner'
import { COURSES } from '../content'
import type { Item, LangCode } from '../content/types'
import { mcq, type Exercise } from '../engine/exercises'
import { sessionXp, type XpBreakdown } from '../engine/xp'
import { isLearned } from '../lib/fsrs'
import { shuffle } from '../lib/random'
import { useStore, type CardRecord } from '../store/useStore'
import { trainerPool, trainerSets, type TrainerWord } from '../trainer'
import { PT_PERSONS, isIrregularPt } from '../trainer/pt'

/*
 * The verb & grammar trainer: pick the tenses or forms to drill (Portuguese conjugation,
 * Japanese verb and adjective forms, Chinese measure words), see any word's full table,
 * and drill by typing or multiple choice. Each form drilled becomes a review card.
 */

const DRILL_SIZE = 10
const PREFS_KEY = 'lingora.trainer'
type Mode = 'type' | 'choice'
type Prefs = { drills: Record<string, string[]>; mode: Mode; irregular: boolean }

function loadPrefs(): Prefs {
  try { return { drills: {}, mode: 'type', irregular: false, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') } } catch { return { drills: {}, mode: 'type', irregular: false } }
}
const savePrefs = (p: Prefs) => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)) } catch { /* private mode */ } }

/** Due cards first, then forms you haven't met, then the rest: up to `n`, shuffled. */
export function pickForDrill(items: Item[], cards: Record<string, CardRecord>, n = DRILL_SIZE, now = Date.now()): Item[] {
  const due = items.filter((it) => cards[it.id] && cards[it.id].due <= now)
  const fresh = shuffle(items.filter((it) => !cards[it.id]))
  const rest = shuffle(items.filter((it) => cards[it.id] && cards[it.id].due > now))
  return shuffle([...due, ...fresh, ...rest].slice(0, n))
}

export function TrainerPage() {
  const { activeLang, languages, progress, recordSession, streak, setActiveLang } = useStore()
  const [lang, setLang] = useState<LangCode>(activeLang)
  const set = trainerSets()[lang]
  const [kindId, setKindId] = useState(set.kinds[0].id)
  const kind = set.kinds.find((k) => k.id === kindId) ?? set.kinds[0]
  const [prefs, setPrefsState] = useState(loadPrefs)
  const setPrefs = (p: Partial<Prefs>) => { const next = { ...prefs, ...p }; setPrefsState(next); savePrefs(next) }
  const key = `${lang}:${kind.id}`
  const chosen = prefs.drills[key] ?? kind.drills.slice(0, Math.min(2, kind.drills.length)).map((d) => d.id)
  const toggle = (id: string) => {
    const next = chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id]
    if (next.length) setPrefs({ drills: { ...prefs.drills, [key]: next } })
  }
  const [open, setOpen] = useState<string | null>(null)
  const [session, setSession] = useState<Exercise[] | null>(null)
  const [done, setDone] = useState<{ xp: XpBreakdown; accuracy: number; durationMs: number; streakBefore: number } | null>(null)
  const cards = progress[lang]?.cards ?? {}
  const course = COURSES[lang]

  const words = useMemo(() => kind.words.filter((w) => !(lang === 'pt' && prefs.irregular) || isIrregularPt(w.title)), [kind, lang, prefs.irregular])
  const pool = (list: TrainerWord[]) => list.flatMap((w) => w.items.filter((x) => chosen.includes(x.drill)).map((x) => x.item))
  const selected = pool(words)
  const learned = selected.filter((it) => cards[it.id] && isLearned(cards[it.id])).length
  const due = selected.filter((it) => cards[it.id] && cards[it.id].due <= Date.now()).length

  const start = (items: Item[]) => {
    if (lang !== activeLang) setActiveLang(lang)
    const pick = pickForDrill(items, cards)
    setSession(pick.map((item) => (prefs.mode === 'choice' ? mcq(item, trainerPool(item), 'meaning') : { type: 'type', item })))
  }
  const finish = (sum: SessionSummary) => {
    const xp = sessionXp('practice', sum)
    const before = streak.current
    recordSession({ lang, xp: xp.total, ratings: sum.ratings })
    setDone({ xp, accuracy: sum.graded ? sum.correct / sum.graded : 1, durationMs: sum.durationMs, streakBefore: before })
    setSession(null)
  }

  if (done) {
    return <CompleteScreen title="Drill complete!" xp={done.xp.total} breakdown={done.xp} baseLabel="Forms drilled" accuracy={done.accuracy}
      durationMs={done.durationMs} streakBefore={done.streakBefore} onContinue={() => setDone(null)} />
  }
  if (session) return <SessionRunner exercises={session} course={course} onFinish={finish} onExit={() => setSession(null)} />

  const title = lang === 'zh' ? 'Measure words' : 'Verb & grammar trainer'
  const subtitle = lang === 'pt' ? 'Conjugations, tense by tense. Every form you drill comes back in your reviews.'
    : lang === 'ja' ? 'Verb and adjective forms, from the ます form to “let’s”. Every form you drill comes back in your reviews.'
    : 'Which measure word goes with which noun: 一本书, 两只猫. Every one you drill comes back in your reviews.'
  return (
    <div className="stack" data-testid="trainer-page">
      <PageHeader icon="pencil" title={title} subtitle={subtitle} />
      {languages.length > 1 && (
        <div className="tabs" role="tablist">
          {languages.map((l) => (
            <button key={l} role="tab" aria-selected={lang === l} className={`tab-btn ${lang === l ? 'active' : ''}`} onClick={() => { setLang(l); setKindId(trainerSets()[l].kinds[0].id); setOpen(null) }}>
              {COURSES[l].name}
            </button>
          ))}
        </div>
      )}
      {set.kinds.length > 1 && (
        <div className="seg" role="tablist">
          {set.kinds.map((k) => <button key={k.id} className={k.id === kind.id ? 'active' : ''} onClick={() => { setKindId(k.id); setOpen(null) }} data-testid={`trainer-kind-${k.id}`}>{k.label}</button>)}
        </div>
      )}

      <section className="card stack-sm trainer-setup">
        {kind.drills.length > 1 && (
          <>
            <strong>{lang === 'pt' ? 'Tenses' : 'Forms'}</strong>
            <div className="chip-row">
              {kind.drills.map((d) => (
                <button key={d.id} className={`chip-toggle ${chosen.includes(d.id) ? 'on' : ''}`} onClick={() => toggle(d.id)} title={d.hint} data-testid={`drill-${d.id}`}>{d.label}</button>
              ))}
            </div>
          </>
        )}
        <div className="row wrap">
          <div className="seg">
            <button className={prefs.mode === 'type' ? 'active' : ''} onClick={() => setPrefs({ mode: 'type' })} data-testid="mode-type">Type it</button>
            <button className={prefs.mode === 'choice' ? 'active' : ''} onClick={() => setPrefs({ mode: 'choice' })} data-testid="mode-choice">Multiple choice</button>
          </div>
          {lang === 'pt' && (
            <label className="toggle small"><input type="checkbox" checked={prefs.irregular} onChange={(e) => setPrefs({ irregular: e.target.checked })} /> Irregular verbs only</label>
          )}
        </div>
        <div className="row wrap">
          <span className="muted small grow" data-testid="trainer-stats">{selected.length} forms · {learned} learned · {due} due</span>
          <button className="btn btn-primary" disabled={!selected.length} onClick={() => start(selected)} data-testid="trainer-start">
            <Icon name="bolt" size={18} /> Drill {Math.min(DRILL_SIZE, selected.length)}
          </button>
        </div>
      </section>

      <h3>{kind.label === 'Measure words' ? 'Nouns' : kind.label} <span className="muted small">· tap one for its table</span></h3>
      <ul className="trainer-list">
        {words.map((w) => {
          const n = w.items.length
          const got = w.items.filter((x) => cards[x.item.id] && isLearned(cards[x.item.id])).length
          const isOpen = open === w.key
          return (
            <li key={w.key} className={`trainer-word ${isOpen ? 'open' : ''}`} data-testid="trainer-word">
              <button className="trainer-word-head" onClick={() => setOpen(isOpen ? null : w.key)} aria-expanded={isOpen}>
                <span className="trainer-word-title" lang={course.bcp47}>{w.title}{w.reading && w.reading !== w.title && <span className="muted small"> {w.reading}</span>}</span>
                <span className="muted small grow">{w.gloss}{w.tag && <span className="pill trainer-tag" lang={course.bcp47}>{w.tag}</span>}</span>
                {n > 1 && <span className="small muted">{got}/{n}</span>}
              </button>
              {isOpen && <WordTable word={w} lang={lang} cards={cards} drills={kind.drills} onDrill={() => start(w.items.map((x) => x.item))} />}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** One word's forms: a person × tense grid for Portuguese, a list for the rest. */
function WordTable({ word, lang, cards, drills, onDrill }: { word: TrainerWord; lang: LangCode; cards: Record<string, CardRecord>; drills: { id: string; label: string }[]; onDrill: () => void }) {
  const course = COURSES[lang]
  const cls = (it: Item) => (cards[it.id] ? (isLearned(cards[it.id]) ? 'is-learned' : 'is-seen') : '')
  const cell = (it: Item) => (
    <span className={`form ${cls(it)}`} lang={course.bcp47}>
      {it.target}{it.reading && <small className="muted"> {it.reading}</small>}
    </span>
  )
  return (
    <div className="trainer-table" data-testid="trainer-table">
      {lang === 'pt' ? (
        <div className="conj-scroll">
          <table className="conj">
            <thead><tr><th />{drills.map((d) => <th key={d.id}>{d.label}</th>)}</tr></thead>
            <tbody>
              {PT_PERSONS.map((p) => (
                <tr key={p.id}>
                  <th>{p.label}</th>
                  {drills.map((d) => { const x = word.items.find((i) => i.drill === d.id && i.row === p.id)!; return <td key={d.id}>{cell(x.item)}</td> })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="form-list">
          {word.items.map((x) => (
            <li key={x.item.id}>
              <span className="muted small">{lang === 'zh' ? `一${x.item.target}${word.title}` : drills.find((d) => d.id === x.drill)?.label}</span>
              {cell(x.item)}
              <AudioButton text={lang === 'zh' ? `一${x.item.target}${word.title}` : x.item.target} lang={course.bcp47} />
            </li>
          ))}
          {lang === 'zh' && word.items[0].item.note && <li className="muted small">{word.items[0].item.note}</li>}
        </ul>
      )}
      <div className="row">
        <span className="muted small grow"><span className="form is-learned">learned</span> <span className="form is-seen">practising</span></span>
        <button className="btn small" onClick={onDrill} data-testid="trainer-drill-word">Drill {lang === 'zh' ? 'it' : 'this one'}</button>
      </div>
    </div>
  )
}
