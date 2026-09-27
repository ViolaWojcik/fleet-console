/** Data/ColumnHeader. Inter Medium 10, uppercase, tracking 12 %. */
export function ColumnHeader({ label, align = 'start', width }:
  { label: string; align?: 'start' | 'end'; width?: string }) {
  return (
    <span className={`column-header column-header--${align}`} style={width ? { width } : undefined} role="columnheader">
      {label}
    </span>
  )
}
