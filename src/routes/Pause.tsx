import { useMemo } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'
import { AlertTriangle, Wind } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/finance/EmptyState'
import { PauseHeroCard } from '@/components/finance/PauseHeroCard'
import { PauseLogRow } from '@/components/finance/PauseLogRow'
import { usePauseBrands, useSmokeLogs } from '@/lib/pauseQueries'
import { averageOf, logsOnDay, priorDaysAverage, sum } from '@/lib/pauseSelectors'

export default function Pause() {
  const { data: logs, isPending, isError, refetch } = useSmokeLogs()
  const { data: brands } = usePauseBrands()

  const today = useMemo(() => {
    const now = new Date()
    const todayLogs = logsOnDay(logs ?? [], now)
    return {
      logs: todayLogs,
      average: priorDaysAverage(logs ?? [], now),
      tar: sum(todayLogs, 'tar_mg'),
      nicotine: sum(todayLogs, 'nicotine_mg'),
      heartRate: averageOf(todayLogs, 'heart_rate'),
    }
  }, [logs])

  if (isPending) return <PauseSkeleton />

  if (isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load Pause data"
        description="Check your connection, or sign in again if your session expired."
        action={{ label: 'Retry', onClick: () => refetch() }}
      />
    )
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={Wind}
        title="Nothing logged yet"
        description="Entries from your watch show up here once they sync."
      />
    )
  }

  const brandName = (id: number) => brands?.find((b) => b.id === id)?.name ?? 'Other'
  const last = today.logs[0]

  return (
    <div className="flex flex-col gap-6">
      <PauseHeroCard
        count={today.logs.length}
        average={today.average}
        lastLoggedLabel={last ? `${formatDistanceToNowStrict(new Date(last.logged_at))} ago` : null}
      />

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Tar" value={`~${Math.round(today.tar)}`} unit="mg" />
        <StatTile label="Nicotine" value={`~${today.nicotine.toFixed(1)}`} unit="mg" />
        <StatTile
          label="Avg heart rate"
          value={today.heartRate === null ? '–' : String(Math.round(today.heartRate))}
          unit="bpm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="px-1 text-sm font-medium text-muted-foreground">Today ({today.logs.length})</h3>
        {today.logs.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">Nothing logged today.</p>
        ) : (
          today.logs.map((log) => <PauseLogRow key={log.id} log={log} brandName={brandName(log.brand_id)} />)
        )}
      </div>
    </div>
  )
}

function StatTile({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <Card className="gap-2 py-4 shadow-card">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-display font-medium tabular-nums">
          {value}
          <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>
        </p>
      </CardContent>
    </Card>
  )
}

function PauseSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  )
}
