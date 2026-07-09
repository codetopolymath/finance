import { formatTime } from '@/lib/format'
import { Amount } from '@/components/finance/Amount'
import type { Transaction } from '@/types/transaction'

interface TransactionRowProps {
  transaction: Transaction
  onClick?: () => void
}

export function TransactionRow({ transaction, onClick }: TransactionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-3 text-left transition-[background-color,transform] duration-100 hover:bg-muted/50 active:scale-[0.98] active:bg-muted motion-reduce:active:scale-100"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{transaction.vendor ?? transaction.category}</p>
        <p className="truncate text-xs text-muted-foreground">
          {transaction.category} · {formatTime(new Date(transaction.txn_at))}
        </p>
      </div>
      <Amount amount={transaction.amount} flowType={transaction.flow_type} className="shrink-0" />
    </button>
  )
}
