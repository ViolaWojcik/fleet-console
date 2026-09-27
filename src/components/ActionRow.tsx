import { Button } from '@/components/ui/button'

export type ActionState =
  | { state: 'idle' }
  | { state: 'pending'; action: 'sent' | 'watched' }
  | { state: 'done'; action: 'sent' | 'watched' | 'disagreed'; confirmation: string }

interface Props {
  layout?: 'row' | 'stack'
  value: ActionState
  onSend: () => void
  onWatch: () => void
  onDisagree: () => void
  onUndo: () => void
  disagreeOpen?: boolean
}

/** Evidence/ActionRow: three actions of equal weight. Primary is brightness, not colour.
 *  done = one confirmation line and Undo; the flag itself is never cleared. */
export function ActionRow({ layout = 'row', value, onSend, onWatch, onDisagree, onUndo, disagreeOpen }: Props) {
  if (value.state === 'done') {
    return (
      <div className={`action-row action-row--${layout} action-row--done`} role="status">
        <span className="action-row__confirmation">{value.confirmation}</span>
        <button type="button" className="link" onClick={onUndo}>Undo</button>
      </div>
    )
  }
  const pending = value.state === 'pending' ? value.action : null
  return (
    <div className={`action-row action-row--${layout}`}>
      <Button variant="default" className="btn btn--primary" disabled={pending !== null} onClick={onSend}>
        {pending === 'sent' ? 'Sending…' : 'Send to service'}
      </Button>
      <Button variant="outline" className="btn btn--secondary" disabled={pending !== null} onClick={onWatch}>
        {pending === 'watched' ? 'Noting…' : 'Keep watching'}
      </Button>
      <Button variant="outline" className="btn btn--secondary" disabled={pending !== null} onClick={onDisagree}
        aria-expanded={disagreeOpen} aria-haspopup="dialog">
        Disagree
      </Button>
    </div>
  )
}
