import { formatCurrency } from '@/lib/format'
import { getFlowTypeMeta, type ColorRole } from '@/lib/flowType'
import { cn } from '@/lib/utils'

const COLOR_CLASSES: Record<ColorRole, string> = {
  success: 'text-success',
  destructive: 'text-destructive',
  neutral: 'text-foreground',
}

export function Amount({
  amount,
  flowType,
  className,
}: {
  amount: number
  flowType: string
  className?: string
}) {
  const meta = getFlowTypeMeta(flowType)
  const prefix = meta.sign === 1 ? '+' : meta.sign === -1 ? '−' : ''
  return (
    <span className={cn('font-medium tabular-nums', COLOR_CLASSES[meta.colorRole], className)}>
      {prefix}
      {formatCurrency(amount)}
    </span>
  )
}
