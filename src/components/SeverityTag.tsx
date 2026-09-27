import type { Severity } from '../lib/types'

/** Events/SeverityTag. Severity is ink and weight: clear grey, watch black, act bold with a rule,
 *  stop white on the one red block. */
export function SeverityTag({ level }: { level: Severity }) {
  return (
    <span className={`severity-tag severity-tag--${level}`} data-level={level}>
      {level === 'stop' ? 'STOP' : level}
    </span>
  )
}
