import { useState } from 'react'
import type { Fleet, Turbine } from '../lib/types'
import type { Decision } from '../lib/decisions'
import { OPERATOR, REASON_LABEL } from '../lib/decisions'
import { href } from '../lib/router'
import { signals } from '../lib/signals'
import { SeverityTag } from '../components/SeverityTag'
import { EvidenceItem } from '../components/EvidenceItem'
import { Sparkline } from '../components/Sparkline'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

/** Service order / PEN-15 / tablet: one screen for the technician, a glass card on the metal.
 *  It carries what the console saw and asks one question back. */
export function ServiceOrderScreen({ turbine: t, history }: { turbine: Turbine; fleet: Fleet; history: Decision[] }) {
  const sent = history.find(d => d.kind === 'sent')
  const disagreed = history.find(d => d.kind === 'disagreed')
  const suspect = t.marks.some(m => m.kind === 'note') || disagreed?.reason === 'sensor-suspect'
  const [finding, setFinding] = useState<string>(suspect ? 'sensor' : 'real')
  const [closed, setClosed] = useState<string | null>(null)
  const s = signals.turbines[t.id]

  return (
    <div className="screen screen--order">
      <section className="order glass" aria-label="service order">
        <p className="order__kicker">Service order · {t.id} · {t.farm}</p>
        <div className="order__title-row">
          <h1 className="order__title">{suspect ? 'Check the gearbox oil sensor' : 'Inspect the gearbox'}</h1>
          <SeverityTag level={t.severity} />
        </div>
        <p className="order__lead">
          {sent ? `Sent to service ${sent.label} by ${sent.author}` : `Not yet sent to service (open from the console as ${OPERATOR})`} · the model flagged a probable
          drivetrain failure {t.sinceDays ?? '?'} days ago
          {disagreed ? `; the operator disagreed (${disagreed.reason ? REASON_LABEL[disagreed.reason] : 'reason on record'}) and asked for a visit before the turbine is stopped.` : '.'}
        </p>
        <hr className="rule" />
        <h2 className="order__h">What the console saw</h2>
        <ul className="evidence-list">
          {t.evidence.map((e, i) => <EvidenceItem key={i} item={e} source={e.source !== 'fleet history'} />)}
        </ul>
        <p className="order__trend"><span className="order__trend-label">Six-week trend</span><Sparkline points={s?.spark} threshold={signals.threshold.particles} /></p>
        <hr className="rule" />
        <h2 className="order__h">On site</h2>
        <RadioGroup value={finding} onValueChange={v => setFinding(String(v))} className="order__radios" aria-label="finding on site">
          <label className="radio"><RadioGroupItem value="sensor" className="radio__dot" /><span>Sensor defect confirmed, replaced</span></label>
          <label className="radio"><RadioGroupItem value="real" className="radio__dot" /><span>Sensor fine, particles real: stop the turbine</span></label>
          <label className="radio"><RadioGroupItem value="access" className="radio__dot" /><span>Could not access, reschedule</span></label>
        </RadioGroup>
        <Input className="order__note" placeholder="Add a note for the next shift" aria-label="note for the next shift" />
        {closed
          ? <p className="order__closed" role="status">Order closed {closed} · finding sent to {OPERATOR} and written to {t.id}'s history</p>
          : <div className="order__actions">
              <Button className="btn btn--primary" onClick={() => setClosed(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))}>Close order</Button>
              <Button variant="outline" className="btn btn--secondary">Ask the operator</Button>
            </div>}
        <p className="order__back"><a className="link" href={href({ screen: 'history', id: t.id })}>Back to the console</a></p>
      </section>
    </div>
  )
}
