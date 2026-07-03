import { Fragment } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/format'
import type { HeatmapCell } from '@/lib/selectors'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21]

function formatHour(hour: number): string {
  if (hour === 0) return '12a'
  if (hour === 12) return '12p'
  return hour < 12 ? `${hour}a` : `${hour - 12}p`
}

/** Same hue as the "Spend" series everywhere else (--chart-1), scaled from
 * the surface up to full strength — a sequential ramp, not a fixed step
 * list, so it stays exact across light/dark without a second palette. */
function cellBackground(intensity: number): string {
  if (intensity === 0) return 'var(--muted)'
  const strength = 12 + intensity * 88
  return `color-mix(in oklch, var(--chart-1) ${strength}%, var(--muted))`
}

export function SpendHeatmap({ data }: { data: HeatmapCell[] }) {
  const max = Math.max(0, ...data.map((c) => c.total))

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid min-w-full gap-1" style={{ gridTemplateColumns: '2.5rem repeat(24, 1fr)' }}>
        <div />
        {Array.from({ length: 24 }, (_, hour) => (
          <div key={hour} className="text-center text-[10px] text-muted-foreground">
            {HOUR_TICKS.includes(hour) ? formatHour(hour) : ''}
          </div>
        ))}

        {DAY_LABELS.map((label, day) => (
          <Fragment key={day}>
            <div className="flex items-center text-xs text-muted-foreground">{label}</div>
            {Array.from({ length: 24 }, (_, hour) => {
              const cell = data[day * 24 + hour]
              const intensity = max === 0 ? 0 : cell.total / max
              return (
                <Tooltip key={hour}>
                  <TooltipTrigger asChild>
                    <div
                      className="aspect-square rounded-sm"
                      style={{ backgroundColor: cellBackground(intensity) }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {label} {formatHour(hour)}–{formatHour((hour + 1) % 24)} ·{' '}
                    {cell.count === 0
                      ? 'No spend'
                      : `${formatCurrency(cell.total)} · ${cell.count} txn${cell.count === 1 ? '' : 's'}`}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </Fragment>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((step) => (
          <div key={step} className="size-3 rounded-sm" style={{ backgroundColor: cellBackground(step) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
