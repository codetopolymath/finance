import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, LogOut, PlayCircle, Receipt, Sparkles, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { AutomationCard } from '@/components/finance/AutomationCard'
import { useAuth } from '@/lib/auth-context'
import { useTransactions } from '@/lib/queries'
import { useTriggerSpendcheck } from '@/lib/spendcheck'
import { useTriggerDayCleanup, yesterdayInIst } from '@/lib/day-cleanup'

function SpendcheckCard() {
  const spendcheck = useTriggerSpendcheck()

  const handleRun = () => {
    spendcheck.mutate(undefined, {
      onSuccess: () => toast.success('Started — check Claude for results'),
      onError: (error) => toast.error(error instanceof Error ? error.message : "Couldn't start the Spendcheck scan"),
    })
  }

  return (
    <AutomationCard icon={PlayCircle} title="Run Spendcheck Now" description="Manually kick off the daily inbox scan instead of waiting for the scheduled run.">
      <Button onClick={handleRun} disabled={spendcheck.isPending} className="w-fit">
        {spendcheck.isPending ? <Loader2 className="animate-spin" /> : <PlayCircle />}
        {spendcheck.isPending ? 'Starting…' : 'Run now'}
      </Button>
    </AutomationCard>
  )
}

function DayCleanupCard() {
  const [date, setDate] = useState(yesterdayInIst)
  const dateInputRef = useRef<HTMLInputElement | null>(null)
  const cleanup = useTriggerDayCleanup()

  const handleRun = () => {
    // Read the input's live DOM value rather than trusting React state here —
    // iOS Safari's native date-wheel picker doesn't reliably fire `onChange`
    // before a fast subsequent tap on Run registers, which let a stale
    // `date` slip through and silently run against yesterday instead of the
    // picked date. Reading the DOM directly at click-time can't go stale.
    const selectedDate = dateInputRef.current?.value || date
    cleanup.mutate(selectedDate, {
      onSuccess: () => toast.success(`Started for ${selectedDate} — check Claude for results`),
      onError: (error) => toast.error(error instanceof Error ? error.message : "Couldn't start cleanup for that day"),
    })
  }

  return (
    <AutomationCard
      icon={Sparkles}
      title="Day Transaction Cleanup"
      description="Re-check grammar and category for every transaction on a given day."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Input
          ref={dateInputRef}
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="h-9 w-40"
        />
        <Button onClick={handleRun} disabled={cleanup.isPending} className="w-fit">
          {cleanup.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {cleanup.isPending ? 'Starting…' : "Fix day's entries"}
        </Button>
      </div>
    </AutomationCard>
  )
}

function ReceiptCaptureCard() {
  return (
    <AutomationCard
      icon={Receipt}
      title="Add Transaction from Receipt"
      description="Upload a PhonePe share receipt to add or correct a transaction."
    >
      <Button asChild className="w-fit">
        <Link to="/automations/receipt">
          <Receipt />
          Upload receipt
        </Link>
      </Button>
    </AutomationCard>
  )
}

function AccountSection() {
  const { session, signOut } = useAuth()
  const { dataUpdatedAt } = useTransactions()

  return (
    <div className="flex flex-col gap-2 rounded-xl border p-4">
      <h2 className="text-sm font-medium">Account</h2>
      {session?.user.email && <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>}
      {dataUpdatedAt > 0 && (
        <p className="truncate text-xs text-muted-foreground">
          Synced {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}
        </p>
      )}
      <Separator className="my-1" />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild className="w-fit">
          <Link to="/profile">
            <User />
            View profile
          </Link>
        </Button>
        <Button variant="outline" onClick={signOut} className="w-fit">
          <LogOut />
          Sign out
        </Button>
      </div>
    </div>
  )
}

export default function Automations() {
  return (
    <div className="flex flex-col gap-4">
      <SpendcheckCard />
      <DayCleanupCard />
      <ReceiptCaptureCard />
      <AccountSection />
    </div>
  )
}
