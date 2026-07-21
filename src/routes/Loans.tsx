import { useEffect, useRef, type ReactNode } from 'react'
import { startOfDay } from 'date-fns'
import { AlertTriangle, CheckCircle2, Landmark } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/finance/EmptyState'
import { LoanAmortizationChart } from '@/components/finance/LoanAmortizationChart'
import { useLoans } from '@/lib/loanQueries'
import { summarizeLoan } from '@/lib/loanSelectors'
import { formatCurrency, formatFullDate, formatShortDate, parseDateOnly } from '@/lib/format'
import { cn } from '@/lib/utils'
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
          <StatCard label="Outstanding" value={formatCurrency(summary.outstanding)} />
          <StatCard
            label="Next EMI"
            value={
              summary.nextInstallment
                ? formatCurrency(summary.nextInstallment.amount)
                : 'Fully paid'
            }
            detail={
              summary.nextInstallment ? formatFullDate(parseDateOnly(summary.nextInstallment.due_date)) : undefined
            }
          />
          <StatCard
            label="Progress"
            value={`${Math.round(summary.progressPercent)}%`}
            detail={`${summary.paidCount}/${summary.totalCount} EMIs paid`}
          >
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${summary.progressPercent}%` }} />
            </div>
          </StatCard>
        </div>

        <LoanAmortizationChart installments={loan.installments} />

        <ScheduleTable
          installments={loan.installments}
          nextInstallmentId={summary.nextInstallment?.id}
          payoffDate={summary.payoffDate}
        />
      </CardContent>
    </Card>
  )
}

function StatCard({
  label,
  value,
  detail,
  children,
}: {
  label: string
  value: string
  detail?: string
  children?: ReactNode
}) {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-xs font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-4">
        <p className="text-2xl font-medium tabular-nums">{value}</p>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        {children}
      </CardContent>
    </Card>
  )
}

function ScheduleTable({
  installments,
  nextInstallmentId,
  payoffDate,
}: {
  installments: LoanInstallment[]
  nextInstallmentId?: number
  payoffDate: Date | null
}) {
  // Same paid predicate as summarizeLoan, so badge counts always match the
  // "x/y EMIs paid" stat above the table.
  const todayStart = startOfDay(new Date())
  const nextRowRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    nextRowRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-lg border p-2">
      {installments.map((installment) => {
        const dueDate = parseDateOnly(installment.due_date)
        const isNext = installment.id === nextInstallmentId
        const isPaid = dueDate < todayStart

        return (
          <div
            key={installment.id}
            ref={isNext ? nextRowRef : undefined}
            className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className={cn('text-sm', isPaid && 'text-muted-foreground')}>
                {formatShortDate(dueDate)}
              </span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                P {formatCurrency(installment.principal)} · I {formatCurrency(installment.interest)}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-mono text-sm font-medium tabular-nums">
                {formatCurrency(installment.amount)}
              </span>
              {isNext && (
                <Badge variant="default" className="text-xs">
                  Next
                </Badge>
              )}
              {isPaid && (
                <Badge variant="secondary" className="text-xs text-success">
                  <CheckCircle2 />
                  Paid
                </Badge>
              )}
            </div>
          </div>
        )
      })}
      {payoffDate && (
        <p className="px-1 pt-1 text-xs text-muted-foreground">Expected payoff: {formatFullDate(payoffDate)}</p>
      )}
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
