import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createPortal } from 'react-dom'
import HanziWriter from 'hanzi-writer'
import { AudioButton } from '../components/AudioButton'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { SessionRunner } from '../components/SessionRunner'
import { TargetText } from '../components/TargetText'
import { strokeUrl } from '../components/exercises/Write'
import { COURSES, allItems, findLesson, nextLessonId } from '../content'
import { hanIn, isCharLang, useCharacters, type CharData, type CharLang } from '../content/characters'
import type { Item } from '../content/types'
import { isLearned } from '../lib/fsrs'
import { useStore } from '../store/useStore'

/*
 * Character explorer (Chinese and Japanese): every character in your course grouped by
 * radical (/characters), and a page per character (/characters/:char) with its radical,
 * parts, stroke count, animated stroke order, readings, meaning and the words you know
 * that use it, plus a "Trace it" drill. CharChips opens the same view in a sheet from
 * lessons, reviews and the mistakes notebook without leaving them.
 */

type Filter = 'all' | 'learned' | 'next'

/** Which characters you've learned (in a word you've learned) and which the next lesson brings. */
function useCharSets(lang: CharLang) {
  const { progress } = useStore()
  return useMemo(() => {
    const course = COURSES[lang]
    const cards = progress[lang]?.cards ?? {}
    const learned = new Set<string>()
    const met = new Set<string>()
    for (const it of allItems(course)) {
      const card = cards[it.id]
      if (!card) continue
      for (const c of hanIn(it.target)) { met.add(c); if (isLearned(card)) learned.add(c) }
    }
    const next = new Set<string>()
    const id = nextLessonId(course, progress[lang]?.completedLessons ?? [])
    const lesson = id ? findLesson(id)?.lesson : undefined
    for (const it of [...(lesson?.items ?? []), ...(lesson?.sentences ?? [])]) for (const c of hanIn(it.target)) if (!learned.has(c)) next.add(c)
    return { learned, met, next }
  }, [lang, progress])
}

/** zh / ja, whichever you're learning (the active one first). */
function useCharLang(): [CharLang | null, CharLang[], (l: CharLang) => void] {
  const { activeLang, languages } = useStore()
  const [search, setSearch] = useSearchParams()
  const options = languages.filter(isCharLang)
  const asked = search.get('lang')
  const lang = asked && isCharLang(asked) && options.includes(asked) ? asked : isCharLang(activeLang) ? activeLang : options[0] ?? null
  return [lang, options, (l) => setSearch((s) => { s.set('lang', l); return s }, { replace: true })]
}

export function CharactersPage() {
  const [lang, options, setLang] = useCharLang()
  const [search, setSearch] = useSearchParams()
  const data = useCharacters(lang)
  const filter = (search.get('show') as Filter) || 'all'
  const radicalOnly = search.get('radical')
  const setParam = (k: string, v: string | null) => setSearch((s) => { if (v) s.set(k, v); else s.delete(k); return s }, { replace: true })
  if (!lang) {
    return (
      <div className="stack">
        <PageHeader icon="pencil" title="Characters" subtitle="Hanzi and kanji, one by one: their parts, stroke order and the words you know that use them." />
        <div className="cta-card calm">The character explorer is for Chinese and Japanese. Add one of them from the language menu to explore its characters.</div>
      </div>
    )
  }
  return (
    <div className="stack" data-testid="characters-page">
      <PageHeader icon="pencil" title={lang === 'zh' ? 'Hanzi' : 'Kanji'} subtitle="Every character in your course, grouped by radical. Tap one for its parts, stroke order and the words you know that use it." />
      {options.length > 1 && (
        <div className="tabs" role="tablist">
          {options.map((l) => <button key={l} role="tab" aria-selected={lang === l} className={`tab-btn ${lang === l ? 'active' : ''}`} onClick={() => setLang(l)}>{COURSES[l].name}</button>)}
        </div>
      )}
      {!data ? <p className="muted">Loading…</p> : <CharGrid lang={lang} data={data} filter={filter} radicalOnly={radicalOnly} setParam={setParam} />}
    </div>
  )
}

function CharGrid({ lang, data, filter, radicalOnly, setParam }: { lang: CharLang; data: CharData; filter: Filter; radicalOnly: string | null; setParam: (k: string, v: string | null) => void }) {
  const { learned, met, next } = useCharSets(lang)
  const course = COURSES[lang]
  const all = Object.keys(data.chars)
  const shown = all.filter((c) => (filter === 'learned' ? learned.has(c) : filter === 'next' ? next.has(c) : true) && (!radicalOnly || String(data.chars[c].r) === radicalOnly))
  const groups = new Map<number, string[]>()
  for (const c of shown) { const r = data.chars[c].r; groups.set(r, [...(groups.get(r) ?? []), c]) }
  const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0] - b[0])
  for (const [, list] of sorted) list.sort((a, b) => (data.chars[a].s ?? 99) - (data.chars[b].s ?? 99))
  return (
    <>
      <div className="row wrap">
        <div className="seg" role="tablist">
          {([['all', `All ${all.length}`], ['learned', `Learned ${learned.size}`], ['next', `Next lesson ${next.size}`]] as const).map(([f, label]) => (
            <button key={f} className={filter === f ? 'active' : ''} onClick={() => setParam('show', f === 'all' ? null : f)} data-testid={`chars-${f}`}>{label}</button>
          ))}
        </div>
        {radicalOnly && <button className="chip-toggle on" onClick={() => setParam('radical', null)}>{data.radicals[radicalOnly]?.char} {data.radicals[radicalOnly]?.name} ✕</button>}
      </div>
      {!shown.length && <div className="cta-card calm">{filter === 'learned' ? 'No characters learned yet: they show up here as you learn words.' : filter === 'next' ? 'Nothing new in your next lesson.' : 'Nothing here.'}</div>}
      <div className="radical-groups">
        {sorted.map(([r, list]) => (
          <section key={r} className="radical-group" data-testid="radical-group">
            <button className="radical-head" onClick={() => setParam('radical', radicalOnly ? null : String(r))} title="Only this radical">
              <span className="radical-char" lang={course.bcp47}>{data.radicals[r]?.char}</span>
              <span className="muted small">{data.radicals[r]?.name} · {list.length}</span>
            </button>
            <div className="char-tiles">
              {list.map((c) => (
                <Link key={c} to={`/characters/${encodeURIComponent(c)}?lang=${lang}`} lang={course.bcp47} data-testid="char-tile"
                  className={`char-tile ${learned.has(c) ? 'is-learned' : next.has(c) ? 'is-next' : met.has(c) ? 'is-met' : ''}`}>{c}</Link>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="small muted">Radicals, readings and parts: Unihan, KANJIDIC, KanjiVG and Wikimedia Commons (details in the app’s licences).</p>
    </>
  )
}

export function CharacterPage() {
  const { char = '' } = useParams()
  const [lang] = useCharLang()
  const navigate = useNavigate()
  const c = decodeURIComponent(char)
  if (!lang) return <CharactersPage />
  return (
    <div className="stack" data-testid="character-page">
      <button className="btn btn-ghost small back-btn" onClick={() => navigate(`/characters?lang=${lang}`)}><Icon name="back" size={16} /> All characters</button>
      <CharacterDetail char={c} lang={lang} />
    </div>
  )
}

/** Everything about one character (the page and the sheet). */
export function CharacterDetail({ char, lang, inSheet = false }: { char: string; lang: CharLang; inSheet?: boolean }) {
  const data = useCharacters(lang)
  const { progress } = useStore()
  const [tracing, setTracing] = useState(false)
  const course = COURSES[lang]
  const info = data?.chars[char]
  const words = useMemo(() => {
    const cards = progress[lang]?.cards ?? {}
    const seen = new Set<string>()
    const list = allItems(course).filter((it) => it.kind === 'word' && it.target.includes(char) && !seen.has(it.target) && (seen.add(it.target), true))
    return { known: list.filter((it) => cards[it.id]), later: list.filter((it) => !cards[it.id]) }
  }, [char, lang, progress, course])
  if (!data) return <p className="muted">Loading…</p>
  if (!info) return <div className="cta-card calm">{char} isn’t in the {course.name} course yet.</div>
  const radical = data.radicals[info.r]
  const link = (c: string) => (data.chars[c] && !inSheet ? <Link key={c} to={`/characters/${encodeURIComponent(c)}?lang=${lang}`} className="part" lang={course.bcp47}>{c}</Link> : <span key={c} className="part" lang={course.bcp47}>{c}</span>)
  const sound = lang === 'zh' ? char : (info.kun?.[0]?.replace(/[.-]/g, '') || info.on?.[0] || char)

  if (tracing) {
    const item: Item = { id: `${lang}-char-${char}`, kind: 'word', target: char, ...(info.py ? { reading: info.py } : {}), meaning: info.m ?? '' }
    // Just practice: nothing is recorded.
    return <SessionRunner exercises={[{ type: 'write', item, char }]} course={course} onFinish={() => setTracing(false)} onExit={() => setTracing(false)} />
  }
  return (
    <div className="char-detail" data-testid="char-detail">
      <div className="char-hero">
        <StrokeOrder char={char} lang={lang} />
        <div className="stack-sm">
          <div className="row">
            <span className="char-big" lang={course.bcp47}>{char}</span>
            <AudioButton text={sound} lang={course.bcp47} />
          </div>
          {info.m && <p className="char-meaning" data-testid="char-meaning">{info.m}</p>}
          {lang === 'zh' && info.py && <p><span className="muted small">Pinyin</span> <strong className="char-reading">{info.py}</strong></p>}
          {lang === 'ja' && (
            <>
              {!!info.on?.length && <p><span className="muted small">On</span> <strong className="char-reading" lang="ja">{info.on.join('、')}</strong></p>}
              {!!info.kun?.length && <p><span className="muted small">Kun</span> <strong className="char-reading" lang="ja">{info.kun.map((k) => k.replace('.', '·')).join('、')}</strong></p>}
            </>
          )}
          <div className="row wrap small">
            {info.s && <span className="pill">{info.s} strokes</span>}
            {info.jlpt && <span className="pill">JLPT N{info.jlpt}</span>}
            {info.g && <span className="pill">Grade {info.g <= 6 ? info.g : 'secondary'}</span>}
          </div>
          {!inSheet && <button className="btn btn-primary" onClick={() => setTracing(true)} data-testid="trace-it"><Icon name="pencil" size={18} /> Trace it</button>}
        </div>
      </div>
      <div className="char-facts">
        <div className="card stack-sm" data-testid="char-radical">
          <span className="muted small">Radical</span>
          <div className="row">
            {inSheet ? <span className="part" lang={course.bcp47}>{info.rf}</span>
              : <Link to={`/characters?lang=${lang}&radical=${info.r}`} className="part" lang={course.bcp47} title="Characters with this radical">{info.rf}</Link>}
            <span>{radical?.name}{info.rf !== radical?.char && <span className="muted"> (a form of {radical?.char})</span>} <span className="muted small">· no. {info.r}</span></span>
          </div>
        </div>
        <div className="card stack-sm" data-testid="char-parts">
          <span className="muted small">Parts</span>
          {info.p.length ? <div className="row">{info.p.map((p, i) => <span key={p} className="row tight">{i > 0 && <span className="muted">+</span>}{link(p)}</span>)}</div>
            : <span className="small muted">A single part: it isn’t built from smaller pieces.</span>}
        </div>
      </div>
      <section className="stack-sm" data-testid="char-words">
        <h3>Words you know with {char}</h3>
        {words.known.length ? (
          <ul className="mistake-list">
            {words.known.slice(0, 12).map((it) => (
              <li key={it.id}><AudioButton text={it.target} lang={course.bcp47} /><div className="mistake-text"><TargetText item={it} course={course} size="sm" /><span className="muted small">{it.meaning}</span></div></li>
            ))}
          </ul>
        ) : <p className="small muted">None yet.</p>}
        {words.later.length > 0 && <p className="small muted">Coming up in the course: {words.later.slice(0, 8).map((it) => `${it.target} (${it.meaning})`).join(', ')}</p>}
      </section>
      {inSheet && <Link to={`/characters/${encodeURIComponent(char)}?lang=${lang}`} className="small">Open the full page</Link>}
    </div>
  )
}

/** The stroke order, animated on a loop (Hanzi Writer with the bundled stroke data). */
function StrokeOrder({ char, lang }: { char: string; lang: CharLang }) {
  const box = useRef<HTMLDivElement>(null)
  const writer = useRef<HanziWriter | null>(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    if (!box.current) return
    box.current.innerHTML = ''
    setMissing(false)
    const color = getComputedStyle(document.documentElement).getPropertyValue('--text').trim()
    const w = HanziWriter.create(box.current, char, {
      width: 180, height: 180, padding: 8, showOutline: true, strokeAnimationSpeed: 1.2, delayBetweenStrokes: 220, delayBetweenLoops: 1600,
      strokeColor: /^#|^rgb/.test(color) ? color : '#222222', radicalColor: '#e0662f', outlineColor: 'rgba(127,127,127,0.22)',
      charDataLoader: (c, onLoad, onError) => { fetch(strokeUrl(lang, c)).then((r) => (r.ok ? r.json() : Promise.reject(new Error('missing')))).then(onLoad, (e) => { setMissing(true); onError(e) }) },
    })
    writer.current = w
    void w.loopCharacterAnimation()
    return () => { writer.current = null; if (box.current) box.current.innerHTML = '' }
  }, [char, lang])
  return (
    <div className="stroke-box" data-testid="stroke-order">
      <div ref={box} />
      {missing && <span className="small muted">No stroke order for this one yet.</span>}
    </div>
  )
}

/**
 * The characters in a word as little buttons; tapping one opens it in a sheet (so a lesson
 * or review isn't left behind).
 */
export function CharChips({ text, lang }: { text: string; lang: string }) {
  const [open, setOpen] = useState<string | null>(null)
  if (!isCharLang(lang)) return null
  const chars = hanIn(text)
  if (!chars.length) return null
  return (
    <span className="char-chips">
      {chars.map((c) => <button key={c} type="button" className="char-chip" lang={COURSES[lang].bcp47} onClick={(e) => { e.stopPropagation(); setOpen(c) }} title="About this character" data-testid="char-chip">{c}</button>)}
      {open && createPortal(
        <div className="sheet-backdrop" onClick={() => setOpen(null)}>
          <div className="sheet" role="dialog" aria-label={`About ${open}`} onClick={(e) => e.stopPropagation()} data-testid="char-sheet">
            <button className="icon-btn sheet-close" onClick={() => setOpen(null)} aria-label="Close"><Icon name="x" size={18} /></button>
            <CharacterDetail char={open} lang={lang} inSheet />
          </div>
        </div>,
        document.body,
      )}
    </span>
  )
}
