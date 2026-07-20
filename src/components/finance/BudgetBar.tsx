import { cn } from '@/lib/utils'
import type { BudgetBurn } from '@/lib/focusSelectors'

function formatMinutes(ms: number): string {
  return `${Math.round(ms / 60_000)}m`
}

/** The one new visual element this feature introduces (spec §7) — a simple
 * single-hue burn-down meter (accent fill, muted track — one step lighter of
 * the same neutral family, per this app's minimalist chart restraint).
 * Deliberately skips the usual accent→warning→danger severity ramp for the
 * over-budget state: this app's no-guilt principle treats "over" as a
 * neutral fact, not a status to alarm on, so it gets a desaturated fill and
 * a plain-text label instead of a warning hue. */
export function BudgetBar({ burn, className }: { burn: BudgetBurn; className?: string }) {
  const pct = Math.min(100, (burn.spentMs / burn.budgetMs) * 100)
  const over = burn.overMs > 0

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500 ease-out',
            over ? 'bg-foreground/35' : 'bg-primary',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs tabular-nums text-muted-foreground">
        {over
          ? `${formatMinutes(burn.overMs)} over budget`
          : `${formatMinutes(burn.spentMs)} / ${formatMinutes(burn.budgetMs)}`}
      </p>
    </div>
  )
}
