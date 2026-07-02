import { format } from 'date-fns'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatCurrency } from '@/lib/format'
import type { TrendPoint } from '@/lib/selectors'

const chartConfig = {
  total: { label: 'Spend', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function SpendTrendChart({
  data,
  granularity,
}: {
  data: TrendPoint[]
  granularity: 'day' | 'week'
}) {
  const chartData = data.map((point) => ({ date: point.date.toISOString(), total: point.total }))

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(value: string) => format(new Date(value), 'd MMM')}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                format(new Date(value as string), granularity === 'week' ? "'Week of' d MMM" : 'EEE, d MMM yyyy')
              }
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums">{formatCurrency(Number(value))}</span>
              )}
            />
          }
        />
        <Area dataKey="total" type="natural" fill="url(#fillSpend)" stroke="var(--color-total)" />
      </AreaChart>
    </ChartContainer>
  )
}
