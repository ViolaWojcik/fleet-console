import type { SignalQuality } from '../lib/types'

const WORD: Record<Exclude<SignalQuality, 'live'>, string> = {
  missing: 'no signal', stale: 'stale', suspect: 'sensor suspect',
}

/** Data/SignalState. A dot and a word in italics; the absence of data is said, never drawn as a dash. */
export function SignalState({ state }: { state: SignalQuality }) {
  if (state === 'live') return null
  return <span className={`signal-state signal-state--${state}`}><i className="signal-state__dot" />{WORD[state]}</span>
}
