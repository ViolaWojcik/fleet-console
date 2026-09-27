/** Data/ConfidenceBar. band low < 0.34 <= medium < 0.67 <= high; fill is ink, never hue. */
export function ConfidenceBar({ value, size = 'row', number = true }:
  { value: number; size?: 'row' | 'panel'; number?: boolean }) {
  const band = value < 0.34 ? 'low' : value < 0.67 ? 'medium' : 'high'
  return (
    <span className={`confidence confidence--${size} confidence--${band}`}
      role="img" aria-label={`confidence ${value.toFixed(2)}, ${band}`}>
      {size === 'panel' && number && <span className="confidence__number">{value.toFixed(2)}</span>}
      <span className="confidence__track"><span className="confidence__fill" style={{ width: `${Math.round(value * 100)}%` }} /></span>
      {size === 'row' && number && <span className="confidence__number">{value.toFixed(2)}</span>}
    </span>
  )
}
