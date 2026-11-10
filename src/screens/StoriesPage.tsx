import { recognitionSupported } from '../lib/speech'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AudioButton } from '../components/AudioButton'
import { CompleteScreen } from '../components/CompleteScreen'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { ReadingToggle } from '../components/ReadingToggle'
import { XP } from '../config'
import { COURSES } from '../content'
import { STORIES, findStory, type Story, type StoryLine } from '../content/stories'
import { readingOn, useStore } from '../store/useStore'

/** The Stories tab: longer graded stories with audio, tap-to-translate and questions. */
export function StoriesPage() {
  const { activeLang, progress } = useStore()
  const course = COURSES[activeLang]
  const done = new Set(progress[activeLang].completedReadings)
  return (
    <div className="stack">
      <PageHeader icon="book" title="Stories" subtitle={`Short scenes in ${course.name} with audio. Tap a word for its meaning, tap a line for the translation, and answer a question after each scene.`} />
      <div className="mode-grid stagger">
        {STORIES[activeLang].map((s) => (
          <Link key={s.id} to={`/story/${encodeURIComponent(s.id)}`} className="mode-card" data-testid="story-card">
            <span className="mode-icon story-emoji">{s.emoji}</span>
            <strong lang={course.bcp47}>{s.title}</strong>
            <span className="muted small">{s.titleMeaning} · {s.level} · {s.scenes.length} scenes</span>
            {done.has(s.id) && <span className="pill good small"><Icon name="check" size={14} /> Finished</span>}
          </Link>
        ))}
      </div>
    </div>
  )
}

/** A line with its glossary words tappable (longest match first). */
function GlossLine({ line, story, lang }: { line: StoryLine; story: Story; lang: string }) {
  const [open, setOpen] = useState<number | null>(null)
  const keys = Object.keys(story.glossary).sort((a, b) => b.length - a.length)
  const parts: { text: string; gloss?: string }[] = []
  let rest = line.target
  const cased = story.lang === 'pt'
  while (rest) {
    const lower = cased ? rest.toLowerCase() : rest
    const k = keys.find((k) => lower.startsWith(cased ? k.toLowerCase() : k) && (!cased || !/[a-zà-ú]/i.test(rest[k.length] ?? '')))
    if (k) { parts.push({ text: rest.slice(0, k.length), gloss: story.glossary[k] }); rest = rest.slice(k.length) }
    else {
      // Next character (or Portuguese word) with no gloss.
      const m = cased ? /^([a-zà-ú]+|[^a-zà-ú])/i.exec(rest)! : /^./u.exec(rest)!
      const last = parts[parts.length - 1]
      if (last && !last.gloss) last.text += m[0]; else parts.push({ text: m[0] })
      rest = rest.slice(m[0].length)
    }
  }
  return (
    <span className="story-text" lang={lang}>
      {parts.map((p, i) => p.gloss ? (
        <span key={i} className="gloss-word">
          <button className={`gloss ${open === i ? 'open' : ''}`} onClick={(e) => { e.stopPropagation(); setOpen(open === i ? null : i) }} data-testid="gloss">{p.text}</button>
          {open === i && <span className="gloss-pop" role="tooltip">{p.gloss}</span>}
        </span>
      ) : <span key={i}>{p.text}</span>)}
    </span>
  )
}

export function StoryPage() {
  const { storyId = '' } = useParams()
  const navigate = useNavigate()
  const story = findStory(decodeURIComponent(storyId))
  const { recordSession, streak, settings } = useStore()
  const [scene, setScene] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [shown, setShown] = useState<Record<string, boolean>>({})
  const [done, setDone] = useState<{ streakBefore: number; accuracy: number } | null>(null)
  if (!story) return <Navigate to="/stories" replace />
  const course = COURSES[story.lang]
  if (done) return <CompleteScreen title="Story complete!" baseLabel="Story" xp={XP.story} accuracy={done.accuracy} streakBefore={done.streakBefore} onContinue={() => navigate('/stories')} />
  const showReading = readingOn(settings, story.lang)
  const finish = () => {
    const correct = story.scenes.filter((s, i) => answers[i] === s.question.answer).length
    const before = streak.current
    recordSession({ lang: story.lang, xp: XP.story, ratings: {}, storyId: story.id })
    setDone({ streakBefore: before, accuracy: correct / story.scenes.length })
  }
  return (
    <div className="reading-page" data-testid="story-page">
      <header className="session-top">
        <button className="icon-btn" aria-label="Close" onClick={() => navigate('/stories')}><Icon name="x" /></button>
        <h1 className="reading-title" lang={course.bcp47}>{story.emoji} {story.title}</h1>
        {recognitionSupported() && <Link to={`/read-aloud/story/${encodeURIComponent(story.id)}`} className="btn small btn-ghost" title="Read the story aloud, line by line" data-testid="read-aloud"><Icon name="mic" size={16} /></Link>}
        <ReadingToggle course={course} />
      </header>
      <div className="reading-body">
        {story.scenes.slice(0, scene + 1).map((sc, si) => {
          const picked = answers[si]
          return (
            <section key={si} className="passage story-scene">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted small">Scene {si + 1} of {story.scenes.length}</span>
                <AudioButton text={sc.lines.map((l) => l.target).join(' ')} lang={course.bcp47} withSlow />
              </div>
              {sc.lines.map((l, li) => {
                const key = `${si}-${li}`
                return (
                  <div key={key} className="story-line">
                    <span className="story-speaker">{l.speaker}</span>
                    <div className="story-bubble" onClick={() => setShown({ ...shown, [key]: !shown[key] })} title="Tap to show the translation">
                      {showReading && l.reading && <span className="target-reading">{l.reading}</span>}
                      <GlossLine line={l} story={story} lang={course.bcp47} />
                      {shown[key] && <div className="passage-translation">{l.meaning}</div>}
                    </div>
                    <AudioButton text={l.target} lang={course.bcp47} withSlow />
                  </div>
                )
              })}
              <div className="question">
                <strong>{sc.question.q}</strong>
                <div className="options options-list">
                  {sc.question.options.map((o, oi) => {
                    const cls = picked === undefined ? '' : oi === sc.question.answer ? 'is-correct' : oi === picked ? 'is-wrong' : ''
                    return <button key={oi} className={`option ${cls}`} disabled={picked !== undefined} onClick={() => setAnswers({ ...answers, [si]: oi })} data-testid="story-option">{o}</button>
                  })}
                </div>
              </div>
              {si === scene && picked !== undefined && (si < story.scenes.length - 1
                ? <button className="btn btn-primary block" onClick={() => setScene(scene + 1)} data-testid="story-next">Next scene</button>
                : <button className="btn btn-primary btn-lg block" onClick={finish} data-testid="story-finish">Finish story</button>)}
            </section>
          )
        })}
      </div>
    </div>
  )
}
