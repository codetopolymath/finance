import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="size-16 rounded-full bg-primary/10 text-primary [&_svg:not([class*='size-'])]:size-7"
        >
          <Icon strokeWidth={1.5} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && (
        <EmptyContent>
          <Button variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}
