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
import { Amount } from '@/components/finance/Amount'
import { FlowTypeBadge } from '@/components/finance/FlowTypeBadge'
import { formatDateTime } from '@/lib/format'
import type { Transaction } from '@/types/transaction'

interface TransactionDetailDrawerProps {
  transaction: Transaction | null
  onOpenChange: (open: boolean) => void
}

export function TransactionDetailDrawer({ transaction, onOpenChange }: TransactionDetailDrawerProps) {
  return (
    <Drawer open={transaction !== null} onOpenChange={onOpenChange} direction="right">
      <DrawerContent>
        {transaction && (
          <>
            <DrawerHeader>
              <DrawerDescription>{formatDateTime(new Date(transaction.txn_at))}</DrawerDescription>
              <DrawerTitle>
                <Amount amount={transaction.amount} flowType={transaction.flow_type} className="text-2xl" />
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
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
                    <dd className="break-all text-right font-mono text-xs">{transaction.utr}</dd>
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
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
