import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { PieChart as PieChartIcon } from 'lucide-react'
import { EmptyState } from '@/components/finance/EmptyState'
import { formatCurrency } from '@/lib/format'
import { assignCategoryColors } from '@/lib/categoryColor'
import type { CategoryTotal } from '@/lib/selectors'

export function CategoryBreakdownChart({ data, month }: { data: CategoryTotal[]; month: Date }) {
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
  const monthParam = format(month, 'yyyy-MM-dd')

  return (
    <div className="flex flex-col gap-3">
      {colored.map((item) => {
        const percent = total > 0 ? (item.total / total) * 100 : 0
        const row = (
          <div className="flex flex-col gap-1">
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

        if (item.isOther) {
          return (
            <div key={item.category} title="Includes several smaller categories">
              {row}
            </div>
          )
        }

        return (
          <Link
            key={item.category}
            to={`/transactions?category=${encodeURIComponent(item.category)}&month=${monthParam}`}
            className="-mx-2 rounded-md px-2 py-1 transition-colors hover:bg-accent"
          >
            {row}
          </Link>
        )
      })}
    </div>
  )
}
