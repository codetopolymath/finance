export interface Transaction {
  id: number
  txn_at: string
  flow_type: string
  amount: number
  account: string
  category: string
  utr: string | null
  vendor: string | null
  note: string | null
}
