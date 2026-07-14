import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { TransactionRow } from '@/components/finance/TransactionRow'
import { useTransactionsForDay } from '@/lib/queries'
import { parseDateOnly } from '@/lib/format'
import type { Transaction } from '@/types/transaction'

interface DateScopedTransactionPickerProps {
  date: string
  onDateChange: (date: string) => void
  selected: Transaction | null
  onSelect: (transaction: Transaction | null) => void
}

/** Date-scoped transaction browser shared by any feature that needs to
 * manually match a specific existing row (a safety net alongside automatic
 * UTR matching — see feature/receipt-transaction-capture.md). Deliberately
 * separate from the main Transactions page's filter row, which is built for
 * month-range infinite scroll, not a single day's small result set. */
export function DateScopedTransactionPicker({
  date,
  onDateChange,
  selected,
  onSelect,
}: DateScopedTransactionPickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const { data: transactions, isPending, isError } = useTransactionsForDay(date)

  return (
    <div className="flex flex-col gap-2">
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-fit justify-start">
            <CalendarIcon />
            {format(parseDateOnly(date), 'd MMM yyyy')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parseDateOnly(date)}
            onSelect={(day) => {
              if (!day) return
              onDateChange(format(day, 'yyyy-MM-dd'))
              onSelect(null)
              setCalendarOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>

      {isPending && <Skeleton className="h-16 w-full" />}

      {isError && <p className="text-xs text-destructive">Couldn't load transactions for this date.</p>}

      {!isPending && !isError && transactions.length === 0 && (
        <p className="text-xs text-muted-foreground">No transactions on this date.</p>
      )}

      {!isPending && !isError && transactions.length > 0 && (
        <div className="flex max-h-64 flex-col divide-y overflow-y-auto rounded-lg border">
          {transactions.map((t) => (
            <div key={t.id} className={selected?.id === t.id ? 'bg-primary/10' : undefined}>
              <TransactionRow
                transaction={t}
                onClick={() => onSelect(selected?.id === t.id ? null : t)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
