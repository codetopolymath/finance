import { useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCountUp } from '@/hooks/use-count-up'
import { gsap, useGSAP } from '@/lib/gsap'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

/** The dashboard's thesis: the one number a daily check-in actually needs,
 * given real visual weight instead of competing equally with income/spent. */
export function NetHeroCard({ net }: { net: number }) {
  const ref = useRef<HTMLParagraphElement | null>(null)
  const animated = useCountUp(net)
  const positive = net >= 0

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(ref.current, { autoAlpha: 0, y: 10, duration: 0.5, ease: 'power2.out' })
      })
      return () => mm.revert()
    },
    { scope: ref, dependencies: [] },
  )

  return (
    <Card
      className={cn(
        'gap-2 rounded-2xl py-6 shadow-hero',
        positive ? 'border-primary/30' : 'border-destructive/30',
      )}
    >
      <CardHeader className="px-6">
        <CardTitle className="text-sm font-normal text-muted-foreground">Net this month</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        <p
          ref={ref}
          className={cn(
            'text-hero font-semibold tracking-tight tabular-nums',
            positive ? 'text-success' : 'text-destructive',
          )}
        >
          {formatCurrency(animated)}
        </p>
      </CardContent>
    </Card>
  )
}
