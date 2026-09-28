interface SpeechRecognitionLike {
  lang: string
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null
  onend: (() => void) | null
  start(): void
}

/** Dictation as a second way in: the Web Speech API when the browser has it; otherwise the
 *  control shows it listened for a moment and the keyboard keeps working. Shared by the query
 *  bar and the disagree note. */
export function dictate(setListening: (on: boolean) => void, onText: (text: string) => void) {
  const SR = (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition
  if (!SR) { setListening(true); setTimeout(() => setListening(false), 1500); return }
  const rec = new SR()
  rec.lang = 'en-GB'
  rec.onresult = e => { onText(e.results[0][0].transcript); setListening(false) }
  rec.onend = () => setListening(false)
  setListening(true)
  rec.start()
}
