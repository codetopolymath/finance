import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { Transaction } from '@/types/transaction'

const COLUMNS = 'id, txn_at, flow_type, amount, account, category, utr, vendor, note'

async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(COLUMNS)
    .order('txn_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => ({
    ...row,
    amount: Number(row.amount),
  }))
}

/** Used by Dashboard (month math over the full set) and Insights (all-time
 * trend/vendor aggregates) — both genuinely need the whole history, so this
 * stays a single full fetch, cached and shared via the query key. */
export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
    staleTime: 60_000,
  })
}

export type RangeKey = 'this-month' | 'last-month' | 'all-time'

export interface TransactionFilters {
  search: string
  category: string
  flowType: string
  range: RangeKey
}

const PAGE_SIZE = 30

/** PostgREST's `.or()` filter is a comma/paren-delimited grammar — strip the
 * characters that would let free-text search input reshape the filter
 * instead of just matching against it. */
function sanitizeForIlike(value: string): string {
  return value.replace(/[,()]/g, ' ').trim()
}

function monthBounds(monthsAgo: number): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1)
  return { start, end }
}

async function fetchTransactionsPage(
  filters: TransactionFilters,
  pageParam: number,
): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select(COLUMNS)
    .order('txn_at', { ascending: false })
    .range(pageParam, pageParam + PAGE_SIZE - 1)

  const search = sanitizeForIlike(filters.search)
  if (search) {
    query = query.or(`vendor.ilike.%${search}%,note.ilike.%${search}%`)
  }
  if (filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }
  if (filters.flowType !== 'all') {
    query = query.eq('flow_type', filters.flowType)
  }
  if (filters.range !== 'all-time') {
    const { start, end } = monthBounds(filters.range === 'last-month' ? 1 : 0)
    query = query.gte('txn_at', start.toISOString()).lt('txn_at', end.toISOString())
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row) => ({
    ...row,
    amount: Number(row.amount),
  }))
}

export function useInfiniteTransactions(filters: TransactionFilters) {
  return useInfiniteQuery({
    queryKey: ['transactions', 'infinite', filters],
    queryFn: ({ pageParam }) => fetchTransactionsPage(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    staleTime: 60_000,
  })
}

interface FilterOptions {
  categories: string[]
  flowTypes: string[]
}

/** Postgrest has no SELECT DISTINCT — this fetches only the two filter
 * columns (not the full row) across the table and dedupes client-side, which
 * is far lighter than the full-row fetch it replaces. */
async function fetchFilterOptions(): Promise<FilterOptions> {
  const { data, error } = await supabase.from('transactions').select('category, flow_type')
  if (error) throw error

  const categories = new Set<string>()
  const flowTypes = new Set<string>()
  for (const row of data ?? []) {
    categories.add(row.category)
    flowTypes.add(row.flow_type)
  }

  return {
    categories: [...categories].sort(),
    flowTypes: [...flowTypes],
  }
}

export function useTransactionFilterOptions() {
  return useQuery({
    queryKey: ['transactions', 'filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60_000,
  })
}
