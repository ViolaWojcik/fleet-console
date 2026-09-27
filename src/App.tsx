import { useEffect, useState } from 'react'
import fleetData from './data/fleet.json'
import type { Fleet, View } from './lib/types'
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
  const { sunset } = sunTimes()
  const replayed = fleet.turbines.filter(t => t.replayedFrom)

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
    (prefs.mode === 'dark' ? ` · night since sunset ${hhmm(sunset)}` : '')

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
          count={`${fleet.turbines.length} of ${fleet.turbines.length}`} />
        {view === 'lanes'
          ? <FleetLanes fleet={fleet} selected={selected} onSelect={setSelected} panel={panel} />
          : <>
              <FleetTable fleet={fleet} selected={selected} onSelect={setSelected} />
              {panel && <div className="table__panel">{panel}</div>}
            </>}
        <p className="console__legend">
          {view === 'lanes' ? (
            <>Each lane is one turbine over the last {fleet.windowDays} days: ticks are metal-particle alarms, a ring is a service visit,
            a block is a forced outage, the full line is the model's flag and the shaded band its six-week projection. </>
          ) : (
            <>Table view: the same row at any density, sorted by severity. Median is the counted median warning ({fleet.base.medianDays} days
            from the flag), in italic because it is a judgment next to readings; the trend column is the six-week particle rate against the alarm threshold. </>
          )}
          {fleet.base.outages} of {fleet.base.episodes} alarm episodes ended in an outage within that window; median warning {fleet.base.medianDays} days.
          {replayed.length > 0 && <> {replayed.map(t => t.id).join(', ')} replays its {replayed.map(t => t.replayedFrom!.slice(0, 7)).join(', ')} episode on this clock.</>}
        </p>
      </>
    )
  }

  return (
    <div className={`page surface-metal page--${route.screen}`} data-density={prefs.density}>
      <main className="console">{body}</main>
      {route.screen !== 'fleet' && (
        <p className="console__legend console__legend--foot">
          <a className="link" href="#/">Fleet</a> · {clockLabel(fleet.clock)} · data: Cubico Sustainable Investments, CC-BY-4.0
        </p>
      )}
    </div>
  )
}
