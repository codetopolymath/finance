import { addYears, addMonths, differenceInYears, differenceInMonths, differenceInCalendarDays } from 'date-fns'

export interface AgeBreakdown {
  years: number
  months: number
  days: number
}

/** Parses a "DDMMYYYY" date-of-birth string as local calendar components. */
export function parseDob(dob: string): Date {
  const day = Number(dob.slice(0, 2))
  const month = Number(dob.slice(2, 4))
  const year = Number(dob.slice(4, 8))
  return new Date(year, month - 1, day)
}

/** Effective age as of `now`, accurate to the day. */
export function calculateAge(dob: Date, now: Date): AgeBreakdown {
  const years = differenceInYears(now, dob)
  const afterYears = addYears(dob, years)
  const months = differenceInMonths(now, afterYears)
  const afterMonths = addMonths(afterYears, months)
  const days = differenceInCalendarDays(now, afterMonths)
  return { years, months, days }
}

/** Calendar days remaining until the next birthday (0 if today is the birthday). */
export function daysUntilNextBirthday(dob: Date, now: Date): number {
  const thisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate())
  const diff = differenceInCalendarDays(thisYear, now)
  const next = diff < 0 ? addYears(thisYear, 1) : thisYear
  return differenceInCalendarDays(next, now)
}
