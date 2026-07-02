import { useMemo, useState } from 'react'
import { AlertTriangle, Search, SearchX } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/finance/EmptyState'
import { TransactionRow } from '@/components/finance/TransactionRow'
import { TransactionDetailDrawer } from '@/components/finance/TransactionDetailDrawer'
import { useTransactions } from '@/lib/queries'
import { groupByDay } from '@/lib/selectors'
import { getFlowTypeMeta } from '@/lib/flowType'
import { formatDayHeading } from '@/lib/format'
import type { Transaction } from '@/types/transaction'

const RANGE_OPTIONS = {
  'this-month': 'This month',
  'last-month': 'Last month',
  'all-time': 'All time',
} as const
type RangeKey = keyof typeof RANGE_OPTIONS

const DAY_BATCH = 10

function isInRange(date: Date, range: RangeKey): boolean {
  if (range === 'all-time') return true
  const now = new Date()
  const monthsAgo = range === 'last-month' ? 1 : 0
  const target = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
  return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth()
}

export default function Transactions() {
  const { data, isPending, isError, refetch } = useTransactions()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [flowType, setFlowType] = useState('all')
  const [range, setRange] = useState<RangeKey>('all-time')
  const [visibleDays, setVisibleDays] = useState(DAY_BATCH)
  const [selected, setSelected] = useState<Transaction | null>(null)

  const categories = useMemo(() => {
    if (!data) return []
    return [...new Set(data.map((t) => t.category))].sort()
  }, [data])

  const flowTypes = useMemo(() => {
    if (!data) return []
    return [...new Set(data.map((t) => t.flow_type))]
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    const query = search.trim().toLowerCase()
    return data.filter((t) => {
      if (!isInRange(new Date(t.txn_at), range)) return false
      if (category !== 'all' && t.category !== category) return false
      if (flowType !== 'all' && t.flow_type !== flowType) return false
      if (query) {
        const haystack = `${t.vendor ?? ''} ${t.note ?? ''}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
  }, [data, search, category, flowType, range])

  const dayGroups = useMemo(() => groupByDay(filtered), [filtered])
  const visibleGroups = dayGroups.slice(0, visibleDays)
  const hasMore = dayGroups.length > visibleDays
  const hasActiveFilters = search !== '' || category !== 'all' || flowType !== 'all' || range !== 'all-time'

  if (isPending) {
    return <TransactionsSkeleton />
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 basis-56">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor or note"
            className="pl-8"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40" size="sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={flowType} onValueChange={setFlowType}>
          <SelectTrigger className="w-36" size="sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {flowTypes.map((ft) => (
              <SelectItem key={ft} value={ft}>
                {getFlowTypeMeta(ft).label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger className="w-32" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(RANGE_OPTIONS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {dayGroups.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No matching transactions"
          description={
            hasActiveFilters
              ? 'Try adjusting your search or filters.'
              : 'Nothing recorded yet.'
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {visibleGroups.map((group) => (
            <div key={group.date.toISOString()}>
              <p className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                {formatDayHeading(group.date)}
              </p>
              <div className="flex flex-col divide-y rounded-lg border">
                {group.transactions.map((t) => (
                  <TransactionRow key={t.id} transaction={t} onClick={() => setSelected(t)} />
                ))}
              </div>
            </div>
          ))}
          {hasMore && (
            <Button variant="outline" onClick={() => setVisibleDays((n) => n + DAY_BATCH)} className="self-center">
              Load more
            </Button>
          )}
        </div>
      )}

      <TransactionDetailDrawer transaction={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  )
}

function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  )
}
