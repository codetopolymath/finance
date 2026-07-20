import { useEffect, useState } from 'react'
import { Pause, Play, Check, SkipForward } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BudgetBar } from '@/components/finance/BudgetBar'
import { PauseReasonSheet } from '@/components/finance/PauseReasonSheet'
import {
  useCompleteTask,
  useEndWorkSession,
  useFocusSessions,
  usePauseSession,
  useResumeSession,
  useSkipBreak,
  type ActiveSession,
} from '@/lib/focusQueries'
import { activeWorkMs, budgetBurn, cycleCounts, pauseNudge } from '@/lib/focusSelectors'
import type { PauseReason } from '@/types/focus'

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatMinutes(ms: number): string {
  const minutes = Math.round(ms / 60_000)
  return minutes < 1 ? '<1m' : `${minutes}m`
}

/** Elapsed/remaining is always computed from stored timestamps, never a
 * trusted in-memory countdown — iOS suspends timers when this PWA is
 * backgrounded, per spec §7. The interval here only drives the redraw; the
 * actual work→break→work cycling happens server-side (see
 * `advanceIfElapsed` in focusQueries.ts) and shows up here on the next
 * poll — Pause/End/Done are the only ways to interrupt it. */
export function ActiveSessionBar({ active }: { active: ActiveSession }) {
  const [, forceTick] = useState(0)
  const [pauseSheetOpen, setPauseSheetOpen] = useState(false)

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const { session, task, pauses } = active
  const { data: history } = useFocusSessions(task.id)
  const pauseSession = usePauseSession()
  const resumeSession = useResumeSession()
  const endWorkSession = useEndWorkSession()
  const skipBreak = useSkipBreak()
  const completeTask = useCompleteTask()

  const now = new Date()
  const isPaused = session.status === 'paused'

  const elapsedMs = activeWorkMs([session], pauses, now)
  const plannedMs = session.planned_minutes * 60_000
  const remainingMs = plannedMs - elapsedMs
  const isBreak = session.kind === 'break'

  const burn = history ? budgetBurn(task, history.sessions, history.pauses, now) : null
  const nudge = pauseNudge(pauses.length)
  const totalSpentMs = history ? activeWorkMs(history.sessions, history.pauses, now) : 0
  const { workSessions } = history ? cycleCounts(history.sessions) : { workSessions: 0 }
  const cycleOrdinal = history
    ? history.sessions.filter((s) => s.kind === session.kind).findIndex((s) => s.id === session.id) + 1 || 1
    : 1

  return (
    <Card className="animate-in fade-in slide-in-from-top-2 gap-3 border-primary/30 p-4 py-0 duration-300">
      <div className="flex items-center justify-between gap-2 pt-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{isBreak ? 'Break' : task.title}</p>
          <p className="text-xs text-muted-foreground">
            {isPaused
              ? 'Paused'
              : isBreak
                ? `Short break · #${cycleOrdinal}`
                : `Focusing · session #${cycleOrdinal}`}
          </p>
        </div>
        <p className="shrink-0 font-mono text-xl tabular-nums">
          {remainingMs >= 0 ? formatDuration(remainingMs) : `+${formatDuration(-remainingMs)}`}
        </p>
      </div>

      {workSessions > 0 && (
        <p className="text-xs tabular-nums text-muted-foreground">
          {formatMinutes(totalSpentMs)} total across {workSessions} session{workSessions === 1 ? '' : 's'} on this
          task — carried over even after ending a session early.
        </p>
      )}
      {!isBreak && burn && <BudgetBar burn={burn} />}
      {nudge && <p className="text-xs text-muted-foreground">{nudge}</p>}

      <div className="flex gap-2 pb-4">
        {isBreak ? (
          <Button
            variant="outline"
            className="h-10 flex-1 active:scale-[0.97] motion-reduce:active:scale-100"
            onClick={() => skipBreak.mutate(session.id)}
            title="Ends the break early so you can start a new focus block right away"
          >
            <SkipForward />
            Skip break
          </Button>
        ) : (
          <>
            {isPaused ? (
              <Button
                className="h-10 flex-1 active:scale-[0.97] motion-reduce:active:scale-100"
                onClick={() => resumeSession.mutate(session.id)}
                disabled={resumeSession.isPending}
              >
                <Play />
                Resume
              </Button>
            ) : (
              <Button
                variant="outline"
                className="h-10 flex-1 active:scale-[0.97] motion-reduce:active:scale-100"
                onClick={() => setPauseSheetOpen(true)}
              >
                <Pause />
                Pause
              </Button>
            )}
            <Button
              variant="outline"
              className="h-10 flex-1 active:scale-[0.97] motion-reduce:active:scale-100"
              onClick={() => endWorkSession.mutate(session.id)}
              disabled={endWorkSession.isPending || isPaused}
              title="Ends this block now and starts a 5-minute break — the time already spent is kept, a new block starts fresh at 25 min next time"
            >
              <SkipForward />
              End
            </Button>
            <Button
              className="h-10 flex-1 active:scale-[0.97] motion-reduce:active:scale-100"
              onClick={() => completeTask.mutate(task)}
              disabled={completeTask.isPending}
            >
              <Check />
              Done
            </Button>
          </>
        )}
      </div>

      {!isBreak && (
        <PauseReasonSheet
          open={pauseSheetOpen}
          onOpenChange={setPauseSheetOpen}
          isSubmitting={pauseSession.isPending}
          onConfirm={(reason: PauseReason, note?: string) => {
            pauseSession.mutate(
              { sessionId: session.id, reason, note },
              { onSuccess: () => setPauseSheetOpen(false) },
            )
          }}
        />
      )}
    </Card>
  )
}
