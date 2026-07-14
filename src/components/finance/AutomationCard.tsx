import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AutomationCardProps {
  icon: LucideIcon
  title: string
  description: string
  children?: React.ReactNode
  className?: string
}

export function AutomationCard({ icon: Icon, title, description, children, className }: AutomationCardProps) {
  return (
    <Card className={cn('gap-4', className)}>
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      {children && <CardContent className="flex flex-col gap-2">{children}</CardContent>}
    </Card>
  )
}
