/**
 * Custom themes, ported from Wordle Unlimited (client/src/lib/themes.ts).
 *
 * The CustomTheme shape, the share-code format ("wt…") and the saved_themes rows are
 * identical in both apps, so a theme made in one works in the other. Field names
 * keep Wordle's meaning; in Lingora they map to: key → chips & secondary surfaces,
 * tileCorrect → correct answers, tilePresent → "almost", tileAbsent → neutral.
 */

export type Paint = { type: 'solid'; color: string } | { type: 'gradient'; colors: string[]; angle: number }

export interface CustomTheme {
  background: Paint
  card: string
  text: string
  mutedText: string
  primary: Paint
  accent: string
  border: string
  key: string
  tileCorrect: string
  tilePresent: string
  tileAbsent: string
}

export type ThemeChoice = 'light' | 'dark' | 'system' | 'custom' | `th_${string}`

export const MAX_SAVED_THEMES = 10

export const BASE_PRESETS: { name: string; theme: CustomTheme }[] = [
  {
    name: 'Classic Light',
    theme: {
      background: { type: 'solid', color: '#f6f6fb' }, card: '#ffffff', text: '#1b1d2a', mutedText: '#6b6f85',
      primary: { type: 'solid', color: '#5b5bd6' }, accent: '#e8a400', border: '#e2e4ee', key: '#f0f1f7',
      tileCorrect: '#1f9d55', tilePresent: '#c77700', tileAbsent: '#9aa0b4',
    },
  },
  {
    name: 'Classic Dark',
    theme: {
      background: { type: 'solid', color: '#11121a' }, card: '#1a1c27', text: '#eceef7', mutedText: '#9599b0',
      primary: { type: 'solid', color: '#8585f0' }, accent: '#ffb547', border: '#2d3044', key: '#232636',
      tileCorrect: '#3ccf7f', tilePresent: '#ffb547', tileAbsent: '#4a4e63',
    },
  },
]

export const DEFAULT_CUSTOM_THEME: CustomTheme = BASE_PRESETS[1].theme

/* ---------- Colour helpers ---------- */

export function normalizeHex(input: string): string | null {
  const m = input.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return null
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1]
  return `#${h.toLowerCase()}`
}

function hexToRgb(hex: string): [number, number, number] {
  const h = (normalizeHex(hex) ?? '#000000').slice(1)
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio (1 = none, 21 = black on white). Under ~4.5 text gets hard to read. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Black or white, whichever reads better on this colour. */
export const readableOn = (hex: string) => (luminance(hex) > 0.45 ? '#111111' : '#ffffff')

/** Blend two colours (t = 0 gives a, 1 gives b). */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0')
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`
}

export const paintCss = (p: Paint) => (p.type === 'solid' ? p.color : `linear-gradient(${p.angle}deg, ${p.colors.join(', ')})`)
/** The colour to use where a single colour is needed (e.g. text on top of a gradient). */
export const paintBase = (p: Paint) => (p.type === 'solid' ? p.color : mix(p.colors[0], p.colors[p.colors.length - 1], 0.5))

/** For a gradient page, the single colour behind inputs etc. is the stop text reads best on. */
export function solidBackground(t: CustomTheme): string {
  if (t.background.type === 'solid') return t.background.color
  return [...t.background.colors].sort((a, b) => contrastRatio(t.text, b) - contrastRatio(t.text, a))[0]
}

export const isDarkTheme = (t: CustomTheme) => luminance(solidBackground(t)) < 0.3

/** Contrast problems worth warning about in the editor. */
export function contrastWarnings(t: CustomTheme): string[] {
  const out: string[] = []
  if (contrastRatio(t.text, solidBackground(t)) < 4.5) out.push('Text is hard to read on the background.')
  if (contrastRatio(t.text, t.card) < 4.5) out.push('Text is hard to read on cards.')
  if (contrastRatio(t.mutedText, t.card) < 3) out.push('Secondary text is faint on cards.')
  return out
}

/* ---------- Theme codes (for sharing; same format as Wordle Unlimited) ---------- */
// "wt" + base64url bytes: version, background paint, button paint, then nine colours.
// A paint is [count] then, for gradients, [angle hi, angle lo], then count × 3 colour bytes.
const CODE_PREFIX = 'wt'
const CODE_VERSION = 1
const SOLID_KEYS = ['card', 'text', 'mutedText', 'accent', 'border', 'key', 'tileCorrect', 'tilePresent', 'tileAbsent'] as const

const toBase64Url = (bytes: number[]) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromBase64Url = (s: string) => Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0))

export function themeCode(t: CustomTheme): string {
  const bytes: number[] = [CODE_VERSION]
  const color = (hex: string) => bytes.push(...hexToRgb(hex))
  const paint = (p: Paint) => {
    if (p.type === 'solid') {
      bytes.push(1)
      color(p.color)
    } else {
      const angle = Math.round(((p.angle % 360) + 360) % 360)
      bytes.push(p.colors.length, angle >> 8, angle & 255)
      p.colors.forEach(color)
    }
  }
  paint(t.background)
  paint(t.primary)
  SOLID_KEYS.forEach((k) => color(t[k]))
  return CODE_PREFIX + toBase64Url(bytes)
}

export function parseThemeCode(code: string): CustomTheme | null {
  const trimmed = code.trim().replace(/\s+/g, '')
  if (!trimmed.startsWith(CODE_PREFIX)) return null
  try {
    const b = fromBase64Url(trimmed.slice(CODE_PREFIX.length))
    let i = 0
    const next = () => {
      if (i >= b.length) throw new Error('too short')
      return b[i++]
    }
    const color = () => '#' + [next(), next(), next()].map((v) => v.toString(16).padStart(2, '0')).join('')
    const paint = (): Paint => {
      const count = next()
      if (count === 1) return { type: 'solid', color: color() }
      if (count !== 2 && count !== 3) throw new Error('bad paint')
      const angle = (next() << 8) | next()
      return { type: 'gradient', angle: angle % 360, colors: Array.from({ length: count }, color) }
    }
    if (next() !== CODE_VERSION) return null
    const background = paint()
    const primary = paint()
    const rest = Object.fromEntries(SOLID_KEYS.map((k) => [k, color()]))
    return { background, primary, ...rest } as CustomTheme
  } catch {
    return null
  }
}

/** Shape check for themes from storage, the network or another app (mirrors Wordle's zod schema). */
export function isCustomTheme(v: unknown): v is CustomTheme {
  const hex = (x: unknown) => typeof x === 'string' && /^#[0-9a-fA-F]{6}$/.test(x)
  const paint = (p: unknown) => {
    const q = p as Paint
    if (!q || typeof q !== 'object') return false
    if (q.type === 'solid') return hex(q.color)
    return q.type === 'gradient' && Array.isArray(q.colors) && q.colors.length >= 2 && q.colors.length <= 3 && q.colors.every(hex) && typeof q.angle === 'number' && q.angle >= 0 && q.angle <= 360
  }
  const t = v as CustomTheme
  return !!t && paint(t.background) && paint(t.primary) && SOLID_KEYS.every((k) => hex(t[k]))
}

/* ---------- Title shimmer (ported from Wordle Unlimited's heroColors) ---------- */

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return [h, s * 100, l * 100]
}

function hslToHex(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(c * 255).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

const colorDistance = (a: string, b: string) => {
  const [x, y] = [hexToRgb(a), hexToRgb(b)]
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2])
}

/**
 * Colour stops for the shimmering title, taken from the theme's backdrop. Each keeps
 * its hue but is brightened (or darkened on light themes) until it reads against the
 * page; a solid backdrop pairs with the button colour so there's still a gradient.
 */
export function heroColors(t: CustomTheme): string[] {
  const bg = solidBackground(t)
  const lighten = luminance(t.text) > luminance(bg)
  const visible = (c: string) => {
    const [h, s, l] = hexToHsl(c)
    // Greys have no real hue, so only saturate colours that have one.
    const sat = s >= 15 ? Math.max(s, 65) : s
    let out = c
    for (let step = 0; contrastRatio(out, bg) < 4.5 && step <= 20; step++) {
      out = hslToHex(h, step === 0 ? s : sat, Math.max(0, Math.min(100, l + (lighten ? 1 : -1) * step * 4)))
    }
    return out
  }
  const colors = (t.background.type === 'gradient' ? t.background.colors : [t.background.color, paintBase(t.primary)]).map(visible)
  for (const extra of [t.accent, paintBase(t.primary)]) {
    if (colors.some((c) => colorDistance(c, colors[0]) > 60)) break
    colors.push(visible(extra))
  }
  return colors
}

export function heroGradientStops(t: CustomTheme): string {
  const colors = heroColors(t)
  // Out and back to the first colour, so the back-and-forth slide is seamless.
  const loop = [...colors, ...colors.slice(0, -1).reverse()]
  return loop.map((c, i) => `${c} ${Math.round((i / (loop.length - 1)) * 100)}%`).join(', ')
}

/* ---------- CSS variables ---------- */

/** Every Lingora design token a custom theme sets (see :root in styles.css). */
export function themeVars(t: CustomTheme): Record<string, string> {
  const bg = solidBackground(t)
  const primary = paintBase(t.primary)
  const dark = isDarkTheme(t)
  return {
    '--bg': bg,
    '--surface': t.card,
    '--surface-2': t.key,
    '--text': t.text,
    '--muted': t.mutedText,
    '--border': t.border,
    '--primary': primary,
    '--accent': primary,
    '--on-accent': readableOn(primary),
    '--accent-gradient': t.primary.type === 'gradient' ? paintCss(t.primary) : 'none',
    '--app-bg-image': t.background.type === 'gradient' ? paintCss(t.background) : 'none',
    '--hero-gradient': heroGradientStops(t),
    '--success': t.tileCorrect,
    '--success-bg': mix(t.card, t.tileCorrect, dark ? 0.22 : 0.14),
    '--warn': t.tilePresent,
    '--warn-bg': mix(t.card, t.tilePresent, dark ? 0.22 : 0.14),
    '--danger-bg': mix(t.card, '#e5484d', dark ? 0.22 : 0.12),
    '--xp': t.accent,
    '--neutral': t.tileAbsent,
    '--shadow': dark ? '0 1px 2px rgb(0 0 0 / 30%), 0 4px 16px rgb(0 0 0 / 25%)' : '0 1px 2px rgb(20 20 40 / 6%), 0 4px 16px rgb(20 20 40 / 6%)',
    'color-scheme': dark ? 'dark' : 'light',
  }
}

export const THEME_VAR_NAMES = Object.keys(themeVars(DEFAULT_CUSTOM_THEME))
