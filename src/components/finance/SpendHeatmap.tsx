import { Fragment, useMemo, useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { HeatmapCell } from '@/lib/selectors'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

interface BucketCell {
  total: number
  count: number
}

export function SpendHeatmap({ data }: { data: HeatmapCell[] }) {
  // 24 hourly columns are ~10px cells at phone width — too small to tap.
  // Fold into 2-hour buckets on mobile (12 columns) so cells stay touchable.
  const isMobile = useIsMobile()
  const hoursPerCol = isMobile ? 2 : 1
  const cols = 24 / hoursPerCol
  const hourTicks = isMobile ? [0, 6, 12, 18] : [0, 3, 6, 9, 12, 15, 18, 21]

  const grid = useMemo(() => {
    const buckets: BucketCell[][] = []
    for (let day = 0; day < 7; day++) {
      const row: BucketCell[] = []
      for (let col = 0; col < cols; col++) {
        let total = 0
        let count = 0
        for (let h = col * hoursPerCol; h < (col + 1) * hoursPerCol; h++) {
          const cell = data[day * 24 + h]
          total += cell?.total ?? 0
          count += cell?.count ?? 0
        }
        row.push({ total, count })
      }
      buckets.push(row)
    }
    return buckets
  }, [data, cols, hoursPerCol])

  const max = Math.max(0, ...grid.flat().map((c) => c.total))
  // Hover tooltips don't exist on touch — tapping a cell pins its summary in
  // the caption line below the grid instead.
  const [selected, setSelected] = useState<{ day: number; col: number } | null>(null)

  const cellSummary = (day: number, col: number, cell: BucketCell): string => {
    const startHour = col * hoursPerCol
    const window = `${DAY_LABELS[day]} ${formatHour(startHour)}–${formatHour((startHour + hoursPerCol) % 24)}`
    return cell.count === 0
      ? `${window} · No spend`
      : `${window} · ${formatCurrency(cell.total)} · ${cell.count} txn${cell.count === 1 ? '' : 's'}`
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid min-w-full gap-1"
        style={{ gridTemplateColumns: `2.5rem repeat(${cols}, 1fr)` }}
      >
        <div />
        {Array.from({ length: cols }, (_, col) => (
          <div key={col} className="text-center text-[10px] text-muted-foreground">
            {hourTicks.includes(col * hoursPerCol) ? formatHour(col * hoursPerCol) : ''}
          </div>
        ))}

        {DAY_LABELS.map((label, day) => (
          <Fragment key={day}>
            <div className="flex items-center text-xs text-muted-foreground">{label}</div>
            {grid[day].map((cell, col) => {
              const intensity = max === 0 ? 0 : cell.total / max
              const isSelected = selected?.day === day && selected?.col === col
              return (
                <Tooltip key={col}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={cellSummary(day, col, cell)}
                      onClick={() => setSelected(isSelected ? null : { day, col })}
                      className={cn(
                        'aspect-square rounded-sm',
                        isSelected && 'ring-2 ring-ring ring-offset-1 ring-offset-background',
                      )}
                      style={{ backgroundColor: cellBackground(intensity) }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{cellSummary(day, col, cell)}</TooltipContent>
                </Tooltip>
              )
            })}
          </Fragment>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
        <p className="min-h-4 text-xs">
          {selected ? cellSummary(selected.day, selected.col, grid[selected.day][selected.col]) : ''}
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
