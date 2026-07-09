import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatCurrency, formatShortDate, parseDateOnly } from '@/lib/format'
import type { LoanInstallment } from '@/types/loan'

const chartConfig = {
  principal: { label: 'Principal', color: 'var(--amort-principal)' },
  interest: { label: 'Interest', color: 'var(--amort-interest)' },
} satisfies ChartConfig

/** Stacked principal-vs-interest share of each EMI over the loan's life —
 * makes the "early EMIs are mostly interest" curve visible at a glance.
 * The schedule table below is the exact-numbers view of the same data. */
export function LoanAmortizationChart({ installments }: { installments: LoanInstallment[] }) {
  const chartData = installments.map((i) => ({
    due_date: i.due_date,
    principal: i.principal,
    interest: i.interest,
  }))

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-44 w-full">
      <AreaChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="due_date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(value: string) => formatShortDate(parseDateOnly(value)).replace(/ \d{4}$/, '')}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => formatShortDate(parseDateOnly(value as string))}
              formatter={(value, name, item) => (
                <>
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: item.color }}
                  />
                  {chartConfig[name as keyof typeof chartConfig].label}
                  <span className="ml-auto font-mono font-medium tabular-nums">
                    {formatCurrency(Number(value))}
                  </span>
                </>
              )}
            />
          }
        />
        <Area
          dataKey="interest"
          stackId="emi"
          type="monotone"
          fill="var(--color-interest)"
          fillOpacity={0.35}
          stroke="var(--color-interest)"
          strokeWidth={2}
        />
        <Area
          dataKey="principal"
          stackId="emi"
          type="monotone"
          fill="var(--color-principal)"
          fillOpacity={0.35}
          stroke="var(--color-principal)"
          strokeWidth={2}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  )
}
