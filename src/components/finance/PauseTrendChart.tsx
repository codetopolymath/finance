import { format } from 'date-fns'
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { DayPoint } from '@/lib/pauseSelectors'

export type PauseMeasure = 'count' | 'tar' | 'nicotine'

const MEASURES: Record<PauseMeasure, { label: string; unit: string; digits: number }> = {
  count: { label: 'Logged', unit: '', digits: 0 },
  tar: { label: 'Tar', unit: ' mg', digits: 0 },
  nicotine: { label: 'Nicotine', unit: ' mg', digits: 1 },
}

const chartConfig = {
  value: { label: 'Logged', color: 'var(--pause)' },
  average: { label: '7-day average', color: 'var(--muted-foreground)' },
} satisfies ChartConfig

interface PauseTrendChartProps {
  data: DayPoint[]
  measure: PauseMeasure
}

/** Daily columns for one measure. Only the count carries a 7-day average line;
 * tar and nicotine are separate charts because their scales differ. */
export function PauseTrendChart({ data, measure }: PauseTrendChartProps) {
  const { label, unit, digits } = MEASURES[measure]
  const approx = measure === 'count' ? '' : '~'
  const chartData = data.map((point) => ({
    date: point.date.toISOString(),
    value: measure === 'count' ? point.count : point[measure],
    average: point.average,
  }))
  const config: ChartConfig = { ...chartConfig, value: { label, color: 'var(--pause)' } }

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <ComposedChart data={chartData} barCategoryGap={2}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={(value: string) => format(new Date(value), 'd MMM')}
        />
        <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={measure === 'nicotine'} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => format(new Date(value as string), 'EEE, d MMM yyyy')}
              formatter={(value, name) => (
                <span className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">{config[name as string]?.label ?? name}</span>
                  <span className="font-mono font-medium tabular-nums">
                    {name === 'average' ? '' : approx}
                    {Number(value).toFixed(name === 'average' ? 1 : digits)}
                    {name === 'average' ? '' : unit}
                  </span>
                </span>
              )}
            />
          }
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
        {measure === 'count' && (
          <Line
            dataKey="average"
            type="monotone"
            stroke="var(--color-average)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
        )}
        {measure === 'count' && <ChartLegend content={<ChartLegendContent />} />}
      </ComposedChart>
    </ChartContainer>
  )
}
