import { useState } from 'react'
import type { Fleet, Turbine } from '../lib/types'
import type { Decision } from '../lib/decisions'
import { autoEntry, NEXT_OPERATOR, OPERATOR, REASON_LABEL } from '../lib/decisions'
import { href } from '../lib/router'
import { SeverityTag } from '../components/SeverityTag'
import { useCopy } from '../lib/useCopy'
import { HistoryEntry } from '../components/HistoryEntry'

interface Props { turbine: Turbine; fleet: Fleet; history: Decision[]; all: Decision[] }

/** A handover sentence counted from this shift's decisions, in the model's own vocabulary. */
export function handoverSummary(all: Decision[], fleet: Fleet): string {
  const flags = fleet.turbines.filter(t => t.flagDay !== null).length
  const dis = all.filter(d => d.kind === 'disagreed')
  const sent = all.filter(d => d.kind === 'sent').length
  const watched = all.filter(d => d.kind === 'watched').length
  const parts = [`${flags} flag${flags === 1 ? '' : 's'}`]
  if (dis.length) parts.push(`${dis.length} disagreed: ${[...new Set(dis.map(d => d.reason && REASON_LABEL[d.reason]).filter(Boolean))].join(', ')}`)
  if (sent) parts.push(`${sent} sent to service`)
  parts.push(`${Math.max(0, flags - sent - dis.length)} still watching${watched ? ` (${watched} confirmed)` : ''}`)
  return parts.join(' · ')
}

/** Evidence/ShiftHandover: a glass card, the summary sentence in Fraunces italic, the shift's lines. */
export function ShiftHandover({ all, fleet }: { all: Decision[]; fleet: Fleet }) {
  const [sent, setSent] = useState<string | null>(null)
  const shift = all.slice(0, 6)
  const time = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return (
    <section className="handover glass" aria-label="shift handover">
      <h2 className="card__h">Shift handover</h2>
      <p className="handover__meta">{time()} → next shift · {OPERATOR} → {NEXT_OPERATOR}</p>
      <p className="handover__summary">{handoverSummary(all, fleet)}</p>
      <ul className="history">
        {shift.length > 0 ? shift.map(d => <HistoryEntry key={d.id} d={d} />) : <li className="handover__empty">No calls made this shift yet.</li>}
      </ul>
      {sent
        ? <p className="handover__sent">Sent {sent} · {NEXT_OPERATOR} confirmed</p>
        : <p className="handover__links">
            <button type="button" className="link" onClick={() => navigator.clipboard?.writeText(handoverSummary(all, fleet))}>Copy summary</button> ·{' '}
            <button type="button" className="link" onClick={() => setSent(time())}>Send to {NEXT_OPERATOR}</button>
          </p>}
    </section>
  )
}

/** The record leaves as a file: every decision on this flag, as the console stores it. */
function exportHistory(id: string, entries: Decision[]) {
  const blob = new Blob([JSON.stringify({ turbine: id, exported: new Date().toISOString(), decisions: entries }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: `fleet-console-${id}-history.json` })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** History / PEN-15: every call on this flag, newest first, and the handover card beside it. */
export function HistoryScreen({ turbine: t, fleet, history, all }: Props) {
  const copyLink = useCopy()
  const auto = autoEntry(t, fleet.clock)
  const entries = [...history, ...(auto ? [auto] : [])]
  const outage = t.marks.filter(m => m.kind === 'outage').at(-1)
  const doubt = t.marks.find(m => m.kind === 'note')
  const sentOrder = history.find(d => d.kind === 'sent')
  return (
    <div className="screen screen--history">
      <nav className="breadcrumb" aria-label="breadcrumb">
        <a className="link" href={href({ screen: 'fleet' })}>Fleet</a><span className="breadcrumb__sep">/</span>
        <a className="link" href={href({ screen: 'turbine', id: t.id })}>{t.id} · {t.farm}</a><span className="breadcrumb__sep">/</span><span>History</span>
      </nav>
      <header className="screen__header">
        <h1 className="screen__title">{t.id}</h1>
        <SeverityTag level={t.severity} />
        <span className="screen__meta">
          {t.sinceDays !== null ? `flagged ${t.sinceDays} d ago` : 'no flag'}
          {outage && ` · ${outage.message.toLowerCase()} ${Math.round(-outage.day)} d ago`}
          {doubt && ` · ${doubt.message.toLowerCase()} logged ${Math.round(-doubt.day)} d ago`}
        </span>
      </header>
      <div className="history__body">
        <section className="card history__card" aria-label="decision history">
          <h2 className="card__h">Decision history</h2>
          <p className="history__lead">Every call on this flag, newest first. Nothing is deleted; a reversed decision is a new line.</p>
          <ul className="history history--full">{entries.map(d => <HistoryEntry key={d.id} d={d} />)}</ul>
          <hr className="rule" />
          <p className="history__links">
            <button type="button" className="link" onClick={() => exportHistory(t.id, entries)}>Export history</button> ·{' '}
            <button type="button" className="link" onClick={() => copyLink.copy(window.location.href)}>{copyLink.copied ? 'Link copied' : 'Copy link'}</button>
            {sentOrder && <> · <a className="link" href={href({ screen: 'order', id: t.id })}>Service order</a></>}
          </p>
        </section>
        <ShiftHandover all={all} fleet={fleet} />
      </div>
    </div>
  )
}
