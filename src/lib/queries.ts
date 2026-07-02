import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { Transaction } from '@/types/transaction'

async function fetchTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, txn_at, flow_type, amount, account, category, utr, vendor, note')
    .order('txn_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => ({
    ...row,
    amount: Number(row.amount),
  }))
}

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
    staleTime: 60_000,
  })
}
