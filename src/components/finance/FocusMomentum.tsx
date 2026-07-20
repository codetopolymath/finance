import { Flame } from 'lucide-react'
import { computeActiveDates, currentStreak, todaySummary } from '@/lib/focusSelectors'
import type { FocusSession, PauseEvent, Task } from '@/types/focus'

function formatMinutes(ms: number): string {
  const minutes = Math.round(ms / 60_000)
  return minutes < 1 ? '<1m' : `${minutes}m`
}

interface FocusMomentumProps {
  tasks: Task[]
  sessions: FocusSession[]
  pauses: PauseEvent[]
}

/** The positive-momentum signal the feature was missing — a streak (days
 * "shown up," not days everything got finished) plus today's focused time.
 * A day with nothing logged is just absent from the streak, never called
 * out as a miss — no guilt language, per the app's no-alarm principle. */
export function FocusMomentum({ tasks, sessions, pauses }: FocusMomentumProps) {
  const now = new Date()
  const activeDates = computeActiveDates(sessions, tasks)
  const streak = currentStreak(activeDates, now)
  const today = todaySummary(sessions, pauses, now)

  if (streak === 0 && today.sessionCount === 0) {
    return <p className="px-1 text-xs text-muted-foreground">Start a focus session today to begin a streak.</p>
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-muted-foreground">
      {streak > 0 && (
        <span className="flex items-center gap-1 font-medium text-foreground">
          <Flame className="size-3.5 text-primary" />
          {streak}-day streak
        </span>
      )}
      {today.sessionCount > 0 && (
        <span className="tabular-nums">
          {formatMinutes(today.totalMs)} focused today · {today.sessionCount} session
          {today.sessionCount === 1 ? '' : 's'}
        </span>
      )}
    </div>
  )
}
