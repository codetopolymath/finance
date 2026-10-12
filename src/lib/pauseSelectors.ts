import { differenceInCalendarDays, isSameDay, startOfDay, subDays } from 'date-fns'
import type { SmokeLog } from '@/types/pause'

const AVERAGE_WINDOW_DAYS = 7

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
