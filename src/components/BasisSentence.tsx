import type { Fleet } from '../lib/types'

export type Basis = 'counted' | 'insufficient' | 'none'

/** Evidence/BasisSentence: the statistical basis in one sentence, quoting counted numbers. */
export function BasisSentence({ basis, base, alarmDays }:
  { basis: Basis; base: Fleet['base']; alarmDays: number }) {
  if (basis === 'counted') {
    return (
      <p className="basis">
        <em className="basis__kicker">Counted on the fleet's own history</em>
        Counted, not estimated: {base.episodes} metal-particle episodes on {base.turbines} turbines since {base.since}.
        {' '}{base.outages} ended in a drivetrain outage within six weeks. Median warning {base.medianDays} days.
      </p>
    )
  }
  if (basis === 'insufficient') {
    return (
      <p className="basis">
        <em className="basis__kicker">Too little to count against</em>
        {alarmDays === 1 ? 'One alarm day' : `${alarmDays} alarm days`} in six weeks. The {base.episodes} counted episodes all had
        more than this; the number is the fleet prior plus the alarm, and it should be read as watching, not knowing.
      </p>
    )
  }
  return (
    <p className="basis">
      <em className="basis__kicker">No counted history for this machine</em>
      No particle alarm in six weeks. The number is the fleet prior: {base.outages} outages in {base.episodes} episodes gives
      no reason to single this turbine out.
    </p>
  )
}
