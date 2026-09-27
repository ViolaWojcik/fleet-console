/** Data/DeltaIndicator: direction as a glyph and a signed number; missing says so. */
export function DeltaIndicator({ value, unit = '%', digits = 0 }: { value: number | null | undefined; unit?: string; digits?: number }) {
  if (value === null || value === undefined) return <span className="delta delta--missing">–</span>
  const dir = Math.abs(value) < 0.5 ? 'flat' : value > 0 ? 'up' : 'down'
  const glyph = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '–'
  return (
    <span className={`delta delta--${dir}`}>
      <span className="delta__glyph" aria-hidden="true">{glyph}</span>
      {dir === 'flat' ? '±0' : `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(digits)}`} {unit}
    </span>
  )
}
