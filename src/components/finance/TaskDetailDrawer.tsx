import { useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { BudgetBar } from '@/components/finance/BudgetBar'
import { useIsMobile } from '@/hooks/use-mobile'
import { useDeleteTask, useFocusSessions, useUpdateTask } from '@/lib/focusQueries'
import { budgetBurn, cycleCounts, isCleanCompletion } from '@/lib/focusSelectors'
import type { Task } from '@/types/focus'

interface TaskDetailDrawerProps {
  task: Task | null
  onOpenChange: (open: boolean) => void
}

export function TaskDetailDrawer({ task, onOpenChange }: TaskDetailDrawerProps) {
  const isMobile = useIsMobile()

  return (
    <Drawer open={task !== null} onOpenChange={onOpenChange} direction={isMobile ? 'bottom' : 'right'}>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[75dvh]">
        {task && <DrawerBody key={task.id} task={task} onDeleted={() => onOpenChange(false)} />}
      </DrawerContent>
    </Drawer>
  )
}

function DrawerBody({ task, onDeleted }: { task: Task; onDeleted: () => void }) {
  const [notes, setNotes] = useState(task.notes ?? '')
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const [budget, setBudget] = useState(task.budget_minutes?.toString() ?? '')

  const update = useUpdateTask()
  const deleteTask = useDeleteTask()
  const { data: history } = useFocusSessions(task.id)

  const now = new Date()
  const sessions = history?.sessions ?? []
  const pauses = history?.pauses ?? []
  const burn = budgetBurn(task, sessions, pauses, now)
  const cycles = cycleCounts(sessions)
  const clean = task.status === 'done' && isCleanCompletion(sessions, pauses)

  const save = () => {
    update.mutate({
      id: task.id,
      patch: {
        notes: notes.trim() || null,
        due_date: dueDate || null,
        budget_minutes: budget ? Number(budget) : null,
      },
    })
  }

  return (
    <>
      <DrawerHeader>
        <div className="flex items-start justify-between gap-2">
          <DrawerTitle className="text-left">{task.title}</DrawerTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={task.is_frog ? 'Unflag as most important' : "Flag as today's most important task"}
            onClick={() => update.mutate({ id: task.id, patch: { is_frog: !task.is_frog } })}
          >
            <Star className={task.is_frog ? 'fill-primary text-primary' : ''} />
          </Button>
        </div>
      </DrawerHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 text-sm">
        {(cycles.workSessions > 0 || burn) && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {cycles.workSessions > 0 && (
                <span>
                  {cycles.workSessions} work session{cycles.workSessions === 1 ? '' : 's'}, {cycles.breakSessions}{' '}
                  break{cycles.breakSessions === 1 ? '' : 's'}
                </span>
              )}
              {clean && <Badge variant="secondary">Clean completion</Badge>}
            </div>
            {burn && <BudgetBar burn={burn} />}
            <Separator />
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-due" className="text-muted-foreground">
            Due date
          </label>
          <Input
            id="task-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-budget" className="text-muted-foreground">
            Time budget (minutes)
          </label>
          <Input
            id="task-budget"
            type="number"
            min={1}
            inputMode="numeric"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="No budget set"
            className="h-11"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-notes" className="text-muted-foreground">
            Notes
          </label>
          <Textarea id="task-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <DrawerFooter className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button className="h-11" onClick={save} disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button
          variant="outline"
          className="h-11"
          onClick={() => deleteTask.mutate(task.id, { onSuccess: onDeleted })}
          disabled={deleteTask.isPending}
        >
          <Trash2 />
          Delete task
        </Button>
        <DrawerClose asChild>
          <Button variant="ghost" className="h-11">
            Close
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </>
  )
}
