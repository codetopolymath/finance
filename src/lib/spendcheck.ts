import { useMutation } from '@tanstack/react-query'
import { supabase } from './supabase'

interface SpendcheckResult {
  claude_code_session_url?: string
  error?: string
}

async function triggerSpendcheck(): Promise<SpendcheckResult> {
  const { data, error } = await supabase.functions.invoke<SpendcheckResult>('trigger-spendcheck')
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data ?? {}
}

export function useTriggerSpendcheck() {
  return useMutation({ mutationFn: triggerSpendcheck })
}
