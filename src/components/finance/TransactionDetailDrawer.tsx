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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Amount } from '@/components/finance/Amount'
import { FlowTypeBadge } from '@/components/finance/FlowTypeBadge'
import { useIsMobile } from '@/hooks/use-mobile'
import { useTransactionFilterOptions, useUpdateTransaction } from '@/lib/queries'
import { formatDateTime } from '@/lib/format'
import type { Transaction } from '@/types/transaction'

interface TransactionDetailDrawerProps {
  transaction: Transaction | null
  onOpenChange: (open: boolean) => void
  onUpdated?: (transaction: Transaction) => void
}

export function TransactionDetailDrawer({
  transaction,
  onOpenChange,
  onUpdated,
}: TransactionDetailDrawerProps) {
  const isMobile = useIsMobile()

  return (
    <Drawer
      open={transaction !== null}
      onOpenChange={onOpenChange}
      direction={isMobile ? 'bottom' : 'right'}
    >
      {/* vaul's own keyboard-avoidance logic (see node_modules/vaul) checks
       * `drawerHeight > totalHeight * 0.8` to decide how aggressively to
       * shrink the drawer when the iOS keyboard opens — a drawer at/above
       * that 80% threshold makes it subtract the drawer's current *distance
       * from the top of the screen* (much larger) instead of a small fixed
       * 26px offset, over-shrinking the drawer's visible height while the
       * keyboard is up (reported: note text effectively invisible/squeezed
       * to a sliver when editing). Staying safely under 80% keeps vaul on
       * the gentler shrink path. */}
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[75dvh]">
        {transaction && (
          <DrawerBody
            key={transaction.id}
            transaction={transaction}
            onUpdated={onUpdated}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}

function DrawerBody({
  transaction,
  onUpdated,
}: {
  transaction: Transaction
  onUpdated?: (transaction: Transaction) => void
}) {
  const [editing, setEditing] = useState(false)

  return (
    <>
      <DrawerHeader>
        <DrawerDescription>{formatDateTime(new Date(transaction.txn_at))}</DrawerDescription>
        <DrawerTitle>
          <Amount amount={transaction.amount} flowType={transaction.flow_type} className="text-display" />
        </DrawerTitle>
      </DrawerHeader>
      {editing ? (
        <TransactionEditForm
          transaction={transaction}
          onDone={(updated) => {
            if (updated) onUpdated?.(updated)
            setEditing(false)
          }}
        />
      ) : (
        <>
          <div className="flex min-h-0 flex-1 transform-gpu flex-col gap-4 overflow-y-auto px-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <FlowTypeBadge flowType={transaction.flow_type} />
              <Badge variant="secondary">{transaction.category}</Badge>
            </div>
            <Separator />
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
              {transaction.vendor && (
                <>
                  <dt className="text-muted-foreground">Vendor</dt>
                  <dd className="text-right">{transaction.vendor}</dd>
                </>
              )}
              <dt className="text-muted-foreground">Account</dt>
              <dd className="text-right">{transaction.account}</dd>
              {transaction.utr && (
                <>
                  <dt className="text-muted-foreground">UTR</dt>
                  <dd className="break-all text-right font-mono text-2xs">{transaction.utr}</dd>
                </>
              )}
            </dl>
            {transaction.note && (
              <>
                <Separator />
                <div>
                  <p className="mb-1 text-muted-foreground">Note</p>
                  <p className="whitespace-pre-wrap">{transaction.note}</p>
                </div>
              </>
            )}
          </div>
          <DrawerFooter className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button className="h-11" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="h-11">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </>
      )}
    </>
  )
}

function TransactionEditForm({
  transaction,
  onDone,
}: {
  transaction: Transaction
  onDone: (updated: Transaction | null) => void
}) {
  const [category, setCategory] = useState(transaction.category)
  const [note, setNote] = useState(transaction.note ?? '')
  const { data: filterOptions } = useTransactionFilterOptions()
  const update = useUpdateTransaction()

  // The picker offers existing categories only; make sure the current value is
  // always present even if the options query hasn't landed yet.
  const categories = filterOptions?.categories.includes(transaction.category)
    ? filterOptions.categories
    : [transaction.category, ...(filterOptions?.categories ?? [])]

  const save = () => {
    const trimmedNote = note.trim() || null
    update.mutate(
      { id: transaction.id, category, note: trimmedNote },
      { onSuccess: () => onDone({ ...transaction, category, note: trimmedNote }) },
    )
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 transform-gpu flex-col gap-4 overflow-y-auto px-4 text-sm">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-category" className="text-muted-foreground">
            Category
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="edit-category" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-note" className="text-muted-foreground">
            Note
          </label>
          <Textarea
            id="edit-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onFocus={(e) => {
              const target = e.currentTarget
              // Safety net alongside vaul's own keyboard-avoidance: give the
              // keyboard-open animation a moment, then make sure the field
              // that's actually focused is the one scrolled into view.
              setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)
            }}
            placeholder="Add a note"
            enterKeyHint="done"
          />
        </div>
        {update.isError && (
          <p className="text-destructive">
            {update.error instanceof Error ? update.error.message : "Couldn't save changes"}
          </p>
        )}
      </div>
      <DrawerFooter className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button className="h-11" onClick={save} disabled={update.isPending || !category}>
          {update.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="outline" className="h-11" onClick={() => onDone(null)} disabled={update.isPending}>
          Cancel
        </Button>
      </DrawerFooter>
    </>
  )
}
