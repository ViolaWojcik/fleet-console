import type { Freshness } from '../lib/types'

/** Evidence/ProvenanceLine: "source · live / stale 3 d / no data / counted", mono 10. */
export function ProvenanceLine({ source, freshness, staleDays }:
  { source: string; freshness: Freshness; staleDays?: number }) {
  const word = freshness === 'stale' ? `stale ${staleDays ?? '?'} d`
    : freshness === 'missing' ? 'no data'
    : freshness === 'counted' ? 'counted' : 'live'
  return <span className={`provenance provenance--${freshness}`}>{source} · {word}</span>
}
