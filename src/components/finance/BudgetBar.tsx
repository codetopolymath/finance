import { cn } from '@/lib/utils'
import type { BudgetBurn } from '@/lib/focusSelectors'

function formatMinutes(ms: number): string {
  return `${Math.round(ms / 60_000)}m`
}

/** The one new visual element this feature introduces (spec §7) — a simple
 * depleting bar. Over-budget is reflected as a distinct but neutral state,
 * never red/alarm styling, per the no-guilt design principle. */
export function BudgetBar({ burn, className }: { burn: BudgetBurn; className?: string }) {
  const pct = Math.min(100, (burn.spentMs / burn.budgetMs) * 100)
  const over = burn.overMs > 0

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-[width]', over ? 'bg-foreground/40' : 'bg-primary')}
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
