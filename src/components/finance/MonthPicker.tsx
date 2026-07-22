import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, subMonths } from 'date-fns'
import { Button } from '@/components/ui/button'
import { formatMonthLabel } from '@/lib/format'

interface MonthPickerProps {
  month: Date
  onChange: (month: Date) => void
}

export function MonthPicker({ month, onChange }: MonthPickerProps) {
  const now = new Date()
  const isCurrentMonth = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth()

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="size-11"
        onClick={() => onChange(subMonths(month, 1))}
        aria-label="Previous month"
      >
        <ChevronLeft />
      </Button>
      <span className="min-w-32 text-center text-sm font-medium">{formatMonthLabel(month)}</span>
      <Button
        variant="outline"
        size="icon"
        className="size-11"
        onClick={() => onChange(addMonths(month, 1))}
        disabled={isCurrentMonth}
        aria-label="Next month"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
