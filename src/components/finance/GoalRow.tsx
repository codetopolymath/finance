import { useRef } from 'react'
import { Circle, CheckCircle2 } from 'lucide-react'
import { gsap, useGSAP } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useCompleteGoal, useReopenGoal } from '@/lib/goalsQueries'
import type { Goal } from '@/types/goals'

interface GoalRowProps {
  goal: Goal
  onOpenDetail: (goal: Goal) => void
}

export function GoalRow({ goal, onOpenDetail }: GoalRowProps) {
  const completeGoal = useCompleteGoal()
  const reopenGoal = useReopenGoal()

  const containerRef = useRef<HTMLDivElement | null>(null)
  const checkRef = useRef<SVGSVGElement | null>(null)
  const { contextSafe } = useGSAP(() => {}, { scope: containerRef })

  const isDone = goal.status === 'done'

  const handleToggleComplete = contextSafe(() => {
    if (isDone) {
      reopenGoal.mutate(goal.id)
      return
    }
    completeGoal.mutate(goal.id)
    if (!prefersReducedMotion() && checkRef.current) {
      gsap.fromTo(checkRef.current, { scale: 0.7 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' })
    }
  })

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
        isDone && 'opacity-60',
      )}
    >
      <button
        type="button"
        aria-label={isDone ? 'Mark not achieved' : 'Mark achieved'}
        onClick={handleToggleComplete}
        disabled={completeGoal.isPending || reopenGoal.isPending}
        className="shrink-0 text-muted-foreground transition-transform active:scale-90 hover:text-foreground motion-reduce:active:scale-100"
      >
        {isDone ? (
          <CheckCircle2 ref={checkRef} className="size-5 text-accent-warm" />
        ) : (
          <Circle className="size-5" />
        )}
      </button>

      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpenDetail(goal)}>
        <p className={cn('truncate text-sm', isDone && 'line-through')}>{goal.title}</p>
        {goal.why && <p className="truncate text-2xs text-muted-foreground">{goal.why}</p>}
      </button>
    </div>
  )
}
