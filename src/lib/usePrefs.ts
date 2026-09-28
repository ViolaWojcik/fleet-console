import { useEffect, useState } from 'react'
import type { Density, Mode } from './types'
import { isNight } from './sun'

const KEY = 'fleet-console:prefs'

interface Prefs { density: Density; pinnedMode: Mode | null }

function read(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { density: 'default', pinnedMode: null, ...JSON.parse(raw) }
  } catch { /* private window or blocked storage: fall through */ }
  return { density: 'default', pinnedMode: null }
}

/** Density and colour mode. Mode follows the site's sunset unless the operator pins one. */
export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(read)
  const [night, setNight] = useState(() => isNight())

  useEffect(() => {
    const id = setInterval(() => setNight(isNight()), 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)) } catch { /* ignore */ }
  }, [prefs])

  const mode: Mode = prefs.pinnedMode ?? (night ? 'dark' : 'light')

  return {
    density: prefs.density,
    setDensity: (density: Density) => setPrefs(p => ({ ...p, density })),
    mode,
    autoMode: prefs.pinnedMode === null,
    night,
    pinMode: (m: Mode | null) => setPrefs(p => ({ ...p, pinnedMode: m })),
  }
}
