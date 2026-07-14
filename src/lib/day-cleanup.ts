import { FunctionsHttpError } from '@supabase/supabase-js'
import { useMutation } from '@tanstack/react-query'
import { supabase } from './supabase'

interface DayCleanupResult {
  claude_code_session_url?: string
  error?: string
}

/** Supabase-js's default FunctionsHttpError message is just "Edge Function
 * returned a non-2xx status code" — it doesn't surface the actual response
 * body. `error.context` is the raw Response, so read the real reason out of
 * it (the edge function passes through whatever the routine's /fire
 * endpoint returned) instead of showing that generic message in the toast. */
async function describeError(error: unknown): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null)
    const message =
      typeof body?.error === 'string'
        ? body.error
        : (body?.error?.message ?? body?.message ?? JSON.stringify(body) ?? error.message)
    return new Error(message)
  }
  return error instanceof Error ? error : new Error('Failed to start')
}

async function triggerDayCleanup(date: string): Promise<DayCleanupResult> {
  const { data, error } = await supabase.functions.invoke<DayCleanupResult>('trigger-day-cleanup', {
    body: { date },
  })
  if (error) throw await describeError(error)
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
