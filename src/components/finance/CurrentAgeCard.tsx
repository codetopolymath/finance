import { useMemo } from 'react'
import { Cake } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCountUp } from '@/hooks/use-count-up'
import { PROFILE } from '@/lib/constants'
import { parseDob, calculateAge, daysUntilNextBirthday } from '@/lib/age'

export function CurrentAgeCard() {
  const { years, months, days, nextBirthdayIn } = useMemo(() => {
    const dob = parseDob(PROFILE.user.dob)
    const now = new Date()
    return { ...calculateAge(dob, now), nextBirthdayIn: daysUntilNextBirthday(dob, now) }
  }, [])

  const animatedYears = Math.round(useCountUp(years))

  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-normal text-muted-foreground">Current age</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 px-4">
        <p className="text-2xl font-medium text-foreground">
          {animatedYears}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            yrs, {months} mo, {days} d
          </span>
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Cake className="size-3.5" />
          {nextBirthdayIn === 0 ? 'Birthday is today' : `Next birthday in ${nextBirthdayIn} days`}
        </p>
      </CardContent>
    </Card>
  )
}
