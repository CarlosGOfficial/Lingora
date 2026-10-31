import { useCallback, useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { api } from '../sync/api'
import type { SavedTheme } from '../sync/types'
import { MAX_SAVED_THEMES, isCustomTheme, type CustomTheme } from './themes'

const LOCAL_KEY = 'lingora-saved-themes'

function readLocal(): SavedTheme[] {
  try {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as SavedTheme[]
    return Array.isArray(list) ? list.filter((t) => isCustomTheme(t.theme)) : []
  } catch {
    return []
  }
}

function writeLocal(list: SavedTheme[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list))
  } catch {
    /* storage full or blocked */
  }
}

/**
 * Saved theme slots (max 10). Signed in, they live in the account (the same
 * saved_themes rows Wordle Unlimited uses, so slots show up in both apps);
 * signed out, they stay on this device.
 */
export function useSavedThemes() {
  const signedIn = useStore((s) => !!s.account)
  const [themes, setThemes] = useState<SavedTheme[]>(() => (signedIn ? [] : readLocal()))
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!signedIn) return setThemes(readLocal())
    try {
      setThemes(await api.themes())
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [signedIn])

  useEffect(() => {
    void reload()
  }, [reload])

  const guard = async (fn: () => Promise<void>) => {
    try {
      await fn()
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return {
    themes,
    error,
    full: themes.length >= MAX_SAVED_THEMES,
    save: (name: string, theme: CustomTheme) =>
      guard(async () => {
        if (themes.length >= MAX_SAVED_THEMES) throw new Error(`All ${MAX_SAVED_THEMES} slots are full. Delete or update one first.`)
        if (signedIn) await api.saveTheme(name, theme)
        else writeLocal([...readLocal(), { id: String(Date.now()), name: name.slice(0, 30), theme, updatedAt: new Date().toISOString() }])
        await reload()
      }),
    update: (id: string, theme: CustomTheme) =>
      guard(async () => {
        if (signedIn) await api.updateTheme(id, { theme })
        else writeLocal(readLocal().map((t) => (t.id === id ? { ...t, theme, updatedAt: new Date().toISOString() } : t)))
        await reload()
      }),
    remove: (id: string) =>
      guard(async () => {
        if (signedIn) await api.deleteTheme(id)
        else writeLocal(readLocal().filter((t) => t.id !== id))
        await reload()
      }),
  }
}
