import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { itemsIn } from '../shop/catalog'
import { useWallet } from '../shop/useWallet'
import { useStore } from '../store/useStore'
import { themeSwatch } from '../theme/ThemeMenu'
import {
  BASE_PRESETS,
  contrastWarnings,
  normalizeHex,
  paintBase,
  parseThemeCode,
  themeCode,
  themeVars,
  type CustomTheme,
  type Paint,
} from '../theme/themes'
import { useSavedThemes } from '../theme/useSavedThemes'

type SolidKey = 'card' | 'text' | 'mutedText' | 'accent' | 'border' | 'key' | 'tileCorrect' | 'tilePresent' | 'tileAbsent'

const FIELDS: { key: SolidKey; label: string; hint: string }[] = [
  { key: 'card', label: 'Cards', hint: 'Panels and dialogs' },
  { key: 'text', label: 'Text', hint: 'Main text' },
  { key: 'mutedText', label: 'Secondary text', hint: 'Hints and labels' },
  { key: 'accent', label: 'Highlight', hint: 'XP and small accents' },
  { key: 'border', label: 'Borders', hint: 'Outlines and dividers' },
  { key: 'key', label: 'Chips & tiles', hint: 'Word tiles, secondary surfaces' },
  { key: 'tileCorrect', label: 'Correct', hint: 'Right answers' },
  { key: 'tilePresent', label: 'Almost', hint: 'Close answers, warnings' },
  { key: 'tileAbsent', label: 'Neutral', hint: 'Inactive things' },
]

/** A colour swatch plus a hex box; partial hex is kept while typing. */
function ColorField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange(hex: string): void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  return (
    <label className="color-field">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} colour`} />
      <span className="grow">
        <span className="color-label">{label}</span>
        {hint && <span className="muted small"> · {hint}</span>}
      </span>
      <input
        className="hex-input"
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value)
          const hex = normalizeHex(e.target.value)
          if (hex) onChange(hex)
        }}
        onBlur={() => setText(value)}
        aria-label={`${label} hex`}
      />
    </label>
  )
}

/** Solid colour or a 2–3 stop gradient with an angle. */
function PaintField({ label, hint, value, onChange }: { label: string; hint: string; value: Paint; onChange(p: Paint): void }) {
  const toGradient = (): Paint => ({ type: 'gradient', colors: [paintBase(value), '#7597de'], angle: 135 })
  return (
    <div className="paint-field">
      <div className="row">
        <span className="grow">
          <span className="color-label">{label}</span>
          <span className="muted small"> · {hint}</span>
        </span>
        <div className="seg">
          <button type="button" className={value.type === 'solid' ? 'active' : ''} onClick={() => onChange({ type: 'solid', color: paintBase(value) })}>
            Solid
          </button>
          <button type="button" className={value.type === 'gradient' ? 'active' : ''} onClick={() => value.type === 'solid' && onChange(toGradient())}>
            Gradient
          </button>
        </div>
      </div>
      {value.type === 'solid' ? (
        <ColorField label="Colour" value={value.color} onChange={(color) => onChange({ type: 'solid', color })} />
      ) : (
        <>
          {value.colors.map((c, i) => (
            <div key={i} className="row">
              <div className="grow">
                <ColorField label={`Stop ${i + 1}`} value={c} onChange={(hex) => onChange({ ...value, colors: value.colors.map((x, j) => (j === i ? hex : x)) })} />
              </div>
              {value.colors.length > 2 && (
                <button type="button" className="icon-btn small" aria-label="Remove stop" onClick={() => onChange({ ...value, colors: value.colors.filter((_, j) => j !== i) })}>
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
          ))}
          <div className="row">
            {value.colors.length < 3 && (
              <button type="button" className="btn btn-ghost small" onClick={() => onChange({ ...value, colors: [...value.colors, value.colors[value.colors.length - 1]] })}>
                <Icon name="plus" size={14} /> Add stop
              </button>
            )}
            <label className="grow row small">
              Angle {value.angle}°
              <input className="grow" type="range" min={0} max={360} step={5} value={value.angle} onChange={(e) => onChange({ ...value, angle: Number(e.target.value) })} />
            </label>
          </div>
        </>
      )}
    </div>
  )
}

/** A miniature of real Lingora UI, painted with the draft theme. */
function Preview({ theme }: { theme: CustomTheme }) {
  return (
    <div className="studio-preview" style={themeVars(theme) as CSSProperties}>
      <div className="pv-top">
        <span className="pv-title">Lesson preview</span>
        <span className="topstat flame-on">
          <Icon name="flame" filled size={16} /> 12
        </span>
        <span className="topstat xp">
          <Icon name="bolt" filled size={16} /> 20/30
        </span>
      </div>
      <div className="progress">
        <div style={{ width: '62%' }} />
      </div>
      <h3 className="pv-q">What does this mean?</h3>
      <div className="pv-word" lang="ja">
        <span className="muted small">ありがとう</span>
        <strong>ありがとう</strong>
      </div>
      <div className="options options-list">
        <div className="option is-correct">
          <span className="option-key">1</span> thank you
        </div>
        <div className="option is-selected">
          <span className="option-key">2</span> good morning
        </div>
        <div className="option">
          <span className="option-key">3</span> goodbye
        </div>
      </div>
      <div className="pv-chips">
        <span className="chip">私</span>
        <span className="chip">は</span>
        <span className="chip">学生</span>
        <span className="pill">Grammar tip</span>
      </div>
      <p className="muted small">Secondary text looks like this.</p>
      <div className="row">
        <button type="button" className="btn btn-primary">
          Check
        </button>
        <button type="button" className="btn">
          Skip
        </button>
      </div>
      <div className="feedback-correct pv-feedback">
        <strong>Nice!</strong> <span className="pv-almost">Almost-right answers look like this.</span>
      </div>
    </div>
  )
}

export function ThemeStudioPage() {
  const saved = useStore((s) => s.appearance.custom)
  const isCustomOn = useStore((s) => s.appearance.theme === 'custom')
  const setCustomTheme = useStore((s) => s.setCustomTheme)
  const { owned } = useWallet()
  const slots = useSavedThemes()
  const [draft, setDraft] = useState<CustomTheme>(saved)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [slotName, setSlotName] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  const set = <K extends keyof CustomTheme>(key: K, value: CustomTheme[K]) => setDraft({ ...draft, [key]: value })
  const warnings = contrastWarnings(draft)
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved) || !isCustomOn
  const flash = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 2000)
  }
  const presets = [...BASE_PRESETS.map((p) => ({ id: p.name, name: p.name, theme: p.theme, locked: false })), ...itemsIn('theme').map((i) => ({ id: i.id, name: i.name, theme: i.theme!, locked: !owned.has(i.id) }))]

  return (
    <div className="stack">
      <PageHeader
        icon="palette"
        title="Theme Studio"
        subtitle={
          <>
            Design your own look, solid or gradient. Theme codes are shared with <strong>Wordle Unlimited</strong>, so a theme from either app works in
            both.
          </>
        }
      />

      <section>
        <h3>Start from</h3>
        <div className="preset-row">
          {presets.map((p) =>
            p.locked ? (
              <Link key={p.id} to="/shop?tab=theme" className="preset locked" title={`${p.name} — unlock in the shop`}>
                <span className="menu-swatch" style={themeSwatch(p.theme)} />
                <span>{p.name}</span>
                <Icon name="lock" size={12} />
              </Link>
            ) : (
              <button key={p.id} type="button" className="preset" onClick={() => setDraft(p.theme)}>
                <span className="menu-swatch" style={themeSwatch(p.theme)} />
                <span>{p.name}</span>
              </button>
            ),
          )}
        </div>
      </section>

      <div className="studio">
        <div className="studio-controls">
          <PaintField label="Background" hint="The page behind everything" value={draft.background} onChange={(p) => set('background', p)} />
          <PaintField label="Buttons" hint="Buttons, progress and highlights" value={draft.primary} onChange={(p) => set('primary', p)} />
          {FIELDS.map((f) => (
            <ColorField key={f.key} label={f.label} hint={f.hint} value={draft[f.key]} onChange={(hex) => set(f.key, hex)} />
          ))}
        </div>
        <div className="studio-side">
          <Preview theme={draft} />
          {warnings.length > 0 && (
            <div className="notice">
              {warnings.map((w) => (
                <div key={w}>⚠ {w}</div>
              ))}
            </div>
          )}
          <div className="row">
            <button
              className="btn btn-primary grow"
              disabled={!dirty}
              onClick={() => {
                setCustomTheme(draft)
                flash('Theme applied!')
              }}
            >
              {dirty ? 'Use this theme' : 'In use'}
            </button>
            <button className="btn btn-ghost" onClick={() => setDraft(saved)}>
              Reset
            </button>
          </div>
          {notice && <p className="success small">{notice}</p>}
        </div>
      </div>

      <section className="settings">
        <h3 style={{ margin: 0 }}>Share</h3>
        <div className="row">
          <input className="text-input grow mono" readOnly value={themeCode(draft)} onFocus={(e) => e.target.select()} aria-label="Theme code" />
          <button className="btn" onClick={() => navigator.clipboard?.writeText(themeCode(draft)).then(() => flash('Code copied!'))}>
            <Icon name="copy" size={16} /> Copy
          </button>
        </div>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault()
            const t = parseThemeCode(code)
            if (!t) return setCodeError('That isn’t a valid theme code.')
            setDraft(t)
            setCode('')
            setCodeError(null)
            flash('Theme loaded — press “Use this theme” to apply it.')
          }}
        >
          <input className="text-input grow mono" placeholder="Paste a theme code (wt…)" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn" disabled={!code.trim()}>
            Load
          </button>
        </form>
        {codeError && <p className="error small">{codeError}</p>}
      </section>

      <section className="settings">
        <h3 style={{ margin: 0 }}>
          Saved themes <span className="muted small">({slots.themes.length}/10)</span>
        </h3>
        {slots.themes.length === 0 && <p className="muted small">Save your favourite designs here to switch between them.</p>}
        {slots.themes.map((t) => (
          <div key={t.id} className="row slot-row">
            <span className="menu-swatch" style={themeSwatch(t.theme)} />
            <strong className="grow">{t.name}</strong>
            <button className="btn btn-ghost small" onClick={() => setDraft(t.theme)}>
              Edit
            </button>
            <button
              className="btn small"
              onClick={() => {
                setCustomTheme(t.theme)
                setDraft(t.theme)
                flash(`Using ${t.name}`)
              }}
            >
              Use
            </button>
            <button className="btn btn-ghost small" title="Overwrite with the current design" onClick={() => void slots.update(t.id, draft)}>
              Update
            </button>
            <button className="icon-btn small" aria-label={`Delete ${t.name}`} onClick={() => confirm(`Delete “${t.name}”?`) && void slots.remove(t.id)}>
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault()
            void slots.save(slotName.trim(), draft).then(() => setSlotName(''))
          }}
        >
          <input className="text-input grow" maxLength={30} placeholder="Name this design" value={slotName} onChange={(e) => setSlotName(e.target.value)} />
          <button className="btn" disabled={!slotName.trim() || slots.full}>
            Save
          </button>
        </form>
        {slots.error && <p className="error small">{slots.error}</p>}
      </section>
    </div>
  )
}
