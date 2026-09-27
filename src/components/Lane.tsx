import type { Turbine } from '../lib/types'
import { SeverityTag } from './SeverityTag'
import { ConfidenceBar } from './ConfidenceBar'
import { SignalState } from './SignalState'

interface Props {
  turbine: Turbine
  windowDays: number
  medianDays: number
  selected: boolean
  onSelect: (id: string) => void
}

/** Data/Lane: one turbine over the last six weeks. Left part = four data columns; the strip
 *  positions every mark in percent of the window, so it takes whatever width is left. */
export function Lane({ turbine: t, windowDays, medianDays, selected, onSelect }: Props) {
  const pct = (day: number) => `${((day + windowDays) / windowDays) * 100}%`
  const flag = t.flagDay
  const bandEnd = flag !== null ? Math.min(0, flag + windowDays) : 0
  const median = flag !== null ? flag + medianDays : null
  const medianIn = median !== null && median <= 0
  const medianDue = median !== null && median > 0 ? Math.round(median) : null

  return (
    <div
      className={`lane lane--${t.severity}${selected ? ' lane--selected' : ''}`}
      role="row"
      aria-selected={selected}
      tabIndex={0}
      onClick={() => onSelect(t.id)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(t.id) } }}
    >
      <span className="lane__bar" aria-hidden="true" />
      <div className="lane__left">
        <span className="lane__cell lane__cell--turbine" role="cell">{t.id}</span>
        <span className="lane__cell lane__cell--severity" role="cell"><SeverityTag level={t.severity} /></span>
        <span className="lane__cell lane__cell--confidence" role="cell"><ConfidenceBar value={t.confidence} /></span>
        <span className="lane__cell lane__cell--since" role="cell">
          {t.sinceDays !== null ? `${t.sinceDays} d` : <span className="lane__none" aria-label="no flag">–</span>}
        </span>
      </div>
      <div className="lane__strip" role="cell" aria-label={`${t.marks.length} events in ${windowDays} days`}>
       <div className="lane__scale">
        {Array.from({ length: windowDays / 7 - 1 }, (_, i) => (
          <i key={i} className="lane__week" style={{ left: pct(-windowDays + (i + 1) * 7) }} />
        ))}
        {flag !== null && (
          <>
            <i className="lane__band" style={{ left: pct(Math.max(flag, -windowDays)), width: `calc(${pct(bandEnd)} - ${pct(Math.max(flag, -windowDays))})` }} />
            {flag >= -windowDays && <i className="lane-mark lane-mark--flag" style={{ left: pct(flag) }} title={`flagged ${t.sinceDays} d ago`} />}
            {medianIn && (
              <i className="lane-mark lane-mark--median" style={{ left: pct(median!) }}>
                <span className="lane-mark__label">median {medianDays} d</span>
              </i>
            )}
            {medianDue !== null && (
              <span className="lane__due" title="median lead time from flag to outage, counted on the fleet">median outage in {medianDue} d</span>
            )}
          </>
        )}
        {t.marks.map((m, i) => {
          if (m.kind === 'outage') {
            return <i key={i} className="lane-mark lane-mark--outage" style={{ left: pct(m.day), width: `max(3px, calc(${(m.hours / 24 / windowDays) * 100}%))` }} title={`${m.message} · ${m.hours.toFixed(1)} h`} />
          }
          if (m.kind === 'service') {
            const title = `${m.message} · ${m.hours.toFixed(1)} h`
            return (
              <span key={i}>
                {m.hours >= 4 && <i className="lane-mark lane-mark--stop" style={{ left: pct(m.day), width: `calc(${(m.hours / 24 / windowDays) * 100}%)` }} title={title} />}
                <i className="lane-mark lane-mark--service" style={{ left: pct(m.day) }} title={title} />
              </span>
            )
          }
          if (m.kind === 'note') {
            return <i key={i} className="lane-mark lane-mark--note" style={{ left: pct(m.day) }} title={m.message} />
          }
          return <i key={i} className="lane-mark lane-mark--alarm" style={{ left: pct(m.day) }} title={`${m.message} · ${Math.round(m.hours * 60)} min`} />
        })}
       </div>
        {t.signal !== 'live' && <span className="lane__signal"><SignalState state={t.signal} /></span>}
      </div>
    </div>
  )
}
