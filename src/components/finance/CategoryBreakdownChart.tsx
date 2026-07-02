import { PieChart as PieChartIcon } from 'lucide-react'
import { Cell, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
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

  const chartConfig = colored.reduce((config, item) => {
    config[item.category] = { label: item.category, color: item.color }
    return config
  }, {} as ChartConfig)

  return (
    <div className="flex flex-col gap-4">
      <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-64">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name, item) => (
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: item.payload.fill }}
                      />
                      <span className="text-muted-foreground">{name}</span>
                    </div>
                    <span className="font-mono font-medium tabular-nums">
                      {formatCurrency(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Pie data={colored} dataKey="total" nameKey="category" innerRadius={50} outerRadius={80} strokeWidth={2}>
            {colored.map((entry) => (
              <Cell key={entry.category} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-sm">
        {colored.map((item) => (
          <li key={item.category} className="flex items-center gap-1.5">
            <span
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.category}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
