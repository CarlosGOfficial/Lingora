import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { itemsIn } from '../shop/catalog'
import { useWallet } from '../shop/useWallet'
import { useStore } from '../store/useStore'
import { paintBase, paintCss, type CustomTheme, type ThemeChoice } from './themes'

export const themeSwatch = (t: CustomTheme): React.CSSProperties => ({
  background: paintCss(t.background),
  boxShadow: `inset 0 0 0 4px ${t.card}`,
  borderColor: paintBase(t.primary),
})
const swatch = themeSwatch

/** Palette button: quick switch between built-in, owned and custom themes. */
export function ThemeMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { theme, custom } = useStore((s) => s.appearance)
  const setTheme = useStore((s) => s.setTheme)
  const { owned } = useWallet()
  const themes = itemsIn('theme').filter((i) => owned.has(i.id))

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const option = (choice: ThemeChoice, label: string, preview?: React.CSSProperties) => (
    <button
      key={choice}
      role="menuitemradio"
      aria-checked={theme === choice}
      className={`menu-item ${theme === choice ? 'active' : ''}`}
      onClick={() => {
        setTheme(choice)
        setOpen(false)
      }}
    >
      <span className="menu-swatch" style={preview} />
      {label}
      {theme === choice && <Icon name="check" size={16} className="menu-check" />}
    </button>
  )

  return (
    <div className="menu-wrap" ref={ref}>
      <button className="icon-btn" aria-label="Theme" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name="palette" />
      </button>
      {open && (
        <div className="menu" role="menu">
          {option('light', 'Light', { background: '#f6f6fb', boxShadow: 'inset 0 0 0 4px #ffffff' })}
          {option('dark', 'Dark', { background: '#11121a', boxShadow: 'inset 0 0 0 4px #1a1c27' })}
          {option('system', 'Match my device', { background: 'linear-gradient(135deg, #f6f6fb 50%, #11121a 50%)' })}
          {themes.length > 0 && <div className="menu-label">Your themes</div>}
          {themes.map((t) => option(t.id as ThemeChoice, t.name, swatch(t.theme!)))}
          <div className="menu-label">Custom</div>
          {option('custom', 'My custom theme', swatch(custom))}
          <Link className="menu-item" to="/themes" onClick={() => setOpen(false)}>
            <Icon name="palette" size={16} /> Theme Studio…
          </Link>
          <Link className="menu-item" to="/shop?tab=theme" onClick={() => setOpen(false)}>
            <Icon name="bag" size={16} /> Get more themes
          </Link>
        </div>
      )}
    </div>
  )
}
