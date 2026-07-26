import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useIsMobile } from '@/hooks/use-mobile'
import { useDeleteGoal, useUpdateGoal } from '@/lib/goalsQueries'
import type { Goal } from '@/types/goals'

interface GoalDetailDrawerProps {
  goal: Goal | null
  onOpenChange: (open: boolean) => void
}

export function GoalDetailDrawer({ goal, onOpenChange }: GoalDetailDrawerProps) {
  const isMobile = useIsMobile()

  return (
    <Drawer open={goal !== null} onOpenChange={onOpenChange} direction={isMobile ? 'bottom' : 'right'}>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[75dvh]">
        {goal && <DrawerBody key={goal.id} goal={goal} onDeleted={() => onOpenChange(false)} />}
      </DrawerContent>
    </Drawer>
  )
}

function scrollFieldIntoView(target: HTMLElement) {
  setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
}

function DrawerBody({ goal, onDeleted }: { goal: Goal; onDeleted: () => void }) {
  const [title, setTitle] = useState(goal.title)
  const [why, setWhy] = useState(goal.why ?? '')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const update = useUpdateGoal()
  const deleteGoal = useDeleteGoal()

  const save = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    update.mutate({ id: goal.id, patch: { title: trimmed, why: why.trim() || null } })
  }

  return (
    <>
      <DrawerHeader>
        <DrawerTitle className="text-left">{goal.title}</DrawerTitle>
      </DrawerHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 text-sm">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="goal-title" className="text-muted-foreground">
            Title
          </label>
          <Input
            id="goal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
            enterKeyHint="next"
            className="h-11"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="goal-why" className="text-muted-foreground">
            Why it matters
          </label>
          <Textarea
            id="goal-why"
            rows={3}
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
            placeholder="What this milestone means to you"
            enterKeyHint="done"
          />
        </div>
      </div>

      <DrawerFooter className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button className="h-11" onClick={save} disabled={!title.trim() || update.isPending}>
          {update.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button
          variant={confirmingDelete ? 'destructive' : 'outline'}
          className="h-11"
          onClick={() => {
            if (confirmingDelete) {
              deleteGoal.mutate(goal.id, { onSuccess: onDeleted })
              return
            }
            setConfirmingDelete(true)
          }}
          disabled={deleteGoal.isPending}
        >
          <Trash2 />
          {deleteGoal.isPending ? 'Deleting…' : confirmingDelete ? 'Tap again to delete' : 'Delete goal'}
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
