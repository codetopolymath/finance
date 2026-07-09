import { Fragment, useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
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

function cellSummary(day: number, hour: number, cell: HeatmapCell): string {
  const window = `${DAY_LABELS[day]} ${formatHour(hour)}–${formatHour((hour + 1) % 24)}`
  return cell.count === 0
    ? `${window} · No spend`
    : `${window} · ${formatCurrency(cell.total)} · ${cell.count} txn${cell.count === 1 ? '' : 's'}`
}

export function SpendHeatmap({ data }: { data: HeatmapCell[] }) {
  const max = Math.max(0, ...data.map((c) => c.total))
  // Hover tooltips don't exist on touch — tapping a cell pins its summary in
  // the caption line below the grid instead.
  const [selected, setSelected] = useState<{ day: number; hour: number } | null>(null)

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
              const isSelected = selected?.day === day && selected?.hour === hour
              return (
                <Tooltip key={hour}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={cellSummary(day, hour, cell)}
                      onClick={() => setSelected(isSelected ? null : { day, hour })}
                      className={cn(
                        'aspect-square rounded-sm',
                        isSelected && 'ring-2 ring-ring ring-offset-1 ring-offset-background',
                      )}
                      style={{ backgroundColor: cellBackground(intensity) }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{cellSummary(day, hour, cell)}</TooltipContent>
                </Tooltip>
              )
            })}
          </Fragment>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
        <p className="min-h-4 text-xs">
          {selected ? cellSummary(selected.day, selected.hour, data[selected.day * 24 + selected.hour]) : ''}
        </p>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((step) => (
            <div key={step} className="size-3 rounded-sm" style={{ backgroundColor: cellBackground(step) }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
