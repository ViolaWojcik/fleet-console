// Measurement channels (10-minute SCADA), built by tools/build_signals.py into src/data/signals.json.
// Absent turbines mean the channel was not fetched: the UI says "no data", it never fills in a zero.
import raw from '../data/signals.json'

export interface TurbineSignals {
  at: { power: number | null; gearOil: number | null; particles: number | null; wind: number | null; rpm: number | null; vibration: number | null }
  delta: { particles: number | null; gearOil: number | null; power: number | null; vibration: number | null }   // vs the previous week
  spark: (number | null)[]                                       // one point per day, particle rate
  series?: { particles: (number | null)[]; gearOil: (number | null)[]; fleetGearOil: (number | null)[] }  // 6-hourly
  coverage: number                                               // share of 10-minute rows present in the window
}

export interface Signals {
  clock: string
  windowDays: number
  threshold: { particles: number }
  fleetGearOil: number | null
  turbines: Record<string, TurbineSignals>
}

export const signals = raw as unknown as Signals
