import type { Evidence } from '../lib/types'
import { ProvenanceLine } from './ProvenanceLine'

/** Evidence/EvidenceItem: a square raises, a circle lowers; label, provenance, weight in mono. */
export function EvidenceItem({ item, source = true, weight = true }:
  { item: Evidence; source?: boolean; weight?: boolean }) {
  const w = item.weight
  return (
    <li className={`evidence-item evidence-item--${item.direction}`}>
      <i className="evidence-item__mark" aria-hidden="true" />
      <span className="evidence-item__body">
        <span className="evidence-item__label">{item.label}</span>
        {source && <ProvenanceLine source={item.source} freshness={item.freshness} staleDays={item.staleDays} />}
      </span>
      {weight && <span className="evidence-item__weight">{w > 0 ? `+${w.toFixed(2)}` : `−${Math.abs(w).toFixed(2)}`}</span>}
    </li>
  )
}
