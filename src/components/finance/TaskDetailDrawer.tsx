import { useRef, useState } from 'react'
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
import { gsap, useGSAP } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { useFocusSessions, useUpdateTask } from '@/lib/focusQueries'
import { budgetBurn, cycleCounts, isCleanCompletion, snoozeNudge } from '@/lib/focusSelectors'
import type { Task } from '@/types/focus'

interface TaskDetailDrawerProps {
  task: Task | null
  onOpenChange: (open: boolean) => void
}

export function TaskDetailDrawer({ task, onOpenChange }: TaskDetailDrawerProps) {
  const isMobile = useIsMobile()

  return (
    <Drawer open={task !== null} onOpenChange={onOpenChange} direction={isMobile ? 'bottom' : 'right'}>
      {/* Kept under vaul's 80%-height keyboard-avoidance threshold, and
       * fields below scroll themselves into view on focus — see
       * TransactionDetailDrawer.tsx for the fuller explanation of both. */}
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[75dvh]">
        {task && <DrawerBody key={task.id} task={task} />}
      </DrawerContent>
    </Drawer>
  )
}

function scrollFieldIntoView(target: HTMLElement) {
  setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
}

function DrawerBody({ task }: { task: Task }) {
  const [notes, setNotes] = useState(task.notes ?? '')
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const [budget, setBudget] = useState(task.budget_minutes?.toString() ?? '')

  const update = useUpdateTask()
  const { data: history } = useFocusSessions(task.id)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const frogRef = useRef<HTMLButtonElement | null>(null)
  const { contextSafe } = useGSAP(() => {}, { scope: headerRef })

  const handleToggleFrog = contextSafe(() => {
    update.mutate({ id: task.id, patch: { is_frog: !task.is_frog } })
    if (!prefersReducedMotion() && frogRef.current) {
      gsap.fromTo(
        frogRef.current,
        { y: 0, rotation: 0 },
        { y: -6, rotation: -12, duration: 0.15, ease: 'power1.out', yoyo: true, repeat: 1 },
      )
    }
  })

  const now = new Date()
  const sessions = history?.sessions ?? []
  const pauses = history?.pauses ?? []
  const burn = budgetBurn(task, sessions, pauses, now)
  const cycles = cycleCounts(sessions)
  const clean = task.status === 'done' && isCleanCompletion(sessions, pauses)
  const nudge = snoozeNudge(task.snooze_count)

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
      <DrawerHeader ref={headerRef}>
        <div className="flex items-start justify-between gap-2">
          <DrawerTitle className="text-left">{task.title}</DrawerTitle>
          <button
            ref={frogRef}
            type="button"
            aria-label={task.is_frog ? 'Unflag as most important' : "Flag as today's most important task"}
            onClick={handleToggleFrog}
            className={cn(
              'shrink-0 text-xl leading-none transition-transform active:scale-90 motion-reduce:active:scale-100',
              task.is_frog ? 'opacity-100 grayscale-0' : 'opacity-30 grayscale hover:opacity-60',
            )}
          >
            🐸
          </button>
        </div>
      </DrawerHeader>

      <div className="flex min-h-0 flex-1 transform-gpu flex-col gap-4 overflow-y-auto px-4 text-sm">
        {(cycles.workSessions > 0 || burn || task.snooze_count > 0) && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {cycles.workSessions > 0 && (
                <span>
                  {cycles.workSessions} work session{cycles.workSessions === 1 ? '' : 's'}, {cycles.breakSessions}{' '}
                  break{cycles.breakSessions === 1 ? '' : 's'}
                </span>
              )}
              {task.snooze_count > 0 && (
                <span>
                  Snoozed {task.snooze_count} time{task.snooze_count === 1 ? '' : 's'}
                </span>
              )}
              {clean && <Badge variant="secondary">Clean completion</Badge>}
            </div>
            {nudge && <p className="text-xs text-muted-foreground">{nudge}</p>}
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
            onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
            enterKeyHint="next"
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
            enterKeyHint="next"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
            placeholder="No budget set"
            className="h-11"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-notes" className="text-muted-foreground">
            Notes
          </label>
          <Textarea
            id="task-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
            enterKeyHint="done"
          />
        </div>
      </div>

      <DrawerFooter className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button className="h-11" onClick={save} disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save'}
        </Button>
        <DrawerClose asChild>
          <Button variant="outline" className="h-11">
            Close
          </Button>
        </DrawerClose>
      </DrawerFooter>
    </>
  )
}
