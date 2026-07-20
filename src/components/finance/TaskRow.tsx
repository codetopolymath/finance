import { Circle, CheckCircle2, Star, Moon, Play } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCompleteTask, useSnoozeTask, useStartWorkSession } from '@/lib/focusQueries'
import { formatShortDate, parseDateOnly } from '@/lib/format'
import type { Task } from '@/types/focus'

interface TaskRowProps {
  task: Task
  hasActiveSession: boolean
  isActiveTask: boolean
  onOpenDetail: (task: Task) => void
}

export function TaskRow({ task, hasActiveSession, isActiveTask, onOpenDetail }: TaskRowProps) {
  const completeTask = useCompleteTask()
  const snoozeTask = useSnoozeTask()
  const startSession = useStartWorkSession()

  const handleStart = () => {
    startSession.mutate(task.id, {
      onError: (error) => toast.error(error instanceof Error ? error.message : "Couldn't start session"),
    })
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-2.5',
        task.is_frog && 'border-primary/40 bg-primary/5',
      )}
    >
      <button
        type="button"
        aria-label={task.status === 'done' ? 'Mark not done' : 'Mark done'}
        onClick={() => completeTask.mutate(task)}
        disabled={completeTask.isPending}
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        {task.status === 'done' ? <CheckCircle2 className="size-5 text-primary" /> : <Circle className="size-5" />}
      </button>

      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpenDetail(task)}>
        <p className="truncate text-sm">{task.title}</p>
        {task.due_date && (
          <p className="text-xs text-muted-foreground">{formatShortDate(parseDateOnly(task.due_date))}</p>
        )}
      </button>

      {task.is_frog && <Star className="size-4 shrink-0 fill-primary text-primary" />}

      {isActiveTask ? (
        <span className="shrink-0 text-xs text-muted-foreground">Focusing…</span>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Snooze"
            onClick={() => snoozeTask.mutate(task)}
            disabled={snoozeTask.isPending}
          >
            <Moon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Start focus session"
            onClick={handleStart}
            disabled={hasActiveSession || startSession.isPending}
          >
            <Play />
          </Button>
        </div>
      )}
    </div>
  )
}
