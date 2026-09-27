import type { Decision } from '../lib/decisions'
import { REASON_LABEL } from '../lib/decisions'

const VERB: Record<Decision['kind'], string> = {
  sent: 'Sent to service', watched: 'Kept watching', disagreed: 'Disagreed', auto: 'Auto-flagged by model',
}

/** Evidence/HistoryEntry: time in mono, verb, author; the reason only for disagreed and auto. */
export function HistoryEntry({ d, author = true }: { d: Decision; author?: boolean }) {
  const reason = d.kind === 'disagreed' ? [d.reason && REASON_LABEL[d.reason], d.note].filter(Boolean).join(' · ')
    : d.kind === 'auto' ? d.note : undefined
  return (
    <li className={`history-entry history-entry--${d.kind}`}>
      <span className="history-entry__time">{d.label}</span>
      <span className="history-entry__body">
        <span className="history-entry__verb">{VERB[d.kind]}</span>
        {author && d.kind !== 'auto' && <span className="history-entry__author">{d.author}</span>}
        {reason && <span className="history-entry__reason">{reason}</span>}
      </span>
    </li>
  )
}
