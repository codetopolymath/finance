import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCountUp } from '@/hooks/use-count-up'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: number
  tone?: 'default' | 'success' | 'destructive'
}

const TONE_CLASSES: Record<NonNullable<MetricCardProps['tone']>, string> = {
  default: 'text-foreground',
  success: 'text-success',
  destructive: 'text-destructive',
}

export function MetricCard({ label, value, tone = 'default' }: MetricCardProps) {
  const animated = useCountUp(value)

  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <p className={cn('text-2xl font-medium tabular-nums', TONE_CLASSES[tone])}>
          {formatCurrency(animated)}
        </p>
      </CardContent>
    </Card>
  )
}
