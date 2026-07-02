import { AlertTriangle, Landmark } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/finance/EmptyState'
import { useLoans } from '@/lib/loanQueries'
import { summarizeLoan } from '@/lib/loanSelectors'
import { formatCurrency, formatFullDate, parseDateOnly } from '@/lib/format'
import type { LoanInstallment, LoanWithInstallments } from '@/types/loan'

export default function Loans() {
  const { data, isPending, isError, refetch } = useLoans()

  if (isPending) {
    return <LoansSkeleton />
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load loans"
        description="Check your connection, or sign in again if your session expired."
        action={{ label: 'Retry', onClick: () => refetch() }}
      />
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState icon={Landmark} title="No loans" description="Nothing to track yet." />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {data.map((loan) => (
        <LoanCard key={loan.id} loan={loan} />
      ))}
    </div>
  )
}

function LoanCard({ loan }: { loan: LoanWithInstallments }) {
  const summary = summarizeLoan(loan)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base font-medium">
          <span>
            {loan.lender} · {loan.loan_type}
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {formatCurrency(loan.emi_amount)}/mo
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="Outstanding" value={formatCurrency(summary.outstanding)} />
          <Stat
            label="Next EMI"
            value={
              summary.nextInstallment
                ? `${formatCurrency(summary.nextInstallment.amount)} · ${formatFullDate(
                    parseDateOnly(summary.nextInstallment.due_date),
                  )}`
                : 'Fully paid'
            }
          />
          <Stat
            label="Progress"
            value={`${Math.round(summary.progressPercent)}% · ${summary.paidCount}/${summary.totalCount} EMIs`}
          />
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${summary.progressPercent}%` }}
          />
        </div>

        {summary.payoffDate && (
          <p className="text-xs text-muted-foreground">
            Expected payoff: {formatFullDate(summary.payoffDate)}
          </p>
        )}

        <ScheduleList installments={loan.installments} nextInstallmentId={summary.nextInstallment?.id} />
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

function ScheduleList({
  installments,
  nextInstallmentId,
}: {
  installments: LoanInstallment[]
  nextInstallmentId?: number
}) {
  const today = new Date()

  return (
    <div className="flex max-h-80 flex-col divide-y overflow-y-auto rounded-lg border">
      {installments.map((installment) => {
        const dueDate = parseDateOnly(installment.due_date)
        const isNext = installment.id === nextInstallmentId
        const isPast = dueDate < today && !isNext

        return (
          <div key={installment.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-xs tabular-nums text-muted-foreground">
                {installment.installment_num}
              </span>
              <span className={isPast ? 'text-muted-foreground' : 'font-medium'}>
                {formatFullDate(dueDate).replace(/^\w+, /, '')}
              </span>
              {isNext && (
                <Badge variant="default" className="text-xs">
                  Next
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 font-mono text-xs tabular-nums text-muted-foreground">
              <span>P {formatCurrency(installment.principal)}</span>
              <span>I {formatCurrency(installment.interest)}</span>
              <span className="w-20 text-right font-medium text-foreground">
                {formatCurrency(installment.amount)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LoansSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
