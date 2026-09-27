import type { Density, Mode, View } from '../lib/types'

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
export function FleetToolbar({ meta, view, onView, density, onDensity, mode, autoMode, onPinMode, count }: Props) {
  return (
    <header className="toolbar">
      <div className="toolbar__title-row">
        <h1 className="toolbar__title">Fleet</h1>
        <span className="toolbar__meta">
          {meta}
          {' · '}
          <button type="button" className="link" onClick={() => onPinMode(mode === 'dark' ? 'light' : 'dark')}>
            {mode === 'dark' ? 'switch to day' : 'switch to night'}
          </button>
          {!autoMode && <>{' · '}<button type="button" className="link" onClick={() => onPinMode(null)}>follow sunset</button></>}
        </span>
        <nav className="toolbar__links" aria-label="share">
          <a className="link" href="#share">Share view</a>
          <a className="link" href="#handover">Handover summary</a>
        </nav>
      </div>
      <div className="toolbar__controls">
        <form className="querybar" role="search" onSubmit={e => e.preventDefault()}>
          <input className="querybar__input" type="search" placeholder="Ask the fleet" aria-label="Ask the fleet" />
          <kbd className="querybar__kbd">⌘ K</kbd>
          <button type="button" className="link">Speak</button>
        </form>
        <Segmented<View> label="view" value={view} onChange={onView}
          options={[{ value: 'lanes', label: 'Lanes' }, { value: 'table', label: 'Table' }]} />
        <Segmented<Density> label="density" value={density} onChange={onDensity}
          options={[{ value: 'compact', label: 'Compact' }, { value: 'default', label: 'Default' }, { value: 'comfortable', label: 'Comfortable' }]} />
        <span className="toolbar__count">{count}</span>
      </div>
    </header>
  )
}
