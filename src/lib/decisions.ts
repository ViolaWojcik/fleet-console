import { useCallback, useEffect, useState } from 'react'
import type { Turbine } from './types'

export type DecisionKind = 'sent' | 'watched' | 'disagreed' | 'auto'
export type Reason = 'sensor-suspect' | 'recent-service' | 'weather' | 'other'

export const REASON_LABEL: Record<Reason, string> = {
  'sensor-suspect': 'sensor suspect',
  'recent-service': 'recent service explains it',
  weather: 'weather event',
  other: 'other',
}

export interface Decision {
  id: string
  turbineId: string
  kind: DecisionKind
  author: string          // "model" for auto entries
  at: string              // ISO; the console clock plus the real time of day for a person's call
  label: string           // "Jan 3", "17:14"
  reason?: Reason
  note?: string
}

export const OPERATOR = 'A. Berg'
export const NEXT_OPERATOR = 'M. Solheim'
const KEY = 'fleet-console:decisions'

function read(): Decision[] {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw) } catch { /* ignore */ }
  return []
}

function nowLabel() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

/** The model's own line, from the data: dated the day of the flag, not now. */
export function autoEntry(t: Turbine, clock: string): Decision | null {
  if (t.flagDay === null) return null
  // a replayed lane keeps its own calendar: the flag is dated on the replay clock, not the console's
  const base = t.replayedFrom ? new Date(`${t.replayedFrom}T12:00:00Z`) : new Date(clock)
  const d = new Date(base.getTime() + t.flagDay * 86400000)
  return {
    id: `auto-${t.id}`, turbineId: t.id, kind: 'auto', author: 'model', at: d.toISOString(),
    label: d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    note: `confidence ${(t.confidenceAtFlag ?? t.confidence).toFixed(2)} at flag`,
  }
}

/** Every call an operator makes, kept in localStorage. Nothing is deleted: Undo removes the
 *  last line only while the confirmation is still on screen; after that a reversal is a new line. */
export function useDecisions() {
  const [list, setList] = useState<Decision[]>(read)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore */ } }, [list])

  const add = useCallback((d: Omit<Decision, 'id' | 'at' | 'label' | 'author'> & { author?: string }) => {
    const entry: Decision = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, author: OPERATOR,
      at: new Date().toISOString(), label: nowLabel(), ...d }
    setList(l => [entry, ...l])
    return entry
  }, [])

  const remove = useCallback((id: string) => setList(l => l.filter(d => d.id !== id)), [])
  const reset = useCallback(() => setList([]), [])
  const forTurbine = useCallback((id: string) => list.filter(d => d.turbineId === id), [list])

  return { list, add, remove, reset, forTurbine }
}
