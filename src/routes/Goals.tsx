import { useMemo, useState } from 'react'
import { AlertTriangle, Milestone } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/finance/EmptyState'
import { GoalCaptureBar } from '@/components/finance/GoalCaptureBar'
import { GoalRow } from '@/components/finance/GoalRow'
import { GoalDetailDrawer } from '@/components/finance/GoalDetailDrawer'
import { useGoals } from '@/lib/goalsQueries'
import type { Goal } from '@/types/goals'

export default function Goals() {
  const { data: goals, isPending, isError, refetch } = useGoals()
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null)

  const { active, done } = useMemo(() => {
    const all = goals ?? []
    return {
      active: all.filter((g) => g.status === 'active'),
      // Achieved goals sink to the bottom, most recently completed first —
      // mirrors Reminders' default in-list completion behavior.
      done: all
        .filter((g) => g.status === 'done')
        .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? '')),
    }
  }, [goals])

  if (isPending) {
    return <GoalsSkeleton />
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load goals"
        description="Check your connection, or sign in again if your session expired."
        action={{ label: 'Retry', onClick: () => refetch() }}
      />
    )
  }

  const ordered = [...active, ...done]

  return (
    <div className="flex flex-col gap-6">
      <GoalCaptureBar />

      {ordered.length === 0 ? (
        <EmptyState
          icon={Milestone}
          title="No goals yet"
          description="Add the milestones you're working toward — a bank balance, a trip, a net worth number. Give each one a reason it matters."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {ordered.map((goal) => (
            <GoalRow key={goal.id} goal={goal} onOpenDetail={setDetailGoal} />
          ))}
        </div>
      )}

      <GoalDetailDrawer goal={detailGoal} onOpenChange={(open) => !open && setDetailGoal(null)} />
    </div>
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
