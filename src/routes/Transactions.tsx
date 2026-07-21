import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { useInfiniteTransactions, useTransactionFilterOptions, type RangeKey } from '@/lib/queries'
import { groupByDay } from '@/lib/selectors'
import { getFlowTypeMeta } from '@/lib/flowType'
import { formatDayHeading, formatMonthLabel } from '@/lib/format'
import type { Transaction } from '@/types/transaction'

const STATIC_RANGE_OPTIONS: Record<Exclude<RangeKey, 'custom'>, string> = {
  'this-month': 'This month',
  'last-month': 'Last month',
  'all-time': 'All time',
}

const SEARCH_DEBOUNCE_MS = 400

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

export default function Transactions() {
  const [searchParams] = useSearchParams()
  const linkedCategory = searchParams.get('category')
  const linkedMonth = searchParams.get('month')

  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS)
  const [category, setCategory] = useState(linkedCategory ?? 'all')
  const [flowType, setFlowType] = useState('all')
  const [range, setRange] = useState<RangeKey>(linkedMonth ? 'custom' : 'all-time')
  const [customMonth] = useState<string | undefined>(linkedMonth ?? undefined)
  const [selected, setSelected] = useState<Transaction | null>(null)

  const { data: filterOptions } = useTransactionFilterOptions()

  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTransactions({ search, category, flowType, range, customMonth })

  const transactions = useMemo(() => data?.pages.flat() ?? [], [data])
  const dayGroups = useMemo(() => groupByDay(transactions), [transactions])
  const hasActiveFilters = search !== '' || category !== 'all' || flowType !== 'all' || range !== 'all-time'

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage()
      },
      { rootMargin: '200px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isPending) {
    return <TransactionsSkeleton />
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
      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-card">
        <div className="relative flex-1 basis-56">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
            {filterOptions?.categories.map((c) => (
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
            {filterOptions?.flowTypes.map((ft) => (
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
            {customMonth && (
              <SelectItem value="custom">{formatMonthLabel(new Date(customMonth))}</SelectItem>
            )}
            {Object.entries(STATIC_RANGE_OPTIONS).map(([key, label]) => (
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
          {dayGroups.map((group) => (
            <div key={group.date.toISOString()}>
              <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-1.5 backdrop-blur">
                <p className="px-2 text-2xs font-medium text-muted-foreground">
                  {formatDayHeading(group.date)}
                </p>
              </div>
              <div className="flex flex-col divide-y rounded-lg border shadow-card">
                {group.transactions.map((t) => (
                  <TransactionRow key={t.id} transaction={t} onClick={() => setSelected(t)} />
                ))}
              </div>
            </div>
          ))}

          <div ref={sentinelRef} />

          {hasNextPage && (
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="self-center"
            >
              {isFetchingNextPage ? 'Loading…' : 'Load more'}
            </Button>
          )}
        </div>
      )}

      <TransactionDetailDrawer
        transaction={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onUpdated={setSelected}
      />
    </div>
  )
}

function TransactionsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  )
}
