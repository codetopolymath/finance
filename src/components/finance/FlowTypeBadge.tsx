import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getFlowTypeMeta, type ColorRole } from '@/lib/flowType'
import { cn } from '@/lib/utils'

const ICONS = {
  success: ArrowDownLeft,
  destructive: ArrowUpRight,
  neutral: ArrowRightLeft,
} satisfies Record<ColorRole, typeof ArrowDownLeft>

const COLOR_CLASSES: Record<ColorRole, string> = {
  success: 'border-transparent bg-success/15 text-success',
  destructive: 'border-transparent bg-destructive/15 text-destructive',
  neutral: 'border-transparent bg-muted text-muted-foreground',
}

export function FlowTypeBadge({ flowType, className }: { flowType: string; className?: string }) {
  const meta = getFlowTypeMeta(flowType)
  const Icon = ICONS[meta.colorRole]
  return (
    <Badge variant="outline" className={cn('gap-1 font-normal', COLOR_CLASSES[meta.colorRole], className)}>
      <Icon className="size-3" />
      {meta.label}
    </Badge>
  )
}
