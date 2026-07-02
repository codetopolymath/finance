import { useMemo, useState } from 'react'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/finance/EmptyState'
import { SpendTrendChart } from '@/components/finance/SpendTrendChart'
import { TopVendors } from '@/components/finance/TopVendors'
import { useTransactions } from '@/lib/queries'
import { spendTrend, topVendors } from '@/lib/selectors'

export default function Insights() {
  const { data, isPending, isError, refetch } = useTransactions()
  const [granularity, setGranularity] = useState<'day' | 'week'>('day')

  const trend = useMemo(() => (data ? spendTrend(data, granularity) : []), [data, granularity])
  const vendors = useMemo(() => (data ? topVendors(data, 5) : []), [data])

  if (isPending) {
    return <InsightsSkeleton />
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load transactions"
        description="Check your connection and try again."
        action={{ label: 'Retry', onClick: () => refetch() }}
      />
    )
  }

  return (
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
              description="Spend trends will appear once there's more history."
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
