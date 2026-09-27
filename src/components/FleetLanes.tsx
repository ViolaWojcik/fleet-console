import type { ReactNode } from 'react'
import type { Fleet } from '../lib/types'
import { ColumnHeader } from './ColumnHeader'
import { Lane } from './Lane'

interface Props {
  fleet: Fleet
  selected: string | null
  onSelect: (id: string | null) => void
  /** rendered inline, directly under the selected lane (the evidence panel) */
  panel?: ReactNode
}

/** The lanes block: axis row (four column headers + the week scale) and one Lane per turbine. */
export function FleetLanes({ fleet, selected, onSelect, panel }: Props) {
  const w = fleet.windowDays
  const ticks = Array.from({ length: w / 7 }, (_, i) => -w + i * 7)
  return (
    <div className="lanes" role="grid" aria-label="Fleet, one lane per turbine, last six weeks">
      <div className="lanes__axis" role="row">
        <div className="lanes__axis-left">
          <ColumnHeader label="Turbine" width="var(--layout-lane-col-turbine)" />
          <ColumnHeader label="Severity" width="var(--layout-lane-col-severity)" />
          <ColumnHeader label="Confidence" width="var(--layout-lane-col-confidence)" />
          <ColumnHeader label="Since" width="var(--layout-lane-col-since)" />
          <ColumnHeader label="Median" width="var(--layout-lane-col-median)" />
        </div>
        <div className="lanes__axis-strip" role="columnheader" aria-label={`last ${w} days`}>
          <div className="lanes__axis-scale">
            {ticks.map(d => (
              <span key={d} className="lanes__tick" style={{ left: `${((d + w) / w) * 100}%` }}>{`−${-d} d`}</span>
            ))}
            <span className="lanes__tick lanes__tick--now">now</span>
          </div>
        </div>
      </div>
      {fleet.turbines.map(t => (
        <div key={t.id} className="lanes__item">
          <Lane turbine={t} windowDays={w} medianDays={fleet.base.medianDays}
            selected={selected === t.id} onSelect={id => onSelect(selected === id ? null : id)} />
          {selected === t.id && panel}
        </div>
      ))}
    </div>
  )
}
