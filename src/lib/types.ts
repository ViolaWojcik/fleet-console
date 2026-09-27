export type Severity = 'clear' | 'watch' | 'act' | 'stop'
export type MarkKind = 'alarm' | 'service' | 'outage' | 'note'
export type Freshness = 'live' | 'stale' | 'missing' | 'counted'
export type SignalQuality = 'live' | 'stale' | 'missing' | 'suspect'

export interface Mark {
  kind: MarkKind
  day: number        // days before the clock, negative
  hours: number      // duration
  message: string
  label?: string
}

export interface Evidence {
  direction: 'raises' | 'lowers'
  weight: number
  label: string
  source: string
  freshness: Freshness
  staleDays?: number
}

export interface TodayEvent {
  time: string
  status: string
  message: string
  hours: number
  kind: 'alarm' | 'outage' | 'service' | 'routine'
}

export interface Turbine {
  id: string
  farm: string
  unit: string
  model: string
  severity: Severity
  confidence: number
  flagDay: number | null
  sinceDays: number | null
  confidenceAtFlag: number | null
  alarmDays: number
  replayedFrom: string | null
  signal: SignalQuality
  marks: Mark[]
  evidence: Evidence[]
  today: { lines: number; alarms: number; items: TodayEvent[]; routine: number; routineKinds: string[] }
  eventsInWindow: number
}

export interface Fleet {
  clock: string
  windowDays: number
  base: { episodes: number; outages: number; turbines: number; medianDays: number; since: string }
  scoring: string
  source: string
  turbines: Turbine[]
}

export type Density = 'compact' | 'default' | 'comfortable'
export type Mode = 'light' | 'dark'
export type View = 'lanes' | 'table'
