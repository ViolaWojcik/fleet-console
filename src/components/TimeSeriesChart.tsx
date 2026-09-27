export interface Series {
  label: string
  points: (number | null)[]        // evenly spaced across the window, oldest first
  style: 'solid' | 'dashed' | 'dotted'
  marker: 'square' | 'ring' | 'triangle'
  unit?: string
}

interface Props {
  series: Series[]
  windowDays: number
  threshold?: { value: number; label: string }
  flagDay?: number | null
  sinceDays?: number | null
  width?: number
  height?: number
}

/** Charts/TimeSeriesChart: three series told apart by line style and marker shape, never hue.
 *  A gap in a line is a gap in the data; the chart does not draw through it. */
export function TimeSeriesChart({ series, windowDays, threshold, flagDay, sinceDays, width = 720, height = 240 }: Props) {
  const pad = { l: 40, r: 12, t: 16, b: 24 }
  const W = width - pad.l - pad.r, H = height - pad.t - pad.b
  const all = series.flatMap(s => s.points.filter((v): v is number => v !== null))
  if (threshold) all.push(threshold.value)
  const max = Math.max(1, ...all), min = 0
  const nice = Math.pow(10, Math.floor(Math.log10(max)))
  const top = Math.ceil(max / (nice / 2)) * (nice / 2)
  const y = (v: number) => pad.t + H - ((v - min) / (top - min)) * H
  const xDay = (d: number) => pad.l + ((d + windowDays) / windowDays) * W
  const ticks = Array.from({ length: windowDays / 7 + 1 }, (_, i) => -windowDays + i * 7)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => top * f)

  function path(pts: (number | null)[]) {
    let d = ''
    pts.forEach((v, i) => {
      if (v === null) return
      const x = pad.l + (i / (pts.length - 1)) * W
      d += `${d && pts[i - 1] !== null ? 'L' : 'M'}${x.toFixed(1)},${y(v).toFixed(1)}`
    })
    return d
  }
  function last(pts: (number | null)[]) {
    for (let i = pts.length - 1; i >= 0; i--) if (pts[i] !== null) return { x: pad.l + (i / (pts.length - 1)) * W, y: y(pts[i]!) }
    return null
  }
  const empty = all.length === 0 || series.every(s => s.points.every(v => v === null))

  return (
    <svg className="chart" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img"
      aria-label={`${series.map(s => s.label).join(', ')} over the last ${windowDays} days`}>
      {yTicks.map(v => (
        <g key={v}>
          <line x1={pad.l} x2={width - pad.r} y1={y(v)} y2={y(v)} className="chart__grid" />
          <text x={pad.l - 6} y={y(v) + 3} className="chart__tick chart__tick--y">{Math.round(v)}</text>
        </g>
      ))}
      {ticks.map(d => (
        <text key={d} x={xDay(d)} y={height - 6} className={`chart__tick${d === 0 ? ' chart__tick--now' : ''}`}>{d === 0 ? 'now' : `−${-d} d`}</text>
      ))}
      {threshold && (
        <g>
          <line x1={pad.l} x2={width - pad.r} y1={y(threshold.value)} y2={y(threshold.value)} className="chart__ref" />
          <text x={pad.l + 4} y={y(threshold.value) - 4} className="chart__label">{threshold.label}</text>
        </g>
      )}
      {flagDay !== null && flagDay !== undefined && flagDay >= -windowDays && (
        <g>
          <line x1={xDay(flagDay)} x2={xDay(flagDay)} y1={pad.t} y2={pad.t + H} className="chart__flag" />
          <text x={xDay(flagDay) + 5} y={pad.t + 8} className="chart__label">flag · {sinceDays} d ago</text>
        </g>
      )}
      {series.map(s => {
        const end = last(s.points)
        return (
          <g key={s.label} className={`chart__series chart__series--${s.style}`}>
            <path d={path(s.points)} />
            {end && (s.marker === 'square' ? <rect x={end.x - 3} y={end.y - 3} width="6" height="6" className="chart__marker" />
              : s.marker === 'ring' ? <circle cx={end.x} cy={end.y} r="3" className="chart__marker chart__marker--ring" />
              : <path d={`M${end.x},${end.y - 4}L${end.x + 4},${end.y + 3}L${end.x - 4},${end.y + 3}Z`} className="chart__marker" />)}
          </g>
        )
      })}
      {empty && <text x={pad.l + W / 2} y={pad.t + H / 2} className="chart__empty">no data in this window</text>}
    </svg>
  )
}

/** Charts/SeriesLegend: swatches repeat the line style and the marker. */
export function SeriesLegend({ series, reference }: { series: Series[]; reference?: string }) {
  return (
    <ul className="legend">
      {series.map(s => (
        <li key={s.label} className="legend__item">
          <svg width="28" height="10" viewBox="0 0 28 10" aria-hidden="true" className={`chart__series chart__series--${s.style}`}>
            <path d="M0,5H28" />
            {s.marker === 'square' ? <rect x="11" y="2" width="6" height="6" className="chart__marker" />
              : s.marker === 'ring' ? <circle cx="14" cy="5" r="3" className="chart__marker chart__marker--ring" />
              : <path d="M14,1L18,8L10,8Z" className="chart__marker" />}
          </svg>
          {s.label}
        </li>
      ))}
      {reference && (
        <li className="legend__item">
          <svg width="28" height="10" viewBox="0 0 28 10" aria-hidden="true"><path d="M0,5H28" className="chart__ref" /></svg>
          {reference}
        </li>
      )}
    </ul>
  )
}
