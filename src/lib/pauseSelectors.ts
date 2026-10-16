import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  subDays,
} from 'date-fns'
import type { PauseRange } from '@/lib/pauseQueries'
import type { SmokeLog } from '@/types/pause'

const AVERAGE_WINDOW_DAYS = 7

export interface DayPoint {
  date: Date
  count: number
  tar: number
  nicotine: number
  /** Trailing 7-day mean ending on this day, inclusive */
  average: number
}

/** The day plus the week before it, which the prior-days average needs. */
export function dayRange(day: Date): PauseRange {
  return { from: startOfDay(subDays(day, AVERAGE_WINDOW_DAYS)), to: startOfDay(addDays(day, 1)) }
}

/** The month plus six days before it, so the trailing average is complete from day 1. */
export function monthRange(month: Date): PauseRange {
  const start = startOfMonth(month)
  return { from: subDays(start, AVERAGE_WINDOW_DAYS - 1), to: addMonths(start, 1) }
}

export function logsInMonth(logs: SmokeLog[], month: Date): SmokeLog[] {
  return logs.filter((log) => isSameMonth(new Date(log.logged_at), month))
}

/** One point per day of the month, stopping at `now` for the current month. */
export function dailyPoints(logs: SmokeLog[], month: Date, now: Date = new Date()): DayPoint[] {
  const start = startOfMonth(month)
  const lastDay = subDays(addMonths(start, 1), 1)
  const end = lastDay > now ? startOfDay(now) : lastDay
  if (end < start) return []

  const counts = new Map<string, DayPoint>()
  const key = (d: Date) => startOfDay(d).getTime().toString()
  const days = eachDayOfInterval({ start: subDays(start, AVERAGE_WINDOW_DAYS - 1), end })
  for (const date of days) counts.set(key(date), { date, count: 0, tar: 0, nicotine: 0, average: 0 })
  for (const log of logs) {
    const point = counts.get(key(new Date(log.logged_at)))
    if (!point) continue
    point.count += 1
    point.tar += log.tar_mg
    point.nicotine += log.nicotine_mg
  }

  const ordered = days.map((d) => counts.get(key(d))!)
  return ordered.slice(AVERAGE_WINDOW_DAYS - 1).map((point, i) => {
    const window = ordered.slice(i, i + AVERAGE_WINDOW_DAYS)
    return { ...point, average: window.reduce((total, p) => total + p.count, 0) / AVERAGE_WINDOW_DAYS }
  })
}

/** Log counts by hour of day, index = hour (0-23). */
export function hourCounts(logs: SmokeLog[]): number[] {
  const counts = new Array<number>(24).fill(0)
  for (const log of logs) counts[new Date(log.logged_at).getHours()] += 1
  return counts
}

/** Log counts by weekday and hour, index = day * 24 + hour with Sunday = 0. */
export function weekdayHourCounts(logs: SmokeLog[]): number[] {
  const counts = new Array<number>(7 * 24).fill(0)
  for (const log of logs) {
    const at = new Date(log.logged_at)
    counts[at.getDay() * 24 + at.getHours()] += 1
  }
  return counts
}

/** Null when nothing is logged; ties resolve to the earliest hour. */
export function busiestHour(counts: number[]): number | null {
  const max = Math.max(0, ...counts)
  return max === 0 ? null : counts.indexOf(max)
}

/** Newest first, same order the query returns. */
export function logsOnDay(logs: SmokeLog[], day: Date): SmokeLog[] {
  return logs.filter((log) => isSameDay(new Date(log.logged_at), day))
}

/** Mean cigarettes per day over the days before `today`, capped at 7. Null
 * until at least one full earlier day exists — the average is meaningless then. */
export function priorDaysAverage(logs: SmokeLog[], today: Date): number | null {
  if (logs.length === 0) return null
  const oldest = new Date(logs[logs.length - 1].logged_at)
  // Days since the first log, so a new install isn't averaged against empty days
  const available = differenceInCalendarDays(today, oldest)
  const window = Math.min(AVERAGE_WINDOW_DAYS, available)
  if (window < 1) return null

  const from = startOfDay(subDays(today, window))
  const start = startOfDay(today)
  const count = logs.filter((log) => {
    const at = new Date(log.logged_at)
    return at >= from && at < start
  }).length
  return count / window
}

export function sum(logs: SmokeLog[], key: 'tar_mg' | 'nicotine_mg'): number {
  return logs.reduce((total, log) => total + log[key], 0)
}

export function averageOf(logs: SmokeLog[], key: 'heart_rate' | 'stress'): number | null {
  const values = logs.map((log) => log[key]).filter((v): v is number => v !== null)
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}
