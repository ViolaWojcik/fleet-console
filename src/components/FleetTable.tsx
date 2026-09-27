import { useState } from 'react'
import type { Fleet, Turbine } from '../lib/types'
import { signals } from '../lib/signals'
import { href } from '../lib/router'
import { SeverityTag } from './SeverityTag'
import { ConfidenceBar } from './ConfidenceBar'
import { SignalState } from './SignalState'
import { Sparkline } from './Sparkline'

type Key = 'id' | 'severity' | 'power' | 'gearOil' | 'particles' | 'confidence' | 'since' | 'median'
const ORDER = { stop: 0, act: 1, watch: 2, clear: 3 }

function medianText(t: Turbine, medianDays: number): { text: string; late: boolean } | null {
  if (t.flagDay === null) return null
  const due = t.flagDay + medianDays
  return due > 0 ? { text: `in ${Math.round(due)} d`, late: false } : { text: `${Math.round(-due)} d late`, late: true }
}

function DataCell({ value, unit, align = 'end', digits = 0 }:
  { value: number | null | undefined; unit?: string; align?: 'start' | 'end'; digits?: number }) {
  if (value === null || value === undefined) return <td className="cell cell--missing"><SignalState state="missing" /></td>
  const rounded = Number(value.toFixed(digits)) || 0   // never print "-0"
  return <td className={`cell cell--${align}`}>{rounded.toLocaleString('en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits }).replace(/,/g, ' ')}{unit}</td>
}

/** Fleet / table: the same row component (FleetRow) at any density, sorted by severity. */
export function FleetTable({ fleet, selected, onSelect }:
  { fleet: Fleet; selected: string | null; onSelect: (id: string | null) => void }) {
  const [sort, setSort] = useState<{ key: Key; dir: 'asc' | 'desc' }>({ key: 'severity', dir: 'desc' })
  const sig = (t: Turbine) => signals.turbines[t.id]
  const rows = [...fleet.turbines].sort((a, b) => {
    const v = (t: Turbine): number | string => {
      switch (sort.key) {
        case 'id': return t.id
        case 'severity': return -ORDER[t.severity] * 10 - t.confidence
        case 'power': return sig(t)?.at.power ?? -1
        case 'gearOil': return sig(t)?.at.gearOil ?? -1
        case 'particles': return sig(t)?.at.particles ?? -1
        case 'confidence': return t.confidence
        case 'since': return t.sinceDays ?? -1
        case 'median': return t.flagDay === null ? -999 : t.flagDay + fleet.base.medianDays
      }
    }
    const x = v(a), y = v(b)
    const c = typeof x === 'string' ? x.localeCompare(y as string) : x - (y as number)
    return sort.dir === 'asc' ? c : -c
  })
  const th = (key: Key, label: string, align: 'start' | 'end' = 'start') => {
    const on = sort.key === key
    return (
      <th className={`column-header column-header--${align}${on ? ' column-header--on' : ''}`} aria-sort={on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button type="button" className="column-header__btn" onClick={() => setSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))}>
          {label}<span className="column-header__sort" aria-hidden="true">{on ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
        </button>
      </th>
    )
  }
  return (
    <table className="table" aria-label="Fleet, one row per turbine">
      <thead>
        <tr>
          {th('id', 'Turbine')}{th('severity', 'Severity')}{th('power', 'Power kW', 'end')}{th('gearOil', 'Gear oil °C', 'end')}
          {th('particles', 'Particles/h', 'end')}{th('confidence', 'Confidence')}{th('since', 'Since flag')}{th('median', 'Median')}
          <th className="column-header">Trend</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(t => {
          const s = sig(t); const m = medianText(t, fleet.base.medianDays)
          return (
            <tr key={t.id} className={`fleet-row fleet-row--${t.severity}${selected === t.id ? ' fleet-row--selected' : ''}`}
              tabIndex={0} aria-selected={selected === t.id}
              onClick={() => onSelect(selected === t.id ? null : t.id)}
              onKeyDown={e => { if (e.key === 'Enter') onSelect(t.id) }}>
              <td className="cell cell--turbine"><span className="fleet-row__bar" aria-hidden="true" /><a className="cell__id" href={href({ screen: 'turbine', id: t.id })} onClick={e => e.stopPropagation()}>{t.id}</a></td>
              <td className="cell cell--text"><SeverityTag level={t.severity} /></td>
              <DataCell value={s?.at.power} />
              <DataCell value={s?.at.gearOil} digits={1} />
              <DataCell value={s?.at.particles} />
              <td className="cell"><ConfidenceBar value={t.confidence} /></td>
              <td className="cell">{t.sinceDays !== null ? `${t.sinceDays} d` : <span className="lane__none">–</span>}</td>
              <td className={`cell cell--median${m?.late ? ' cell--late' : ''}`}>{m ? m.text : <span className="lane__none">–</span>}</td>
              <td className="cell cell--trend"><Sparkline points={s?.spark} threshold={signals.threshold.particles} /></td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
