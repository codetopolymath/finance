import { useState } from 'react'
import { addDays, isToday, subDays } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDayHeading } from '@/lib/format'

interface PauseDayPickerProps {
  day: Date
  onChange: (day: Date) => void
}

/** Step day by day, or jump anywhere via the calendar. Future days are blocked. */
export function PauseDayPicker({ day, onChange }: PauseDayPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="size-11"
        onClick={() => onChange(subDays(day, 1))}
        aria-label="Previous day"
      >
        <ChevronLeft />
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-11 min-w-40 justify-center">
            <CalendarIcon />
            {formatDayHeading(day)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={day}
            defaultMonth={day}
            disabled={{ after: new Date() }}
            onSelect={(picked) => {
              if (!picked) return
              onChange(picked)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      <Button
        variant="outline"
        size="icon"
        className="size-11"
        onClick={() => onChange(addDays(day, 1))}
        disabled={isToday(day)}
        aria-label="Next day"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
