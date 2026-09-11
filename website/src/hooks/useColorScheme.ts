import { useSyncExternalStore } from 'react'
import type { ColorScheme } from '@/lib/palette'

const query = () => window.matchMedia('(prefers-color-scheme: dark)')

function subscribe(onChange: () => void) {
  const mql = query()
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/** Follows the OS setting, matching the CSS tokens in index.css. */
export function useColorScheme(): ColorScheme {
  return useSyncExternalStore(subscribe, () => (query().matches ? 'dark' : 'light'))
}
