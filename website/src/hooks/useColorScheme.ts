import { useCallback, useSyncExternalStore } from 'react'
import type { ColorScheme } from '@/lib/palette'

const STORAGE_KEY = 'myexpense.theme'
type SchemeOrSystem = ColorScheme | 'system'

const osQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

function applyTheme(theme: SchemeOrSystem) {
  const root = document.documentElement
  if (theme === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

function readStored(): SchemeOrSystem {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as SchemeOrSystem | null
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    // ignore
  }
  return 'system'
}

function getSnapshot() {
  const stored = readStored()
  if (stored !== 'system') return stored
  return osQuery().matches ? 'dark' : 'light'
}

function subscribe(onChange: () => void) {
  const mql = osQuery()
  const handler = () => onChange()
  mql.addEventListener('change', handler)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange()
  }
  window.addEventListener('storage', onStorage)
  // Fire on local writes as well (same tab) via a custom event
  const onLocal = (e: Event) => {
    if ((e as CustomEvent).detail?.key === STORAGE_KEY) onChange()
  }
  window.addEventListener('__theme_change__', onLocal)
  return () => {
    mql.removeEventListener('change', handler)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('__theme_change__', onLocal)
  }
}

function writeStore(value: SchemeOrSystem) {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('__theme_change__', { detail: { key: STORAGE_KEY } }))
}

/** Initialize on module load so first paint matches the stored/system theme. */
if (typeof document !== 'undefined') {
  applyTheme(readStored())
}

export function useColorScheme(): ColorScheme {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function useThemeToggle() {
  const scheme = useColorScheme()
  const stored = useSyncExternalStore(
    subscribe,
    () => readStored(),
    () => readStored(),
  )
  const cycle = useCallback(() => {
    const cur = readStored()
    const order: SchemeOrSystem[] = ['system', 'light', 'dark']
    const next = order[(order.indexOf(cur) + 1) % order.length]
    writeStore(next)
    applyTheme(next)
  }, [])
  const setLight = useCallback(() => {
    writeStore('light')
    applyTheme('light')
  }, [])
  const setDark = useCallback(() => {
    writeStore('dark')
    applyTheme('dark')
  }, [])
  const setSystem = useCallback(() => {
    writeStore('system')
    applyTheme('system')
  }, [])
  return { scheme, stored, cycle, setLight, setDark, setSystem }
}
