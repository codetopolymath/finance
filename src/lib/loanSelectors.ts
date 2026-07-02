import { startOfDay } from 'date-fns'
import { parseDateOnly } from '@/lib/format'
import type { LoanInstallment, LoanWithInstallments } from '@/types/loan'

export interface LoanSummary {
  outstanding: number
  progressPercent: number
  paidCount: number
  totalCount: number
  nextInstallment: LoanInstallment | null
  payoffDate: Date | null
}

export function summarizeLoan(loan: LoanWithInstallments, today: Date = new Date()): LoanSummary {
  const todayStart = startOfDay(today)
  const installments = loan.installments

  const paid = installments.filter((i) => parseDateOnly(i.due_date) < todayStart)
  const nextInstallment = installments.find((i) => parseDateOnly(i.due_date) >= todayStart) ?? null

  const outstanding = paid.length > 0 ? paid[paid.length - 1].closing_principal : loan.principal
  const progressPercent = loan.principal > 0 ? ((loan.principal - outstanding) / loan.principal) * 100 : 0

  const lastInstallment = installments[installments.length - 1]

  return {
    outstanding,
    progressPercent,
    paidCount: paid.length,
    totalCount: installments.length,
    nextInstallment,
    payoffDate: lastInstallment ? parseDateOnly(lastInstallment.due_date) : null,
  }
}
