import { useEffect, useMemo, useRef, useState } from 'react'
import fleetData from './data/fleet.json'
import type { Fleet, Mode, View } from './lib/types'
import { usePrefs } from './lib/usePrefs'
import { hhmm, sunTimes } from './lib/sun'
import { useRoute, go } from './lib/router'
import { useDecisions, type Reason } from './lib/decisions'
import { FleetToolbar } from './components/FleetToolbar'
import { FleetLanes } from './components/FleetLanes'
import { FleetTable } from './components/FleetTable'
import { EvidencePanel } from './components/EvidencePanel'
import { TurbineScreen } from './screens/TurbineScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { ServiceOrderScreen } from './screens/ServiceOrderScreen'

const fleet = fleetData as Fleet

function clockLabel(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
}

export default function App() {
  const prefs = usePrefs()
  const route = useRoute()
  const decisions = useDecisions()
  const [view, setView] = useState<View>('lanes')
  const [selected, setSelected] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  // Leaving the fleet screen drops the open panel, so coming back starts clean.
  useEffect(() => { if (route.screen !== 'fleet') setSelected(null) }, [route.screen])

  // "Ask the fleet": plain words matched against what the lanes already show, and the intent
  // said back so the operator sees what the console understood.
  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/[\s,]+/).filter(Boolean)
    if (!words.length) return fleet.turbines
    // words of one kind widen the match (stop act = either), kinds narrow it (Kelmarsh act = both)
    const isSev = (w: string) => ['stop', 'act', 'watch', 'clear'].some(x => x.startsWith(w))
    const isWhere = (w: string) => fleet.turbines.some(t => t.id.toLowerCase().includes(w) || t.farm.toLowerCase().includes(w))
    const sev = words.filter(isSev), where = words.filter(w => !isSev(w) && isWhere(w)), flags = words.filter(w => !isSev(w) && !isWhere(w))
    return fleet.turbines.filter(t =>
      (!sev.length || sev.some(w => t.severity.startsWith(w))) &&
      (!where.length || where.some(w => t.id.toLowerCase().includes(w) || t.farm.toLowerCase().includes(w))) &&
      flags.every(w =>
        (w === 'flagged' && t.sinceDays !== null) || (w === 'suspect' && t.signal === 'suspect') ||
        (w === 'late' && t.flagDay !== null && t.flagDay + fleet.base.medianDays <= 0) ||
        ((w === 'alarm' || w === 'alarms') && t.alarmDays > 0)))
  }, [query])
  const shownFleet: Fleet = shown === fleet.turbines ? fleet : { ...fleet, turbines: shown }
  const intent = query.trim()
    ? `${shown.length === fleet.turbines.length ? 'All' : shown.length} of ${fleet.turbines.length} turbines match “${query.trim()}”${shown.length ? '' : ': try a unit (KEL-04), a farm, a severity (stop, act, watch, clear), flagged, late, alarms or suspect'}`
    : ''
  const { sunset } = sunTimes()
  const replayed = fleet.turbines.filter(t => t.replayedFrom)

  // The mode the page shows lags the preference by one sunset: the sky sweeps once across the
  // console and the surfaces crossfade under it. Reduced motion switches at once.
  const [shownMode, setShownMode] = useState<Mode>(prefs.mode)
  const [sweep, setSweep] = useState<'to-dark' | 'to-light' | null>(null)
  const shownRef = useRef(shownMode)
  useEffect(() => {
    const target = prefs.mode
    if (target === shownRef.current) return
    const apply = () => { shownRef.current = target; setShownMode(target) }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(); return }
    setSweep(target === 'dark' ? 'to-dark' : 'to-light')
    document.documentElement.classList.add('mode-fading')
    const flip = setTimeout(apply, 460)
    const done = setTimeout(() => { setSweep(null); document.documentElement.classList.remove('mode-fading') }, 1150)
    // a second change mid-sweep restarts the sweep; the surfaces are already on their way
    return () => { clearTimeout(flip); clearTimeout(done); apply() }
  }, [prefs.mode])
  useEffect(() => { document.documentElement.dataset.mode = shownMode }, [shownMode])

  // ⌘K / Ctrl+K focuses the query bar, Escape closes the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.querySelector<HTMLInputElement>('.querybar__input')?.focus() }
      if (e.key === 'Escape' && !document.querySelector('.disagree')) setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const meta = `${fleet.turbines.length} turbines · Kelmarsh + Penmanshiel · ${clockLabel(fleet.clock)}` +
    (prefs.autoMode ? (prefs.mode === 'dark' ? ` · night since sunset ${hhmm(sunset)}` : ` · day until sunset ${hhmm(sunset)}`) : '')

  const turbineFor = (id: string) => fleet.turbines.find(t => t.id === id)
  const decide = (turbineId: string) => (d: { kind: 'sent' | 'watched' | 'disagreed'; reason?: Reason; note?: string }) =>
    decisions.add({ turbineId, ...d })

  let body: React.ReactNode
  if (route.screen !== 'fleet') {
    const t = turbineFor(route.id)
    if (!t) body = <p className="console__legend">No turbine {route.id}. <a className="link" href="#/">Back to the fleet</a></p>
    else if (route.screen === 'turbine') body = <TurbineScreen turbine={t} fleet={fleet} history={decisions.forTurbine(t.id)} onDecide={decide(t.id)} onUndo={decisions.remove} />
    else if (route.screen === 'history') body = <HistoryScreen turbine={t} fleet={fleet} history={decisions.forTurbine(t.id)} all={decisions.list} />
    else body = <ServiceOrderScreen turbine={t} fleet={fleet} history={decisions.forTurbine(t.id)} />
  } else {
    const sel = selected ? turbineFor(selected) : undefined
    const panel = sel && (
      <EvidencePanel key={sel.id} turbine={sel} fleet={fleet} history={decisions.forTurbine(sel.id)}
        onDecide={decide(sel.id)} onUndo={decisions.remove} onClose={() => setSelected(null)}
        onDisagreed={id => setTimeout(() => go({ screen: 'history', id }), 900)} />
    )
    body = (
      <>
        <FleetToolbar meta={meta} view={view} onView={setView} density={prefs.density} onDensity={prefs.setDensity}
          mode={prefs.mode} autoMode={prefs.autoMode} onPinMode={prefs.pinMode}
          query={query} onQuery={setQuery} intent={intent} handoverId={fleet.turbines[0].id}
          count={`${shown.length} of ${fleet.turbines.length}`} />
        {view === 'lanes'
          ? <FleetLanes fleet={shownFleet} selected={selected} onSelect={setSelected} panel={panel} />
          : <>
              <FleetTable fleet={shownFleet} selected={selected} onSelect={setSelected} />
              {panel && <div className="table__panel">{panel}</div>}
            </>}
        <p className="console__legend">
          {view === 'lanes' ? (
            <>Each lane is one turbine over the last {fleet.windowDays} days: ticks are metal-particle alarms, a ring is a service visit,
            a block is a forced outage, the full line is the model's flag. Median is the counted median warning ({fleet.base.medianExactDays} days
            from the flag, {fleet.base.medianDays} in whole days), in italic because it is a judgment next to readings. </>
          ) : (
            <>Table view: the same row at any density, sorted by severity. Median is the counted median warning ({fleet.base.medianExactDays} days
            from the flag, {fleet.base.medianDays} in whole days), in italic because it is a judgment next to readings; the trend column is the six-week particle rate against the alarm threshold. </>
          )}
          {fleet.base.outages} of {fleet.base.episodes} alarm episodes ended in an outage within that window; median warning {fleet.base.medianExactDays} days.
          {replayed.length > 0 && <> {replayed.map(t => t.id).join(', ')} replays its {replayed.map(t => t.replayedFrom!.slice(0, 7)).join(', ')} episode on this clock.</>}
          {decisions.list.length > 0 && (
            <> {decisions.list.length} decision{decisions.list.length === 1 ? '' : 's'} recorded in this browser ·{' '}
            <button type="button" className="link" onClick={() => { if (window.confirm('Clear every recorded decision in this browser?')) decisions.reset() }}>Reset demo</button></>
          )}
        </p>
      </>
    )
  }

  return (
    <div className={`page surface-metal page--${route.screen}`} data-density={prefs.density}>
      <main className="console">{body}</main>
      {sweep && <div className={`sunset sunset--${sweep}`} aria-hidden="true" />}
      {route.screen !== 'fleet' && (
        <p className="console__legend console__legend--foot">
          <a className="link" href="#/">Fleet</a> · {clockLabel(fleet.clock)} · data: Cubico Sustainable Investments, CC-BY-4.0
        </p>
      )}
    </div>
  )
}
