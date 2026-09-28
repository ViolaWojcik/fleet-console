import { useState } from 'react'
import type { Fleet, Turbine } from '../lib/types'
import type { Decision, Reason } from '../lib/decisions'
import { autoEntry, OPERATOR, REASON_LABEL } from '../lib/decisions'
import { href } from '../lib/router'
import { ConfidenceBar } from './ConfidenceBar'
import { BasisSentence } from './BasisSentence'
import { EvidenceItem } from './EvidenceItem'
import { ActionRow, type ActionState } from './ActionRow'
import { HistoryEntry } from './HistoryEntry'
import { DisagreeForm } from './DisagreeForm'
import { useCopy } from '../lib/useCopy'

interface Props {
  turbine: Turbine
  fleet: Fleet
  history: Decision[]
  onDecide: (d: { kind: 'sent' | 'watched' | 'disagreed'; reason?: Reason; note?: string }) => Decision
  onUndo: (id: string) => void
  onClose: () => void
  onDisagreed?: (turbineId: string) => void
}

export function panelState(t: Turbine): 'supported' | 'thin' | 'no-basis' {
  return t.alarmDays >= 2 ? 'supported' : t.alarmDays === 1 ? 'thin' : 'no-basis'
}

/** Evidence/EvidencePanel: inline, full width, three columns (why / evidence / your call).
 *  state supported | thin | no-basis follows how much counted history stands behind the number. */
export function EvidencePanel({ turbine: t, fleet, history, onDecide, onUndo, onClose, onDisagreed }: Props) {
  const state = panelState(t)
  const [action, setAction] = useState<ActionState>({ state: 'idle' })
  const [formOpen, setFormOpen] = useState(false)
  const copyLink = useCopy()
  const raises = t.evidence.filter(e => e.direction === 'raises')
  const lowers = t.evidence.filter(e => e.direction === 'lowers')
  const auto = autoEntry(t, fleet.clock)
  const last = history[0] ?? auto

  function decide(kind: 'sent' | 'watched') {
    setAction({ state: 'pending', action: kind })
    setTimeout(() => {
      const d = onDecide({ kind })
      setAction({ state: 'done', action: kind,
        confirmation: `${kind === 'sent' ? 'Sent to service' : 'Kept watching'} · ${d.label} · ${OPERATOR}` })
      ;(window as unknown as { __lastDecision?: string }).__lastDecision = d.id
    }, 400)
  }

  function undo() {
    const id = (window as unknown as { __lastDecision?: string }).__lastDecision
    if (id) onUndo(id)
    setAction({ state: 'idle' })
  }

  function confirmDisagree(reason: Reason, note: string) {
    const d = onDecide({ kind: 'disagreed', reason, note })
    ;(window as unknown as { __lastDecision?: string }).__lastDecision = d.id
    setFormOpen(false)
    setAction({ state: 'done', action: 'disagreed', confirmation: `Disagreed · ${REASON_LABEL[reason]} · ${d.label} · ${OPERATOR}` })
    onDisagreed?.(t.id)
  }

  return (
    <section className={`evidence-panel evidence-panel--${state}`} aria-label={`Why the model thinks so, ${t.id}`}>
      <button type="button" className="link evidence-panel__close" onClick={onClose}>Close</button>

      <div className="evidence-panel__why">
        <h2 className="evidence-panel__title">Why the model thinks so</h2>
        <ConfidenceBar value={t.confidence} size="panel" />
        <BasisSentence basis={state === 'supported' ? 'counted' : state === 'thin' ? 'insufficient' : 'none'}
          base={fleet.base} alarmDays={t.alarmDays} />
      </div>

      <div className="evidence-panel__evidence">
        {state !== 'no-basis' ? (
          <>
            <h3 className="evidence-panel__h">What raises it</h3>
            <ul className="evidence-list">{raises.map((e, i) => <EvidenceItem key={i} item={e} />)}</ul>
            <h3 className="evidence-panel__h">What lowers it</h3>
            {lowers.length > 0
              ? <ul className="evidence-list">{lowers.map((e, i) => <EvidenceItem key={i} item={e} />)}</ul>
              : <p className="evidence-panel__none">Nothing in the window lowers it. A quiet counter-list is a fact, not a gap.</p>}
          </>
        ) : (
          <p className="evidence-panel__none">
            No counted history for this type of flag. {t.eventsInWindow} status lines in six weeks, none of them a particle alarm.
          </p>
        )}
      </div>

      <div className="evidence-panel__call">
        <h3 className="evidence-panel__h">Your call</h3>
        <div className="call__actions">
          <ActionRow layout="stack" value={action} disagreeOpen={formOpen}
            onSend={() => decide('sent')} onWatch={() => decide('watched')}
            onDisagree={() => setFormOpen(o => !o)} onUndo={undo} />
          {formOpen && <DisagreeForm turbineId={t.id} onConfirm={confirmDisagree} onCancel={() => setFormOpen(false)} />}
        </div>
        <p className="evidence-panel__links">
          <button type="button" className="link" onClick={() => copyLink.copy(`${window.location.origin}${window.location.pathname}${href({ screen: 'history', id: t.id })}`)}>{copyLink.copied ? 'Link copied' : 'Copy link'}</button> ·{' '}
          <a className="link" href={href({ screen: 'turbine', id: t.id })}>Open turbine</a>
        </p>
        {last && <ul className="history history--last"><HistoryEntry d={last} /></ul>}
      </div>
    </section>
  )
}
