import { useRef } from 'react'
import { Circle, CheckCircle2, Moon, Play } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { gsap, useGSAP } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useCompleteTask, useReopenTask, useSnoozeTask, useStartWorkSession, useUpdateTask } from '@/lib/focusQueries'
import { activeWorkMs, cycleCounts, SNOOZE_NUDGE_THRESHOLD } from '@/lib/focusSelectors'
import { formatShortDate, parseDateOnly } from '@/lib/format'
import type { FocusSession, PauseEvent, Task } from '@/types/focus'

interface TaskRowProps {
  task: Task
  hasActiveSession: boolean
  isActiveTask: boolean
  onOpenDetail: (task: Task) => void
  /** This task's own sessions/pauses, pre-filtered by the caller from one
   * bulk fetch — avoids an N+1 query per row. */
  sessions?: FocusSession[]
  pauses?: PauseEvent[]
}

function formatMinutes(ms: number): string {
  const minutes = Math.round(ms / 60_000)
  return minutes < 1 ? '<1m' : `${minutes}m`
}

export function TaskRow({
  task,
  hasActiveSession,
  isActiveTask,
  onOpenDetail,
  sessions = [],
  pauses = [],
}: TaskRowProps) {
  const completeTask = useCompleteTask()
  const reopenTask = useReopenTask()
  const snoozeTask = useSnoozeTask()
  const startSession = useStartWorkSession()
  const updateTask = useUpdateTask()

  const containerRef = useRef<HTMLDivElement | null>(null)
  const frogRef = useRef<HTMLButtonElement | null>(null)
  const checkRef = useRef<SVGSVGElement | null>(null)
  const { contextSafe } = useGSAP(() => {}, { scope: containerRef })

  const handleStart = () => {
    startSession.mutate(task.id, {
      onError: (error) => toast.error(error instanceof Error ? error.message : "Couldn't start session"),
    })
  }

  const handleToggleFrog = contextSafe(() => {
    updateTask.mutate({ id: task.id, patch: { is_frog: !task.is_frog } })
    if (!prefersReducedMotion() && frogRef.current) {
      gsap.fromTo(
        frogRef.current,
        { y: 0, rotation: 0 },
        { y: -6, rotation: -12, duration: 0.15, ease: 'power1.out', yoyo: true, repeat: 1 },
      )
    }
  })

  const handleToggleComplete = contextSafe(() => {
    if (task.status === 'done') {
      reopenTask.mutate(task.id)
      return
    }
    completeTask.mutate(task)
    if (!prefersReducedMotion() && checkRef.current) {
      gsap.fromTo(checkRef.current, { scale: 0.7 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' })
    }
  })

  const { workSessions } = cycleCounts(sessions)
  const spentMs = workSessions > 0 ? activeWorkMs(sessions, pauses, new Date()) : 0
  const snoozedALot = task.snooze_count >= SNOOZE_NUDGE_THRESHOLD

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
        task.is_frog && 'border-primary/40 bg-primary/5',
      )}
    >
      <button
        type="button"
        aria-label={task.status === 'done' ? 'Mark not done' : 'Mark done'}
        onClick={handleToggleComplete}
        disabled={completeTask.isPending || reopenTask.isPending}
        className="shrink-0 text-muted-foreground transition-transform active:scale-90 hover:text-foreground motion-reduce:active:scale-100"
      >
        {task.status === 'done' ? (
          <CheckCircle2 ref={checkRef} className="size-5 text-primary" />
        ) : (
          <Circle className="size-5" />
        )}
      </button>

      {task.status !== 'done' && (
        <button
          ref={frogRef}
          type="button"
          aria-label={task.is_frog ? "Unflag as today's priority" : "Flag as today's priority"}
          title={task.is_frog ? "Unflag as today's priority" : "Flag as today's priority"}
          onClick={handleToggleFrog}
          disabled={updateTask.isPending}
          className={cn(
            'shrink-0 text-base leading-none transition-transform active:scale-90 motion-reduce:active:scale-100',
            task.is_frog ? 'opacity-100 grayscale-0' : 'opacity-30 grayscale hover:opacity-60',
          )}
        >
          🐸
        </button>
      )}
      {task.status === 'done' && task.is_frog && <span className="shrink-0 text-base leading-none">🐸</span>}

      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpenDetail(task)}>
        <p className="truncate text-sm">{task.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task.due_date && <span>{formatShortDate(parseDateOnly(task.due_date))}</span>}
          {workSessions > 0 && (
            <span className="tabular-nums">
              {formatMinutes(spentMs)} · {workSessions} session{workSessions === 1 ? '' : 's'}
            </span>
          )}
          {snoozedALot && <span title="Snoozed a few times">🌙×{task.snooze_count}</span>}
        </div>
      </button>

      {isActiveTask ? (
        <span className="shrink-0 text-xs text-muted-foreground">Focusing…</span>
      ) : task.status === 'done' ? null : (
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Snooze to Someday"
            title="Snooze to Someday"
            onClick={() => snoozeTask.mutate(task)}
            disabled={snoozeTask.isPending}
            className="size-11 active:scale-90 motion-reduce:active:scale-100"
          >
            <Moon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Start focus session"
            onClick={handleStart}
            disabled={hasActiveSession || startSession.isPending}
            className="size-11 active:scale-90 motion-reduce:active:scale-100"
          >
            <Play />
          </Button>
        </div>
      )}
    </div>
  )
}
