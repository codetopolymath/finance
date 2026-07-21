import { useMemo, useState } from 'react'
import { AlertTriangle, Info, ListChecks, Moon } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { EmptyState } from '@/components/finance/EmptyState'
import { TaskCaptureBar } from '@/components/finance/TaskCaptureBar'
import { TaskRow } from '@/components/finance/TaskRow'
import { ActiveSessionBar } from '@/components/finance/ActiveSessionBar'
import { FocusMomentum } from '@/components/finance/FocusMomentum'
import { TaskDetailDrawer } from '@/components/finance/TaskDetailDrawer'
import { useActiveFocusSession, useAllFocusHistory, useTasks, useUnsnoozeTask } from '@/lib/focusQueries'
import {
  groupForDone,
  groupForSomeday,
  groupForToday,
  groupForUpcoming,
  snoozedTasks,
} from '@/lib/focusSelectors'
import { formatShortDate, parseDateOnly } from '@/lib/format'
import type { Task } from '@/types/focus'

type View = 'today' | 'upcoming' | 'someday' | 'done'

export default function Focus() {
  const { data: tasks, isPending, isError, refetch } = useTasks()
  const { data: activeSession } = useActiveFocusSession()
  const { data: history } = useAllFocusHistory()
  const [view, setView] = useState<View>('today')
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  const today = useMemo(() => groupForToday(tasks ?? []), [tasks])
  const upcoming = useMemo(() => groupForUpcoming(tasks ?? []), [tasks])
  const someday = useMemo(() => groupForSomeday(tasks ?? []), [tasks])
  const done = useMemo(() => groupForDone(tasks ?? []), [tasks])
  const snoozed = useMemo(() => snoozedTasks(tasks ?? []), [tasks])

  if (isPending) {
    return <Skeleton className="h-72 w-full" />
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load tasks"
        description="Check your connection, or sign in again if your session expired."
        action={{ label: 'Retry', onClick: () => refetch() }}
      />
    )
  }

  const hasActiveSession = activeSession != null
  const activeTaskId = activeSession?.task.id ?? null

  const rowProps = (task: Task) => {
    const sessions = history?.sessions.filter((s) => s.task_id === task.id)
    const pauses = history?.pauses.filter((p) => sessions?.some((s) => s.id === p.session_id))
    return {
      task,
      hasActiveSession,
      isActiveTask: activeTaskId === task.id,
      onOpenDetail: setDetailTask,
      sessions,
      pauses,
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FocusMomentum tasks={tasks ?? []} sessions={history?.sessions ?? []} pauses={history?.pauses ?? []} />

      <TaskCaptureBar />

      {activeSession && <ActiveSessionBar active={activeSession} />}

      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(v) => v && setView(v as View)}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <ToggleGroupItem value="today" className="flex-1">
          Today
        </ToggleGroupItem>
        <ToggleGroupItem value="upcoming" className="flex-1">
          Upcoming
        </ToggleGroupItem>
        <ToggleGroupItem value="someday" className="flex-1">
          Someday
        </ToggleGroupItem>
        <ToggleGroupItem value="done" className="flex-1">
          Done
        </ToggleGroupItem>
      </ToggleGroup>

      {view === 'today' && (
        <div className="flex flex-col gap-2">
          {today.frog && <TaskRow {...rowProps(today.frog)} />}
          {today.rest.map((task) => (
            <TaskRow key={task.id} {...rowProps(task)} />
          ))}
          {today.overflowCount > 0 && (
            <p className="px-1 text-xs text-muted-foreground">+{today.overflowCount} more due today</p>
          )}
          {!today.frog && today.rest.length === 0 && (
            <EmptyState
              icon={ListChecks}
              title="Nothing on today"
              description="Add a task above, flag one as today's priority, or give one a due date of today."
            />
          )}
        </div>
      )}

      {view === 'upcoming' && (
        <div className="flex flex-col gap-4">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="Nothing upcoming"
              description="Tasks with a due date show up here, grouped by day."
            />
          ) : (
            upcoming.map((group) => (
              <div key={group.date} className="flex flex-col gap-2">
                <p className="px-1 text-xs font-medium text-muted-foreground">
                  {formatShortDate(parseDateOnly(group.date))}
                </p>
                {group.tasks.map((task) => (
                  <TaskRow key={task.id} {...rowProps(task)} />
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {view === 'someday' && (
        <div className="flex flex-col gap-2">
          {someday.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="Someday is empty"
              description="The low-friction catch-all for anything without a due date."
            />
          ) : (
            someday.map((task) => <TaskRow key={task.id} {...rowProps(task)} />)
          )}
        </div>
      )}

      {view === 'done' && (
        <div className="flex flex-col gap-2">
          {done.length === 0 ? (
            <EmptyState icon={ListChecks} title="Nothing done yet" description="Completed tasks show up here." />
          ) : (
            done.map((task) => <TaskRow key={task.id} {...rowProps(task)} />)
          )}
        </div>
      )}

      {snoozed.length > 0 && (
        <div className="flex items-center gap-1 self-start">
          <Button variant="ghost" className="w-fit gap-1.5 text-muted-foreground" onClick={() => setReviewOpen(true)}>
            <Moon className="size-4" />
            {snoozed.length} snoozed — review
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="What does snoozing do?"
                className="size-11 text-muted-foreground"
              >
                <Info className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-64 text-sm">
              Snoozing takes a task off today's list instantly — no reason needed, and nothing is deleted. It
              waits here until you send it to Someday or give it a new due date.
            </PopoverContent>
          </Popover>
        </div>
      )}

      <TaskDetailDrawer task={detailTask} onOpenChange={(open) => !open && setDetailTask(null)} />
      <SnoozedReviewSheet open={reviewOpen} onOpenChange={setReviewOpen} tasks={snoozed} />
    </div>
  )
}

function SnoozedReviewSheet({
  open,
  onOpenChange,
  tasks,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tasks: Task[]
}) {
  const unsnooze = useUnsnoozeTask()
  const isMobile = useIsMobile()
  const [rescheduling, setRescheduling] = useState<number | null>(null)
  const [dueDate, setDueDate] = useState('')

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setRescheduling(null)
      }}
      direction={isMobile ? 'bottom' : 'right'}
    >
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[75dvh]">
        <DrawerHeader>
          <DrawerTitle>Snoozed — weekly review</DrawerTitle>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing snoozed right now.</p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="flex flex-col gap-2 rounded-md border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm">{task.title}</p>
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unsnooze.mutate({ id: task.id, due_date: null })}
                      disabled={unsnooze.isPending}
                    >
                      Someday
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRescheduling(rescheduling === task.id ? null : task.id)}
                    >
                      Reschedule
                    </Button>
                  </div>
                </div>
                {rescheduling === task.id && (
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      className="h-9"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      enterKeyHint="done"
                    />
                    <Button
                      size="sm"
                      disabled={!dueDate || unsnooze.isPending}
                      onClick={() => {
                        unsnooze.mutate(
                          { id: task.id, due_date: dueDate },
                          {
                            onSuccess: () => {
                              setRescheduling(null)
                              setDueDate('')
                            },
                          },
                        )
                      }}
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <DrawerFooter className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <DrawerClose asChild>
            <Button variant="outline" className="h-11">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
