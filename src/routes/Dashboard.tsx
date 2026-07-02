import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/finance/EmptyState'
import { MetricCard } from '@/components/finance/MetricCard'
import { MonthPicker } from '@/components/finance/MonthPicker'
import { CategoryBreakdownChart } from '@/components/finance/CategoryBreakdownChart'
import { TransactionRow } from '@/components/finance/TransactionRow'
import { TransactionDetailDrawer } from '@/components/finance/TransactionDetailDrawer'
import { useTransactions } from '@/lib/queries'
import { categoryBreakdown, filterByMonth, summarize } from '@/lib/selectors'
import type { Transaction } from '@/types/transaction'

export default function Dashboard() {
  const { data, isPending, isError, refetch } = useTransactions()
  const [month, setMonth] = useState(() => new Date())
  const [selected, setSelected] = useState<Transaction | null>(null)

  const monthTransactions = useMemo(() => (data ? filterByMonth(data, month) : []), [data, month])
  const summary = useMemo(() => summarize(monthTransactions), [monthTransactions])
  const categories = useMemo(() => categoryBreakdown(monthTransactions), [monthTransactions])
  const recent = monthTransactions.slice(0, 8)

  if (isPending) {
    return <DashboardSkeleton />
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
    <div className="flex flex-col gap-6">
      <MonthPicker month={month} onChange={setMonth} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Income" value={summary.totalIn} tone="success" />
        <MetricCard label="Spent" value={summary.totalOut} tone="destructive" />
        <MetricCard label="Net" value={summary.net} tone={summary.net >= 0 ? 'success' : 'destructive'} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Where it went</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownChart data={categories} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Recent transactions</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/transactions">
                View all <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No transactions"
                description="Nothing recorded for this month yet."
              />
            ) : (
              <div className="flex flex-col divide-y">
                {recent.map((t) => (
                  <TransactionRow key={t.id} transaction={t} onClick={() => setSelected(t)} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionDetailDrawer transaction={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72 lg:col-span-3" />
      </div>
    </div>
  )
}
