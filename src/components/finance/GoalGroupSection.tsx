import { useState } from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { GoalRow } from '@/components/finance/GoalRow'
import { useDeleteGoalGroup, useRenameGoalGroup } from '@/lib/goalsQueries'
import type { Goal, GoalGroup } from '@/types/goals'

interface GoalGroupSectionProps {
  group: GoalGroup
  goals: Goal[]
  onOpenDetail: (goal: Goal) => void
}

export function GoalGroupSection({ group, goals, onOpenDetail }: GoalGroupSectionProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-muted-foreground">
          {group.name} <span className="text-2xs">({goals.length})</span>
        </h3>
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label={`${group.name} folder options`}>
              <MoreHorizontal className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <GroupMenu group={group} onDone={() => setMenuOpen(false)} />
          </PopoverContent>
        </Popover>
      </div>

      {goals.length === 0 ? (
        <p className="px-1 text-2xs text-muted-foreground">No goals in this folder yet.</p>
      ) : (
        goals.map((goal) => <GoalRow key={goal.id} goal={goal} onOpenDetail={onOpenDetail} />)
      )}
    </div>
  )
}

function GroupMenu({ group, onDone }: { group: GoalGroup; onDone: () => void }) {
  const [name, setName] = useState(group.name)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const rename = useRenameGoalGroup()
  const deleteGroup = useDeleteGoalGroup()

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === group.name) return
    rename.mutate({ id: group.id, name: trimmed }, { onSuccess: onDone })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`group-name-${group.id}`} className="text-xs text-muted-foreground">
          Folder name
        </label>
        <div className="flex gap-2">
          <Input
            id={`group-name-${group.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9"
          />
          <Button size="sm" onClick={save} disabled={!name.trim() || rename.isPending}>
            {rename.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
      <Button
        variant={confirmingDelete ? 'destructive' : 'outline'}
        size="sm"
        onClick={() => {
          if (confirmingDelete) {
            deleteGroup.mutate(group.id, { onSuccess: onDone })
            return
          }
          setConfirmingDelete(true)
        }}
        disabled={deleteGroup.isPending}
      >
        <Trash2 />
        {deleteGroup.isPending ? 'Deleting…' : confirmingDelete ? 'Tap again to delete' : 'Delete folder'}
      </Button>
    </div>
  )
}
