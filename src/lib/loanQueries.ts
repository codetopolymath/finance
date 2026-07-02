import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { LoanWithInstallments } from '@/types/loan'

async function fetchLoans(): Promise<LoanWithInstallments[]> {
  const [{ data: loans, error: loansError }, { data: installments, error: installmentsError }] =
    await Promise.all([
      supabase.from('loans').select('*').order('start_date', { ascending: false }),
      supabase.from('loan_installments').select('*').order('installment_num', { ascending: true }),
    ])

  if (loansError) throw loansError
  if (installmentsError) throw installmentsError

  return (loans ?? []).map((loan) => ({
    ...loan,
    principal: Number(loan.principal),
    interest_rate: Number(loan.interest_rate),
    emi_amount: Number(loan.emi_amount),
    installments: (installments ?? [])
      .filter((installment) => installment.loan_id === loan.id)
      .map((installment) => ({
        ...installment,
        amount: Number(installment.amount),
        principal: Number(installment.principal),
        interest: Number(installment.interest),
        closing_principal: Number(installment.closing_principal),
      })),
  }))
}

export function useLoans() {
  return useQuery({
    queryKey: ['loans'],
    queryFn: fetchLoans,
    staleTime: 5 * 60_000,
  })
}
