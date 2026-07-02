import { PieChart as PieChartIcon } from 'lucide-react'
import { EmptyState } from '@/components/finance/EmptyState'
import { formatCurrency } from '@/lib/format'
import { assignCategoryColors } from '@/lib/categoryColor'
import type { CategoryTotal } from '@/lib/selectors'

export function CategoryBreakdownChart({ data }: { data: CategoryTotal[] }) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={PieChartIcon}
        title="No spending yet"
        description="Nothing to break down for this month."
      />
    )
  }

  const colored = assignCategoryColors(data)
  const total = colored.reduce((sum, item) => sum + item.total, 0)
  const max = Math.max(...colored.map((item) => item.total))

  return (
    <div className="flex flex-col gap-3">
      {colored.map((item) => {
        const percent = total > 0 ? (item.total / total) * 100 : 0
        return (
          <div key={item.category} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate font-medium">{item.category}</span>
              </span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                {formatCurrency(item.total)} · {percent < 1 ? '<1' : Math.round(percent)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${(item.total / max) * 100}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
