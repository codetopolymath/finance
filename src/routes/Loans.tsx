import type { ReactNode } from 'react'
import { AlertTriangle, Landmark } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/finance/EmptyState'
import { useLoans } from '@/lib/loanQueries'
import { summarizeLoan } from '@/lib/loanSelectors'
import { formatCurrency, formatFullDate, parseDateOnly } from '@/lib/format'
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
  const today = new Date()

  return (
    <div className="max-h-80 overflow-y-auto rounded-lg border">
      <Table>
        <TableHeader className="sticky top-0 bg-card">
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead className="text-right">Principal</TableHead>
            <TableHead className="text-right">Interest</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.map((installment) => {
            const dueDate = parseDateOnly(installment.due_date)
            const isNext = installment.id === nextInstallmentId
            const isPast = dueDate < today && !isNext

            return (
              <TableRow key={installment.id}>
                <TableCell className="tabular-nums text-muted-foreground">
                  {installment.installment_num}
                </TableCell>
                <TableCell className={cn(isPast && 'text-muted-foreground')}>
                  {formatFullDate(dueDate).replace(/^\w+, /, '')}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                  {formatCurrency(installment.principal)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                  {formatCurrency(installment.interest)}
                </TableCell>
                <TableCell className="text-right font-mono font-medium tabular-nums">
                  {formatCurrency(installment.amount)}
                </TableCell>
                <TableCell>
                  {isNext && (
                    <Badge variant="default" className="text-xs">
                      Next
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
        {payoffDate && <TableCaption className="px-3 pb-3">Expected payoff: {formatFullDate(payoffDate)}</TableCaption>}
      </Table>
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
