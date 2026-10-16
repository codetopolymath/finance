import { Fragment, useMemo, useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import { formatHour } from '@/lib/pauseFormat'
import { cn } from '@/lib/utils'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Sequential ramp of the single --pause hue, surface up to full strength. */
function cellBackground(intensity: number): string {
  if (intensity === 0) return 'var(--muted)'
  const strength = 12 + intensity * 88
  return `color-mix(in oklch, var(--pause) ${strength}%, var(--muted))`
}

/** `counts` is indexed day * 24 + hour, Sunday first. */
export function PauseRhythmHeatmap({ counts }: { counts: number[] }) {
  // 24 columns are ~10px cells at phone width, too small to tap
  const isMobile = useIsMobile()
  const hoursPerCol = isMobile ? 2 : 1
  const cols = 24 / hoursPerCol
  const hourTicks = isMobile ? [0, 6, 12, 18] : [0, 3, 6, 9, 12, 15, 18, 21]

  const grid = useMemo(
    () =>
      DAY_LABELS.map((_, day) =>
        Array.from({ length: cols }, (_, col) => {
          let total = 0
          for (let h = col * hoursPerCol; h < (col + 1) * hoursPerCol; h++) total += counts[day * 24 + h] ?? 0
          return total
        }),
      ),
    [counts, cols, hoursPerCol],
  )

  const max = Math.max(0, ...grid.flat())
  // No hover on touch, so a tapped cell pins its summary below the grid
  const [selected, setSelected] = useState<{ day: number; col: number } | null>(null)

  const cellSummary = (day: number, col: number, count: number): string => {
    const startHour = col * hoursPerCol
    const window = `${DAY_LABELS[day]} ${formatHour(startHour)}–${formatHour((startHour + hoursPerCol) % 24)}`
    return count === 0 ? `${window} · None logged` : `${window} · ${count} logged`
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid min-w-full gap-0.5"
        style={{ gridTemplateColumns: `2.5rem repeat(${cols}, 1fr)` }}
      >
        <div />
        {Array.from({ length: cols }, (_, col) => (
          <div key={col} className="text-center text-2xs text-muted-foreground">
            {hourTicks.includes(col * hoursPerCol) ? formatHour(col * hoursPerCol) : ''}
          </div>
        ))}

        {DAY_LABELS.map((label, day) => (
          <Fragment key={day}>
            <div className="flex items-center text-xs text-muted-foreground">{label}</div>
            {grid[day].map((count, col) => {
              const isSelected = selected?.day === day && selected?.col === col
              return (
                <Tooltip key={col}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={cellSummary(day, col, count)}
                      onClick={() => setSelected(isSelected ? null : { day, col })}
                      className={cn(
                        'aspect-square rounded-sm',
                        isSelected && 'ring-2 ring-ring ring-offset-1 ring-offset-background',
                      )}
                      style={{ backgroundColor: cellBackground(max === 0 ? 0 : count / max) }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{cellSummary(day, col, count)}</TooltipContent>
                </Tooltip>
              )
            })}
          </Fragment>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-2xs text-muted-foreground">
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
