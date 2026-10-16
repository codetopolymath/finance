import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCountUp } from '@/hooks/use-count-up'

interface PauseHeroCardProps {
  title: string
  count: number
  average: number | null
  lastLoggedLabel: string | null
}

/** Describes a day's count against the recent average, never judges it. */
export function PauseHeroCard({ title, count, average, lastLoggedLabel }: PauseHeroCardProps) {
  const animated = useCountUp(count)

  return (
    <Card className="gap-2 rounded-2xl py-6 shadow-hero">
      <CardHeader className="px-6">
        <CardTitle className="text-sm font-normal text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 px-6">
        <p className="text-hero font-semibold tracking-tight text-pause tabular-nums">
          {Math.round(animated)}
        </p>
        <p className="text-sm text-muted-foreground">
          {average === null ? 'Not enough days yet for an average' : `Recent daily average ${average.toFixed(1)}`}
          {lastLoggedLabel && ` · last one ${lastLoggedLabel}`}
        </p>
      </CardContent>
    </Card>
  )
}
