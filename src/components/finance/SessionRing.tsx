import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'

const SIZE = 64
const STROKE = 5
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface SessionRingProps {
  /** 0–1 fraction of the planned duration elapsed; can exceed 1 once over. */
  progress: number
  isBreak: boolean
  label: string
}

/** The centerpiece of an active Pomodoro block — this is the screen a user
 * looks at repeatedly for 25 minutes, so it gets a real visual instead of
 * plain mono text. The ring itself is CSS-driven (it just tracks a
 * per-second tick), GSAP only owns the one-time entrance. */
export function SessionRing({ progress, isBreak, label }: SessionRingProps) {
  const clamped = Math.min(1, Math.max(0, progress))
  const dashOffset = CIRCUMFERENCE * (1 - clamped)
  const overtime = progress > 1
  const ref = useRef<HTMLDivElement | null>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(ref.current, { scale: 0.85, autoAlpha: 0, duration: 0.4, ease: 'back.out(1.7)' })
      })
      return () => mm.revert()
    },
    { scope: ref, dependencies: [] },
  )

  return (
    <div ref={ref} className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} className="fill-none stroke-muted" />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          strokeLinecap="round"
          className={cn(
            'fill-none transition-[stroke-dashoffset] duration-[950ms] ease-linear',
            overtime ? 'stroke-warning' : isBreak ? 'stroke-muted-foreground' : 'stroke-primary',
          )}
          style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: dashOffset }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-medium tabular-nums">
        {label}
      </span>
    </div>
  )
}
