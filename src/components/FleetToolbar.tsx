import { useState } from 'react'
import type { Density, Mode, View } from '../lib/types'
import { href } from '../lib/router'
import { useCopy } from '../lib/useCopy'
import { dictate } from '../lib/dictate'

interface Props {
  meta: string
  view: View
  onView: (v: View) => void
  density: Density
  onDensity: (d: Density) => void
  mode: Mode
  autoMode: boolean
  onPinMode: (m: Mode | null) => void
  count: string
  query: string
  onQuery: (q: string) => void
  intent: string
  handoverId: string
}

function Segmented<T extends string>({ label, value, options, onChange }:
  { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value}
          className={`segmented__item${value === o.value ? ' segmented__item--on' : ''}`}
          onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Data/FleetToolbar: title row and the control row (QueryBar, view, density, count). */
export function FleetToolbar({ meta, view, onView, density, onDensity, mode, autoMode, onPinMode, count, query, onQuery, intent, handoverId }: Props) {
  const share = useCopy()
  const [listening, setListening] = useState(false)
  return (
    <header className="toolbar">
      <div className="toolbar__title-row">
        <h1 className="toolbar__title">Fleet</h1>
        <span className="toolbar__meta">
          {meta}
        </span>
        <nav className="toolbar__links" aria-label="share">
          <button type="button" className="link" onClick={() => share.copy(window.location.href)}>{share.copied ? 'Link copied' : 'Share view'}</button>
          <a className="link" href={href({ screen: 'history', id: handoverId })}>Handover summary</a>
        </nav>
      </div>
      <div className="toolbar__controls">
        <form className="querybar" role="search" onSubmit={e => e.preventDefault()}>
          <input className="querybar__input" type="search" placeholder="Ask the fleet" aria-label="Ask the fleet"
            value={query} onChange={e => onQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') { onQuery(''); (e.target as HTMLInputElement).blur() } }} />
          <kbd className="querybar__kbd">⌘ K</kbd>
          <button type="button" className="link" aria-pressed={listening}
            onClick={() => dictate(setListening, text => onQuery(text))}>{listening ? 'Listening…' : 'Speak'}</button>
        </form>
        <Segmented<View> label="view" value={view} onChange={onView}
          options={[{ value: 'lanes', label: 'Lanes' }, { value: 'table', label: 'Table' }]} />
        <Segmented<Density> label="density" value={density} onChange={onDensity}
          options={[{ value: 'compact', label: 'Compact' }, { value: 'default', label: 'Default' }, { value: 'comfortable', label: 'Comfortable' }]} />
        <Segmented<'light' | 'dark' | 'auto'> label="colour mode" value={autoMode ? 'auto' : mode}
          onChange={v => onPinMode(v === 'auto' ? null : v)}
          options={[{ value: 'light', label: 'Day' }, { value: 'dark', label: 'Night' }, { value: 'auto', label: 'Sunset' }]} />
        <span className="toolbar__count">{count}</span>
      </div>
      {intent && <p className="querybar__intent" role="status">{intent}</p>}
    </header>
  )
}
