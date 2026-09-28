import { useEffect, useRef, useState } from 'react'
import { dictate } from '../lib/dictate'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import type { Reason } from '../lib/decisions'
import { OPERATOR, REASON_LABEL } from '../lib/decisions'

const REASONS: { value: Reason; label: string }[] = [
  { value: 'sensor-suspect', label: 'Sensor is suspect' },
  { value: 'recent-service', label: 'Recent service explains it' },
  { value: 'weather', label: 'Weather event' },
  { value: 'other', label: 'Other' },
]

interface Props {
  turbineId: string
  onConfirm: (reason: Reason, note: string) => void
  onCancel: () => void
}

/** Evidence/DisagreeForm: step reason -> confirm. A glass popover under the Disagree button.
 *  Confirm shows exactly the line that will go into the machine's history. */
export function DisagreeForm({ turbineId, onConfirm, onCancel }: Props) {
  const [step, setStep] = useState<'reason' | 'confirm'>('reason')
  const [reason, setReason] = useState<Reason>('sensor-suspect')
  const [note, setNote] = useState('')
  const [listening, setListening] = useState(false)
  const first = useRef<HTMLButtonElement>(null)

  useEffect(() => { first.current?.focus() }, [step])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  // Dictation is a second way in, not a feature: the Web Speech API when the browser has it,
  // otherwise the microphone stays a visible promise and the field keeps working.
  function speak() { dictate(setListening, text => setNote(n => (n ? n + ' ' : '') + text)) }

  const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="disagree glass" role="dialog" aria-labelledby="disagree-title" aria-modal="false">
      {step === 'reason' ? (
        <>
          <h2 id="disagree-title" className="disagree__title">Why do you disagree?</h2>
          <p className="disagree__lead">The flag stays in history with your reason. Nothing is deleted.</p>
          <RadioGroup value={reason} onValueChange={v => setReason(v as Reason)} className="disagree__reasons" aria-label="reason">
            {REASONS.map(r => (
              <label key={r.value} className="radio">
                <RadioGroupItem value={r.value} className="radio__dot" />
                <span>{r.label}</span>
              </label>
            ))}
          </RadioGroup>
          <div className={`disagree__note${listening ? ' disagree__note--listening' : ''}`}>
            <Textarea className="disagree__field" rows={1} placeholder={listening ? 'Listening…' : 'Add a note, type or dictate'}
              value={note} onChange={e => setNote(e.target.value)} aria-label="note" />
            <button type="button" className="disagree__mic" onClick={speak} aria-pressed={listening} aria-label="dictate the note">
              {listening ? <span className="disagree__bars"><i /><i /><i /></span> : <MicIcon />}
            </button>
          </div>
          <div className="disagree__actions">
            <Button ref={first} className="btn btn--primary" onClick={() => setStep('confirm')}>Continue</Button>
            <Button variant="outline" className="btn btn--secondary" onClick={onCancel}>Cancel</Button>
          </div>
        </>
      ) : (
        <>
          <h2 id="disagree-title" className="disagree__title">This goes into {turbineId}'s history</h2>
          <p className="disagree__lead">With your name against it. The next operator meets the argument, not a cleared flag.</p>
          <ul className="history disagree__preview">
            <li className="history-entry history-entry--disagreed">
              <span className="history-entry__time">{time}</span>
              <span className="history-entry__body">
                <span className="history-entry__verb">Disagreed</span>
                <span className="history-entry__author">{OPERATOR}</span>
                <span className="history-entry__reason">{[REASON_LABEL[reason], note.trim()].filter(Boolean).join(' · ')}</span>
              </span>
            </li>
          </ul>
          <p className="disagree__lead">The model receives the disagreement as training signal.</p>
          <div className="disagree__actions">
            <Button ref={first} className="btn btn--primary" onClick={() => onConfirm(reason, note.trim())}>Confirm disagreement</Button>
            <Button variant="outline" className="btn btn--secondary" onClick={() => setStep('reason')}>Back</Button>
          </div>
        </>
      )}
    </div>
  )
}


function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
    </svg>
  )
}
