import { useMemo, useState } from 'react'
import { AlertTriangle, ListChecks, Moon } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { EmptyState } from '@/components/finance/EmptyState'
import { TaskCaptureBar } from '@/components/finance/TaskCaptureBar'
import { TaskRow } from '@/components/finance/TaskRow'
import { ActiveSessionBar } from '@/components/finance/ActiveSessionBar'
import { TaskDetailDrawer } from '@/components/finance/TaskDetailDrawer'
import { useActiveFocusSession, useTasks, useUnsnoozeTask } from '@/lib/focusQueries'
import { groupForSomeday, groupForToday, groupForUpcoming, snoozedTasks } from '@/lib/focusSelectors'
import { formatShortDate, parseDateOnly } from '@/lib/format'
import type { Task } from '@/types/focus'

type View = 'today' | 'upcoming' | 'someday'

export default function Focus() {
  const { data: tasks, isPending, isError, refetch } = useTasks()
  const { data: activeSession } = useActiveFocusSession()
  const [view, setView] = useState<View>('today')
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  const today = useMemo(() => groupForToday(tasks ?? []), [tasks])
  const upcoming = useMemo(() => groupForUpcoming(tasks ?? []), [tasks])
  const someday = useMemo(() => groupForSomeday(tasks ?? []), [tasks])
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

  const rowProps = (task: Task) => ({
    task,
    hasActiveSession,
    isActiveTask: activeTaskId === task.id,
    onOpenDetail: setDetailTask,
  })

  return (
    <div className="flex flex-col gap-4">
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
      </ToggleGroup>

      {view === 'today' && (
        <div className="flex flex-col gap-2">
          {today.frog && <TaskRow {...rowProps(today.frog)} />}
          {today.rest.map((task) => (
            <TaskRow key={task.id} {...rowProps(task)} />
          ))}
          {today.overflowCount > 0 && (
            <p className="px-1 text-xs text-muted-foreground">
              +{today.overflowCount} more in Someday/Upcoming
            </p>
          )}
          {!today.frog && today.rest.length === 0 && (
            <EmptyState
              icon={ListChecks}
              title="Nothing on today"
              description="Add a task above, or flag one from Someday as today's priority."
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

      {snoozed.length > 0 && (
        <Button variant="ghost" className="w-fit gap-1.5 self-start text-muted-foreground" onClick={() => setReviewOpen(true)}>
          <Moon className="size-4" />
          {snoozed.length} snoozed — review
        </Button>
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={isMobile ? 'bottom' : 'right'}>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[75dvh]">
        <DrawerHeader>
          <DrawerTitle>Snoozed — weekly review</DrawerTitle>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing snoozed right now.</p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <p className="min-w-0 flex-1 truncate text-sm">{task.title}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => unsnooze.mutate({ id: task.id, due_date: null })}
                  disabled={unsnooze.isPending}
                >
                  Move to Someday
                </Button>
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
