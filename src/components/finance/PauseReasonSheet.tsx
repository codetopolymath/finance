import { useState } from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import type { PauseReason } from '@/types/focus'

const REASONS: { value: PauseReason; label: string }[] = [
  { value: 'blocked', label: 'Blocked / dependency' },
  { value: 'urgent', label: 'Urgent interruption' },
  { value: 'other', label: 'Other' },
]

interface PauseReasonSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: PauseReason, note?: string) => void
  isSubmitting?: boolean
}

/** Low-friction pause: a quick choice plus an optional note, never a
 * mandatory typed explanation — pausing is never refused, per spec §5.2. */
export function PauseReasonSheet({ open, onOpenChange, onConfirm, isSubmitting }: PauseReasonSheetProps) {
  const isMobile = useIsMobile()
  const [reason, setReason] = useState<PauseReason>('blocked')
  const [note, setNote] = useState('')

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setReason('blocked')
          setNote('')
        }
      }}
      direction={isMobile ? 'bottom' : 'right'}
    >
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[75dvh]">
        <DrawerHeader>
          <DrawerTitle>Pause this session</DrawerTitle>
          <DrawerDescription>Quick reason — no explanation needed.</DrawerDescription>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 transform-gpu flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="flex flex-col gap-2">
            {REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setReason(r.value)}
                className={cn(
                  'rounded-md border px-3 py-2.5 text-left transition-[color,background-color,transform] active:scale-[0.98] motion-reduce:active:scale-100',
                  reason === r.value ? 'border-primary bg-primary/10' : 'border-border',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onFocus={(e) => {
              const target = e.currentTarget
              setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
            }}
            placeholder="Optional note"
          />
        </div>
        <DrawerFooter className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button
            className="h-11"
            onClick={() => onConfirm(reason, note)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Pausing…' : 'Pause'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="h-11">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
