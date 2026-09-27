import type { Fleet, Turbine } from '../lib/types'
import type { Decision, Reason } from '../lib/decisions'
import { autoEntry } from '../lib/decisions'
import { href } from '../lib/router'
import { signals } from '../lib/signals'
import { SeverityTag } from '../components/SeverityTag'
import { ConfidenceBar } from '../components/ConfidenceBar'
import { DeltaIndicator } from '../components/DeltaIndicator'
import { TimeSeriesChart, SeriesLegend, type Series } from '../components/TimeSeriesChart'
import { EventRow, EventGroup } from '../components/EventRow'
import { BasisSentence } from '../components/BasisSentence'
import { EvidenceItem } from '../components/EvidenceItem'
import { HistoryEntry } from '../components/HistoryEntry'
import { ActionRow, type ActionState } from '../components/ActionRow'
import { DisagreeForm } from '../components/DisagreeForm'
import { panelState } from '../components/EvidencePanel'
import { useState } from 'react'
import { OPERATOR, REASON_LABEL } from '../lib/decisions'

interface Props {
  turbine: Turbine
  fleet: Fleet
  history: Decision[]
  onDecide: (d: { kind: 'sent' | 'watched' | 'disagreed'; reason?: Reason; note?: string }) => Decision
  onUndo: (id: string) => void
}

/** Turbine / KEL-04: the signals card (chart, deltas, legend), today's events, and the evidence column. */
export function TurbineScreen({ turbine: t, fleet, history, onDecide, onUndo }: Props) {
  const s = signals.turbines[t.id]
  const [action, setAction] = useState<ActionState>({ state: 'idle' })
  const [formOpen, setFormOpen] = useState(false)
  const [lastId, setLastId] = useState<string | null>(null)
  const state = panelState(t)
  const raises = t.evidence.filter(e => e.direction === 'raises')
  const lowers = t.evidence.filter(e => e.direction === 'lowers')
  const auto = autoEntry(t, fleet.clock)
  const entries = [...history, ...(auto ? [auto] : [])].slice(0, 3)

  const series: Series[] = s?.series ? [
    { label: 'Particle count', points: s.series.particles, style: 'solid', marker: 'square' },
    { label: 'Gear-oil temperature', points: s.series.gearOil, style: 'dashed', marker: 'ring' },
    { label: 'Fleet median oil temperature', points: s.series.fleetGearOil, style: 'dotted', marker: 'triangle' },
  ] : []

  function decide(kind: 'sent' | 'watched') {
    setAction({ state: 'pending', action: kind })
    setTimeout(() => {
      const d = onDecide({ kind }); setLastId(d.id)
      setAction({ state: 'done', action: kind, confirmation: `${kind === 'sent' ? 'Sent to service' : 'Kept watching'} · ${d.label} · ${OPERATOR}` })
    }, 400)
  }

  return (
    <div className="screen screen--turbine">
      <nav className="breadcrumb" aria-label="breadcrumb">
        <a className="link" href={href({ screen: 'fleet' })}>Fleet</a><span className="breadcrumb__sep">/</span><span>{t.id} · {t.farm}</span>
      </nav>
      <header className="screen__header">
        <h1 className="screen__title">{t.id}</h1>
        <SeverityTag level={t.severity} />
        <ConfidenceBar value={t.confidence} size="panel" />
        <span className="screen__meta">
          {t.sinceDays !== null ? `flagged ${t.sinceDays} d ago · ` : 'no flag · '}{t.model} · commissioned 2016
          {t.replayedFrom && ` · replayed from ${t.replayedFrom}`}
        </span>
      </header>

      <div className="turbine__body">
        <div className="turbine__signals">
          <section className="card chart-card" aria-label="gearbox signals">
            <div className="chart-card__head">
              <h2 className="card__h">Gearbox particles, last six weeks</h2>
              <div className="deltas">
                <span className="deltas__item"><span className="deltas__label">particles/h</span><DeltaIndicator value={s?.delta.particles} /></span>
                <span className="deltas__item"><span className="deltas__label">oil temp</span><DeltaIndicator value={s?.delta.gearOil} unit="°C" digits={1} /></span>
                <span className="deltas__item"><span className="deltas__label">power</span><DeltaIndicator value={s?.delta.power} /></span>
                <span className="deltas__item"><span className="deltas__label">vibration</span><DeltaIndicator value={s?.delta.vibration} /></span>
              </div>
            </div>
            <TimeSeriesChart series={series} windowDays={fleet.windowDays} flagDay={t.flagDay} sinceDays={t.sinceDays}
              threshold={{ value: signals.threshold.particles, label: 'alarm threshold' }} />
            <SeriesLegend series={series} reference="Alarm threshold" />
            {s && s.coverage < 0.95 && (
              <p className="chart-card__note">Measurement rows present for {Math.round(s.coverage * 100)} % of the window; the gaps are gaps.</p>
            )}
          </section>

          <section className="card events" aria-label="events today">
            <div className="events__head">
              <h2 className="card__h">Events today</h2>
              <span className="events__meta">{t.today.lines} lines · {t.today.alarms} alarm{t.today.alarms === 1 ? '' : 's'}</span>
            </div>
            <ul className="events__list">
              {t.today.items.map((e, i) => <EventRow key={i} e={e} turbineId={t.id} />)}
              <EventGroup count={t.today.routine} kinds={t.today.routineKinds} span="last 24 h" />
            </ul>
          </section>
        </div>

        <aside className="card evidence-col" aria-label="why the model thinks so">
          <h2 className="evidence-col__title">Why the model thinks so</h2>
          <BasisSentence basis={state === 'supported' ? 'counted' : state === 'thin' ? 'insufficient' : 'none'} base={fleet.base} alarmDays={t.alarmDays} />
          {raises.length > 0 && <><h3 className="evidence-panel__h">What raises it</h3><ul className="evidence-list">{raises.map((e, i) => <EvidenceItem key={i} item={e} />)}</ul></>}
          {lowers.length > 0 && <><h3 className="evidence-panel__h">What lowers it</h3><ul className="evidence-list">{lowers.map((e, i) => <EvidenceItem key={i} item={e} />)}</ul></>}
          <hr className="rule" />
          <h3 className="evidence-panel__h">Your call</h3>
          <div className="call__actions">
            <ActionRow layout="stack" value={action} disagreeOpen={formOpen}
              onSend={() => decide('sent')} onWatch={() => decide('watched')} onDisagree={() => setFormOpen(o => !o)}
              onUndo={() => { if (lastId) onUndo(lastId); setAction({ state: 'idle' }) }} />
            {formOpen && (
              <DisagreeForm turbineId={t.id} onCancel={() => setFormOpen(false)}
                onConfirm={(reason, note) => {
                  const d = onDecide({ kind: 'disagreed', reason, note }); setLastId(d.id); setFormOpen(false)
                  setAction({ state: 'done', action: 'disagreed', confirmation: `Disagreed · ${REASON_LABEL[reason]} · ${d.label} · ${OPERATOR}` })
                }} />
            )}
          </div>
          <ul className="history">{entries.map(d => <HistoryEntry key={d.id} d={d} />)}</ul>
          <p className="evidence-panel__links"><a className="link" href={href({ screen: 'history', id: t.id })}>Full history</a></p>
        </aside>
      </div>
    </div>
  )
}
