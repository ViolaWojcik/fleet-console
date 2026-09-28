import { useEffect, useRef, useState } from 'react'

/** Copy to the clipboard and say so for a moment; the label is the feedback, no toast. */
export function useCopy(holdMs = 1600) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return {
    copied,
    copy(text: string) {
      navigator.clipboard?.writeText(text).catch(() => {})
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), holdMs)
    },
  }
}
