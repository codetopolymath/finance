import { useMutation } from '@tanstack/react-query'
import { supabase } from './supabase'

interface DayCleanupResult {
  claude_code_session_url?: string
  error?: string
}

async function triggerDayCleanup(date: string): Promise<DayCleanupResult> {
  const { data, error } = await supabase.functions.invoke<DayCleanupResult>('trigger-day-cleanup', {
    body: { date },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data ?? {}
}

export function useTriggerDayCleanup() {
  return useMutation({ mutationFn: triggerDayCleanup })
}

/** Yesterday's calendar date in Asia/Kolkata, as YYYY-MM-DD — matches the
 * edge function's own fallback so the date input's default agrees with what
 * the routine would pick if no date were sent at all. */
export function yesterdayInIst(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)!.value
  const todayIst = new Date(`${get('year')}-${get('month')}-${get('day')}T00:00:00Z`)
  todayIst.setUTCDate(todayIst.getUTCDate() - 1)
  return todayIst.toISOString().slice(0, 10)
}
