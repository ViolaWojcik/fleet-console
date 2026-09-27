/** Charts/Sparkline: 80×20, the six-week particle trend against the alarm threshold (dashed).
 *  Nulls break the line; no data at all says so in words. */
export function Sparkline({ points, threshold, width = 80, height = 20 }:
  { points: (number | null)[] | undefined; threshold?: number; width?: number; height?: number }) {
  const vals = (points ?? []).filter((v): v is number => v !== null)
  if (!points || vals.length < 2) return <span className="sparkline sparkline--missing">no data</span>
  const max = Math.max(...vals, threshold ?? 0) || 1
  const min = Math.min(...vals, threshold ?? Infinity)
  const y = (v: number) => height - 2 - ((v - min) / (max - min || 1)) * (height - 4)
  const x = (i: number) => (i / (points.length - 1)) * width
  let d = ''
  points.forEach((v, i) => { d += v === null ? '' : `${d && points[i - 1] !== null ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}` })
  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="six-week trend">
      {threshold !== undefined && <line x1="0" x2={width} y1={y(threshold)} y2={y(threshold)} className="sparkline__ref" />}
      <path d={d} className="sparkline__line" />
    </svg>
  )
}
