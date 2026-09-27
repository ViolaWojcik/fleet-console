import { useState } from 'react'
import type { TodayEvent } from '../lib/types'

/** Events/EventRow: time · turbine · message; the mark repeats the lane's vocabulary. */
export function EventRow({ e, turbineId }: { e: TodayEvent; turbineId: string }) {
  return (
    <li className={`event-row event-row--${e.kind}`}>
      <i className={`event-row__mark lane-mark--${e.kind === 'routine' ? 'note' : e.kind}`} aria-hidden="true" />
      <span className="event-row__time">{e.time}</span>
      <span className="event-row__turbine">{turbineId}</span>
      <span className={`event-row__message${e.status === 'Warning' ? ' event-row__message--warning' : ''}`}>
        {e.message}{e.hours >= 1 && <span className="event-row__dur"> · {e.hours.toFixed(1)} h</span>}
      </span>
    </li>
  )
}

/** Events/EventGroup: "142 routine events", collapsed by default. Noise is counted, not hidden. */
export function EventGroup({ count, kinds, span }: { count: number; kinds: string[]; span: string }) {
  const [open, setOpen] = useState(false)
  if (count === 0) return null
  return (
    <li className={`event-group${open ? ' event-group--expanded' : ''}`}>
      <button type="button" className="event-group__head" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="event-group__count">{count} routine events</span>
        <span className="event-group__meta">{span} · {kinds.map(k => k.toLowerCase()).join(', ')}</span>
        <span className="link event-group__toggle">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <p className="event-group__body">
          {kinds.map(k => <span key={k} className="event-group__kind">{k}</span>)}
        </p>
      )}
    </li>
  )
}
