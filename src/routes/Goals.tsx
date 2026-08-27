import { useMemo, useState } from 'react'
import { AlertTriangle, FolderPlus, Milestone } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/finance/EmptyState'
import { GoalCaptureBar } from '@/components/finance/GoalCaptureBar'
import { GoalRow } from '@/components/finance/GoalRow'
import { GoalGroupSection } from '@/components/finance/GoalGroupSection'
import { GoalDetailDrawer } from '@/components/finance/GoalDetailDrawer'
import { useCreateGoalGroup, useGoalGroups, useGoals } from '@/lib/goalsQueries'
import type { Goal } from '@/types/goals'

export default function Goals() {
  const { data: goals, isPending, isError, refetch } = useGoals()
  const { data: groups, isPending: groupsPending, isError: groupsError, refetch: refetchGroups } = useGoalGroups()
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null)

  // Achieved goals sink to the bottom, most recently completed first —
  // mirrors Reminders' default in-list completion behavior.
  const orderGoals = (list: Goal[]) => {
    const active = list.filter((g) => g.status === 'active')
    const done = list
      .filter((g) => g.status === 'done')
      .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
    return [...active, ...done]
  }

  const { grouped, ungrouped } = useMemo(() => {
    const all = goals ?? []
    const byGroup = new Map<number, Goal[]>()
    const ungroupedGoals: Goal[] = []
    for (const goal of all) {
      if (goal.group_id === null) {
        ungroupedGoals.push(goal)
        continue
      }
      const existing = byGroup.get(goal.group_id)
      if (existing) existing.push(goal)
      else byGroup.set(goal.group_id, [goal])
    }
    return {
      grouped: (groups ?? []).map((group) => ({ group, goals: orderGoals(byGroup.get(group.id) ?? []) })),
      ungrouped: orderGoals(ungroupedGoals),
    }
  }, [goals, groups])

  if (isPending || groupsPending) {
    return <GoalsSkeleton />
  }

  if (isError || groupsError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load goals"
        description="Check your connection, or sign in again if your session expired."
        action={{ label: 'Retry', onClick: () => (isError ? refetch() : refetchGroups()) }}
      />
    )
  }

  const isEmpty = grouped.length === 0 && ungrouped.length === 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <GoalCaptureBar />
        <NewGoalGroupControl />
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Milestone}
          title="No goals yet"
          description="Add the milestones you're working toward — a bank balance, a trip, a net worth number. Give each one a reason it matters."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(({ group, goals: groupGoals }) => (
            <GoalGroupSection key={group.id} group={group} goals={groupGoals} onOpenDetail={setDetailGoal} />
          ))}

          {ungrouped.length > 0 && (
            <div className="flex flex-col gap-2">
              {grouped.length > 0 && (
                <h3 className="px-1 text-sm font-medium text-muted-foreground">Goals</h3>
              )}
              {ungrouped.map((goal) => (
                <GoalRow key={goal.id} goal={goal} onOpenDetail={setDetailGoal} />
              ))}
            </div>
          )}
        </div>
      )}

      <GoalDetailDrawer goal={detailGoal} onOpenChange={(open) => !open && setDetailGoal(null)} />
    </div>
  )
}

function NewGoalGroupControl() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const create = useCreateGoalGroup()

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => setOpen(true)}>
        <FolderPlus />
        New folder
      </Button>
    )
  }

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    create.mutate(trimmed, {
      onSuccess: () => {
        setName('')
        setOpen(false)
      },
    })
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Folder name…"
        className="h-9"
        aria-label="New folder name"
        onBlur={() => {
          if (!name.trim()) setOpen(false)
        }}
      />
      <Button type="submit" size="sm" disabled={!name.trim() || create.isPending}>
        {create.isPending ? 'Adding…' : 'Add'}
      </Button>
    </form>
  )
}

function GoalsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-11 w-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  )
}
