import { useLayoutEffect } from 'react'
import { SHOP_ITEM_BY_ID } from '../shop/catalog'
import { ownedItems } from '../shop/wallet'
import { useStore } from '../store/useStore'
import { THEME_VAR_NAMES, themeVars, type CustomTheme } from './themes'

/** The custom/shop theme currently in effect, or null for the built-in light/dark. */
export function useActiveTheme(): CustomTheme | null {
  const { theme, custom } = useStore((s) => s.appearance)
  const shop = useStore((s) => s.shop)
  if (theme === 'custom') return custom
  if (theme.startsWith('th_') && ownedItems(shop).has(theme)) return SHOP_ITEM_BY_ID.get(theme)?.theme ?? null
  return null
}

/** Writes the chosen theme onto <html>: a data-theme attribute plus, for custom themes, CSS variables. */
export function ThemeApplier() {
  const choice = useStore((s) => s.appearance.theme)
  const active = useActiveTheme()

  // Painted during the commit (a layout effect), so a theme change shows in the same frame.
  useLayoutEffect(() => {
    const root = document.documentElement
    for (const name of THEME_VAR_NAMES) root.style.removeProperty(name)
    if (active) {
      root.dataset.theme = 'custom'
      for (const [name, value] of Object.entries(themeVars(active))) root.style.setProperty(name, value)
    } else if (choice === 'light' || choice === 'dark') {
      root.dataset.theme = choice
    } else {
      delete root.dataset.theme
    }
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', getComputedStyle(root).getPropertyValue('--surface').trim() || '#5b5bd6')
  }, [choice, active])

  return null
}
