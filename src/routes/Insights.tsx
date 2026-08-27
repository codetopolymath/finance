import { useMemo, useState } from 'react'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/finance/EmptyState'
import { SpendTrendChart } from '@/components/finance/SpendTrendChart'
import { SpendHeatmap } from '@/components/finance/SpendHeatmap'
import { TopVendors } from '@/components/finance/TopVendors'
import { MonthPicker } from '@/components/finance/MonthPicker'
import { useTransactions } from '@/lib/queries'
import { filterByMonth, spendHeatmap, spendTrend, topVendors } from '@/lib/selectors'

export default function Insights() {
  const { data, isPending, isError, refetch } = useTransactions()
  const [granularity, setGranularity] = useState<'day' | 'week'>('day')
  const [month, setMonth] = useState(() => new Date())

  const monthTransactions = useMemo(() => (data ? filterByMonth(data, month) : []), [data, month])
  const trend = useMemo(() => spendTrend(monthTransactions, granularity), [monthTransactions, granularity])
  const vendors = useMemo(() => topVendors(monthTransactions, 5), [monthTransactions])
  const heatmap = useMemo(() => spendHeatmap(monthTransactions), [monthTransactions])

  if (isPending) {
    return <InsightsSkeleton />
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load transactions"
        description="Check your connection, or sign in again if your session expired."
        action={{ label: 'Retry', onClick: () => refetch() }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <MonthPicker month={month} onChange={setMonth} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Spend trend</CardTitle>
            <ToggleGroup
              type="single"
              value={granularity}
              onValueChange={(v) => v && setGranularity(v as 'day' | 'week')}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="day">Daily</ToggleGroupItem>
              <ToggleGroupItem value="week">Weekly</ToggleGroupItem>
            </ToggleGroup>
          </CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="Nothing to chart yet"
                description="Spend trends will appear once there's more history this month."
              />
            ) : (
              <SpendTrendChart data={trend} granularity={granularity} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Top vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <TopVendors data={vendors} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-base font-medium">When you spend</CardTitle>
          </CardHeader>
          <CardContent>
            {heatmap.every((cell) => cell.count === 0) ? (
              <EmptyState
                icon={TrendingUp}
                title="Nothing to chart yet"
                description="This will fill in once there's more spending history this month."
              />
            ) : (
              <SpendHeatmap data={heatmap} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InsightsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <Skeleton className="h-80 lg:col-span-3" />
      <Skeleton className="h-80 lg:col-span-2" />
    </div>
  )
}
