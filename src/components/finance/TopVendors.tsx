import { Users } from 'lucide-react'
import { EmptyState } from '@/components/finance/EmptyState'
import { formatCurrency } from '@/lib/format'
import type { VendorTotal } from '@/lib/selectors'

export function TopVendors({ data }: { data: VendorTotal[] }) {
  if (data.length === 0) {
    return (
      <EmptyState icon={Users} title="No vendors yet" description="Spend transactions will show up here." />
    )
  }

  const max = Math.max(...data.map((v) => v.total))

  return (
    <div className="flex flex-col gap-3">
      {data.map((v) => (
        <div key={v.vendor} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate font-medium">{v.vendor}</span>
            <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
              {formatCurrency(v.total)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(v.total / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
