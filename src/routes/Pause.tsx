import { useMemo, useState } from 'react'
import { format, formatDistanceToNowStrict, isToday } from 'date-fns'
import { AlertTriangle, Wind } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { EmptyState } from '@/components/finance/EmptyState'
import { MonthPicker } from '@/components/finance/MonthPicker'
import { PauseDayPicker } from '@/components/finance/PauseDayPicker'
import { PauseHeroCard } from '@/components/finance/PauseHeroCard'
import { PauseHourChart } from '@/components/finance/PauseHourChart'
import { PauseLogRow } from '@/components/finance/PauseLogRow'
import { PauseRhythmHeatmap } from '@/components/finance/PauseRhythmHeatmap'
import { PauseTrendChart, type PauseMeasure } from '@/components/finance/PauseTrendChart'
import { formatDayHeading } from '@/lib/format'
import { formatHour } from '@/lib/pauseFormat'
import { usePauseBrands, useSmokeLogs } from '@/lib/pauseQueries'
import {
  averageOf,
  busiestHour,
  dailyPoints,
  dayRange,
  hourCounts,
  logsInMonth,
  logsOnDay,
  monthRange,
  priorDaysAverage,
  sum,
  weekdayHourCounts,
} from '@/lib/pauseSelectors'

type View = 'today' | 'trend' | 'rhythm'

export default function Pause() {
  const [view, setView] = useState<View>('today')
  const [day, setDay] = useState(() => new Date())
  const [month, setMonth] = useState(() => new Date())

  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(v) => v && setView(v as View)}
        variant="outline"
        className="w-full"
      >
        <ToggleGroupItem value="today" className="h-11 flex-1">
          Today
        </ToggleGroupItem>
        <ToggleGroupItem value="trend" className="h-11 flex-1">
          Trend
        </ToggleGroupItem>
        <ToggleGroupItem value="rhythm" className="h-11 flex-1">
          Rhythm
        </ToggleGroupItem>
      </ToggleGroup>

      {view === 'today' ? (
        <>
          <PauseDayPicker day={day} onChange={setDay} />
          <TodayView day={day} />
        </>
      ) : (
        <>
          <MonthPicker month={month} onChange={setMonth} />
          {view === 'trend' ? <TrendView month={month} /> : <RhythmView month={month} />}
        </>
      )}
    </div>
  )
}

function TodayView({ day }: { day: Date }) {
  const range = useMemo(() => dayRange(day), [day])
  const { data: logs, isPending, isError, refetch } = useSmokeLogs(range)
  const { data: brands } = usePauseBrands()

  const summary = useMemo(() => {
    const dayLogs = logsOnDay(logs ?? [], day)
    return {
      logs: dayLogs,
      average: priorDaysAverage(logs ?? [], day),
      tar: sum(dayLogs, 'tar_mg'),
      nicotine: sum(dayLogs, 'nicotine_mg'),
      heartRate: averageOf(dayLogs, 'heart_rate'),
    }
  }, [logs, day])

  if (isPending) return <TodaySkeleton />

  if (isError) return <LoadError onRetry={() => refetch()} />

  if (logs.length === 0 && isToday(day)) {
    return (
      <EmptyState
        icon={Wind}
        title="Nothing logged yet"
        description="Entries from your watch show up here once they sync."
      />
    )
  }

  const brandName = (id: number) => brands?.find((b) => b.id === id)?.name ?? 'Other'
  const last = summary.logs[0]
  const today = isToday(day)

  return (
    <div className="flex flex-col gap-6">
      <PauseHeroCard
        title={today ? 'Logged today' : `Logged on ${format(day, 'd MMM')}`}
        count={summary.logs.length}
        average={summary.average}
        lastLoggedLabel={
          today && last ? `${formatDistanceToNowStrict(new Date(last.logged_at))} ago` : null
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Tar" value={`~${Math.round(summary.tar)}`} unit="mg" />
        <StatTile label="Nicotine" value={`~${summary.nicotine.toFixed(1)}`} unit="mg" />
        <StatTile
          label="Avg heart rate"
          value={summary.heartRate === null ? '–' : String(Math.round(summary.heartRate))}
          unit="bpm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="px-1 text-sm font-medium text-muted-foreground">
          {formatDayHeading(day)} ({summary.logs.length})
        </h3>
        {summary.logs.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">
            {today ? 'Nothing logged today.' : 'Nothing logged on this day.'}
          </p>
        ) : (
          summary.logs.map((log) => (
            <PauseLogRow key={log.id} log={log} brandName={brandName(log.brand_id)} />
          ))
        )}
      </div>
    </div>
  )
}

function TrendView({ month }: { month: Date }) {
  const range = useMemo(() => monthRange(month), [month])
  const { data: logs, isPending, isError, refetch } = useSmokeLogs(range)
  const [measure, setMeasure] = useState<PauseMeasure>('count')

  const points = useMemo(() => dailyPoints(logs ?? [], month), [logs, month])
  const monthLogs = useMemo(() => logsInMonth(logs ?? [], month), [logs, month])

  if (isPending) return <Skeleton className="h-80 w-full rounded-xl" />

  if (isError) return <LoadError onRetry={() => refetch()} />

  if (monthLogs.length === 0) {
    return (
      <EmptyState
        icon={Wind}
        title="Nothing logged this month"
        description="Pick another month, or check back once entries sync."
      />
    )
  }

  const perDay = monthLogs.length / points.length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base font-medium">Daily</CardTitle>
        <ToggleGroup
          type="single"
          value={measure}
          onValueChange={(v) => v && setMeasure(v as PauseMeasure)}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="count">Logged</ToggleGroupItem>
          <ToggleGroupItem value="tar">Tar</ToggleGroupItem>
          <ToggleGroupItem value="nicotine">Nicotine</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {monthLogs.length} logged · {perDay.toFixed(1)} a day on average
        </p>
        <PauseTrendChart data={points} measure={measure} />
      </CardContent>
    </Card>
  )
}

function RhythmView({ month }: { month: Date }) {
  const range = useMemo(() => monthRange(month), [month])
  const { data: logs, isPending, isError, refetch } = useSmokeLogs(range)

  const monthLogs = useMemo(() => logsInMonth(logs ?? [], month), [logs, month])
  const byHour = useMemo(() => hourCounts(monthLogs), [monthLogs])
  const byWeekdayHour = useMemo(() => weekdayHourCounts(monthLogs), [monthLogs])

  if (isPending) return <Skeleton className="h-96 w-full rounded-xl" />

  if (isError) return <LoadError onRetry={() => refetch()} />

  if (monthLogs.length === 0) {
    return (
      <EmptyState
        icon={Wind}
        title="Nothing logged this month"
        description="Pick another month, or check back once entries sync."
      />
    )
  }

  const peak = busiestHour(byHour)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Time of day</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {peak === null ? '' : `Most logs around ${formatHour(peak)}`}
          </p>
          <PauseHourChart counts={byHour} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Week pattern</CardTitle>
        </CardHeader>
        <CardContent>
          <PauseRhythmHeatmap counts={byWeekdayHour} />
        </CardContent>
      </Card>
    </div>
  )
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Couldn't load Pause data"
      description="Check your connection, or sign in again if your session expired."
      action={{ label: 'Retry', onClick: onRetry }}
    />
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

function TodaySkeleton() {
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
