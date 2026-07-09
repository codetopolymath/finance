import { format, isToday, isYesterday } from 'date-fns'

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}

export function formatDayHeading(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEE, d MMM yyyy')
}

export function formatDateTime(date: Date): string {
  return format(date, 'd MMM yyyy, h:mm a')
}

export function formatTime(date: Date): string {
  return format(date, 'h:mm a')
}

export function formatMonthLabel(date: Date): string {
  return format(date, 'MMMM yyyy')
}

export function formatShortDate(date: Date): string {
  return format(date, 'd MMM yyyy')
}

export function formatFullDate(date: Date): string {
  return format(date, 'EEEE, d MMMM yyyy')
}

/** Parses a "yyyy-MM-dd" date-only string as local calendar components.
 * `new Date(string)` treats date-only strings as UTC midnight per spec,
 * which silently rolls back a day in timezones ahead of UTC (e.g. IST). */
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}
