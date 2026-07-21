import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/lib/motion'

const DURATION_MS = 600

/** Animates a number from 0 (or its previous value) to `target` with an
 * ease-out curve. Renders the target immediately when the user prefers
 * reduced motion. tabular-nums on the consumer keeps the layout stable. */
export function useCountUp(target: number): number {
  const [display, setDisplay] = useState(target)
  const fromRef = useRef(0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(target)
      fromRef.current = target
      return
    }

    const from = fromRef.current
    fromRef.current = target
    if (from === target) return

    let frame: number
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION_MS, 1)
      const eased = 1 - (1 - t) ** 3
      setDisplay(from + (target - from) * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])

  return display
}
