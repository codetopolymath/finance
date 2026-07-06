import { endOfMonth, isWithinInterval, startOfDay, startOfMonth, startOfWeek } from 'date-fns'
import type { Transaction } from '@/types/transaction'
import { getFlowTypeMeta } from './flowType'

export function filterByMonth(transactions: Transaction[], monthDate: Date): Transaction[] {
  const interval = { start: startOfMonth(monthDate), end: endOfMonth(monthDate) }
  return transactions.filter((t) => isWithinInterval(new Date(t.txn_at), interval))
}

export interface MonthSummary {
  totalIn: number
  totalOut: number
  net: number
}

/** Income/spend totals for a set of transactions, driven by each flow_type's
 * sign (see flowType.ts). Unknown flow types (sign 0) are excluded from both
 * totals rather than guessed at. Debt repayment counts as outflow here (it's
 * real money leaving the account) even though it's excluded from the
 * discretionary-spend breakdowns below. */
export function summarize(transactions: Transaction[]): MonthSummary {
  let totalIn = 0
  let totalOut = 0
  for (const t of transactions) {
    const { sign } = getFlowTypeMeta(t.flow_type)
    if (sign === 1) totalIn += t.amount
    else if (sign === -1) totalOut += t.amount
  }
  return { totalIn, totalOut, net: totalIn - totalOut }
}

/** Outflow (sign -1) that counts as discretionary spend, i.e. excludes debt
 * repayment — EMIs are a committed obligation, not a spending choice. */
function isDiscretionarySpend(t: Transaction): boolean {
  return getFlowTypeMeta(t.flow_type).sign === -1 && t.flow_type !== 'debt_repayment'
}

export interface CategoryTotal {
  category: string
  total: number
  count: number
}

/** "Where did my money go" — only counts outflows (sign -1), so income
 * categories like Salary don't dilute the spend breakdown. */
export function categoryBreakdown(transactions: Transaction[]): CategoryTotal[] {
  const totals = new Map<string, CategoryTotal>()
  for (const t of transactions) {
    if (!isDiscretionarySpend(t)) continue
    const existing = totals.get(t.category)
    if (existing) {
      existing.total += t.amount
      existing.count += 1
    } else {
      totals.set(t.category, { category: t.category, total: t.amount, count: 1 })
    }
  }
  return [...totals.values()].sort((a, b) => b.total - a.total)
}

export interface DayGroup {
  date: Date
  transactions: Transaction[]
}

/** Groups already-sorted (desc) transactions into day buckets, preserving order. */
export function groupByDay(transactions: Transaction[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const t of transactions) {
    const day = startOfDay(new Date(t.txn_at))
    const last = groups[groups.length - 1]
    if (last && last.date.getTime() === day.getTime()) {
      last.transactions.push(t)
    } else {
      groups.push({ date: day, transactions: [t] })
    }
  }
  return groups
}

export interface VendorTotal {
  vendor: string
  total: number
  count: number
}

export interface TrendPoint {
  date: Date
  total: number
}

/** Daily or weekly outflow (sign -1) totals, sorted ascending, for the trend chart. */
export function spendTrend(transactions: Transaction[], granularity: 'day' | 'week'): TrendPoint[] {
  const bucket = new Map<number, number>()
  for (const t of transactions) {
    if (!isDiscretionarySpend(t)) continue
    const date = new Date(t.txn_at)
    const key = (granularity === 'week' ? startOfWeek(date) : startOfDay(date)).getTime()
    bucket.set(key, (bucket.get(key) ?? 0) + t.amount)
  }
  return [...bucket.entries()]
    .sort(([a], [b]) => a - b)
    .map(([time, total]) => ({ date: new Date(time), total }))
}

export interface HeatmapCell {
  /** 0 = Sunday, per Date#getDay(). */
  day: number
  /** 0-23, local time. */
  hour: number
  total: number
  count: number
}

/** Outflow (sign -1) totals bucketed by weekday x hour-of-day, in the
 * viewer's local timezone (matches how every other date/time value in this
 * app is displayed — see formatTime/formatDateTime). Always returns all 168
 * buckets, zero-filled, so the heatmap grid never has to guess a missing
 * cell's position. */
export function spendHeatmap(transactions: Transaction[]): HeatmapCell[] {
  const cells: HeatmapCell[] = []
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      cells.push({ day, hour, total: 0, count: 0 })
    }
  }

  for (const t of transactions) {
    if (!isDiscretionarySpend(t)) continue
    const date = new Date(t.txn_at)
    const cell = cells[date.getDay() * 24 + date.getHours()]
    cell.total += t.amount
    cell.count += 1
  }

  return cells
}

export function topVendors(transactions: Transaction[], limit = 5): VendorTotal[] {
  const totals = new Map<string, VendorTotal>()
  for (const t of transactions) {
    if (!isDiscretionarySpend(t) || !t.vendor) continue
    const existing = totals.get(t.vendor)
    if (existing) {
      existing.total += t.amount
      existing.count += 1
    } else {
      totals.set(t.vendor, { vendor: t.vendor, total: t.amount, count: 1 })
    }
  }
  return [...totals.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
}
