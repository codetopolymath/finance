import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateScopedTransactionPicker } from '@/components/finance/DateScopedTransactionPicker'
import { useTransactionFilterOptions } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import type { ParsedReceipt } from '@/types/receipt'
import type { Transaction } from '@/types/transaction'

const FLOW_TYPE_OPTIONS = ['spend', 'income', 'refund', 'p2p_out', 'p2p_in', 'debt_repayment']

interface ReceiptConfirmFormProps {
  parsed: ParsedReceipt
  imagePreviewUrl: string
  onSaved: () => void
  onCancel: () => void
}

/** Parses the receipt's local (Asia/Kolkata) date/time text into a UTC ISO
 * string for txn_at — best-effort; falls back to "now" if unparseable, since
 * the field stays editable and the confirm form isn't meant to hard-block. */
function toIsoOrNow(dateTimeRaw: string | null): string {
  if (!dateTimeRaw) return new Date().toISOString()
  const match = /(\d{1,2})\s+(\w+)\s+(\d{4}) at (\d{1,2}):(\d{2})/.exec(dateTimeRaw)
  if (!match) return new Date().toISOString()
  const [, day, monthName, year, hour, minute] = match
  const monthIndex = new Date(`${monthName} 1, 2000`).getMonth()
  if (Number.isNaN(monthIndex)) return new Date().toISOString()
  // Interpret as IST (UTC+5:30), then convert to UTC.
  const utcMs =
    Date.UTC(Number(year), monthIndex, Number(day), Number(hour), Number(minute)) - 5.5 * 60 * 60 * 1000
  return new Date(utcMs).toISOString()
}

export function ReceiptConfirmForm({ parsed, imagePreviewUrl, onSaved, onCancel }: ReceiptConfirmFormProps) {
  const { data: filterOptions } = useTransactionFilterOptions()

  const [category, setCategory] = useState('')
  const [flowType, setFlowType] = useState(parsed.direction === 'paid_to' ? 'spend' : 'p2p_in')
  const [account, setAccount] = useState('')
  const [amount, setAmount] = useState(String(parsed.amountPrimary ?? parsed.amountSecondary ?? ''))
  const [vendor, setVendor] = useState(parsed.counterpartyName)
  const [utr, setUtr] = useState(parsed.utr ?? '')
  const [note, setNote] = useState(parsed.message ?? '')
  const [pickerDate, setPickerDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [manualMatch, setManualMatch] = useState<Transaction | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const txnAtIso = useMemo(() => toIsoOrNow(parsed.dateTimeRaw), [parsed.dateTimeRaw])

  const canSave = category !== '' && flowType !== '' && account !== '' && amount !== ''

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Not signed in')

      const { data, error } = await supabase.functions.invoke('commit-transaction', {
        body: {
          matchedId: manualMatch?.id,
          txn_at: txnAtIso,
          flow_type: flowType,
          amount: Number(amount),
          account,
          category,
          utr: utr.trim() || null,
          vendor: vendor.trim() || null,
          note: note.trim() || null,
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      onSaved()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Couldn't save transaction")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <img src={imagePreviewUrl} alt="Receipt" className="max-h-48 w-full rounded-lg object-contain" />

      {!parsed.amountsMatch && (
        <p className="flex items-center gap-2 text-sm text-amber-600">
          <AlertTriangle className="size-4 shrink-0" />
          The two amounts on the receipt didn't match — double-check before saving.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted-foreground">Amount</label>
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          enterKeyHint="next"
          className="h-11"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted-foreground">Vendor / counterparty</label>
        <Input
          value={vendor}
          onChange={(e) => setVendor(e.target.value)}
          enterKeyHint="next"
          className="h-11"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted-foreground">Category</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions?.categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted-foreground">Type</label>
        <Select value={flowType} onValueChange={setFlowType}>
          <SelectTrigger className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FLOW_TYPE_OPTIONS.map((ft) => (
              <SelectItem key={ft} value={ft}>
                {ft.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted-foreground">Account</label>
        <Select value={account} onValueChange={setAccount}>
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="Choose an account" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions?.accounts.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted-foreground">UTR</label>
        <Input
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          enterKeyHint="done"
          className="h-11 font-mono text-xs"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted-foreground">Note</label>
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} enterKeyHint="done" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted-foreground">
          Match to an existing transaction (optional — overrides UTR matching)
        </label>
        <DateScopedTransactionPicker
          date={pickerDate}
          onDateChange={setPickerDate}
          selected={manualMatch}
          onSelect={setManualMatch}
        />
      </div>

      {saveError && <p className="text-sm text-destructive">{saveError}</p>}

      <div className="flex flex-col gap-2">
        <Button className="h-11" onClick={save} disabled={!canSave || saving}>
          {saving ? <Loader2 className="animate-spin" /> : null}
          {saving ? 'Saving…' : manualMatch ? 'Update matched transaction' : 'Save transaction'}
        </Button>
        <Button variant="outline" className="h-11" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
