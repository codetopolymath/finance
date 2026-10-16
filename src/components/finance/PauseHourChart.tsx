import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatHour } from '@/lib/pauseFormat'

const chartConfig = {
  count: { label: 'Logged', color: 'var(--pause)' },
} satisfies ChartConfig

/** Logs per hour of day across the selected month. */
export function PauseHourChart({ counts }: { counts: number[] }) {
  const data = counts.map((count, hour) => ({ hour, count }))

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
      <BarChart data={data} barCategoryGap={2}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="hour"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={2}
          tickFormatter={formatHour}
        />
        <YAxis tickLine={false} axisLine={false} width={24} allowDecimals={false} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const hour = payload?.[0]?.payload?.hour as number | undefined
                return hour === undefined ? '' : `${formatHour(hour)}–${formatHour((hour + 1) % 24)}`
              }}
              formatter={(value) => (
                <span className="font-mono font-medium tabular-nums">{Number(value)} logged</span>
              )}
            />
          }
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
