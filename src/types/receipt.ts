export type ReceiptDirection = 'paid_to' | 'received_from'

export interface ParsedReceipt {
  direction: ReceiptDirection
  /** May be truncated by PhonePe's own UI ("…") — not recoverable from the image. */
  counterpartyName: string
  /** UPI ID for `paid_to`, phone number for `received_from`. May be truncated. */
  counterpartyHandle: string | null
  /** Present only for `received_from` when PhonePe shows a verified bank name. */
  bankingName: string | null
  /** Free-text "Message" line, when present. Never trust as structured data —
   * only ever offered as a note pre-fill or truncated-vendor fallback. */
  message: string | null
  /** Both amount instances read off the receipt (top block + debited/credited
   * block) — kept separate so the confirm form can warn if they disagree. */
  amountPrimary: number | null
  amountSecondary: number | null
  /** Local (Asia/Kolkata) date+time as read from the header, unconverted. */
  dateTimeRaw: string | null
  phonepeTransactionId: string | null
  /** Raw masked account string exactly as shown — never normalized. */
  maskedAccount: string | null
  utr: string | null
  /** True when both amount instances were readable and agree exactly. */
  amountsMatch: boolean
}

export interface ParseFailure {
  ok: false
  reason: string
}

export type ParseResult = ({ ok: true } & ParsedReceipt) | ParseFailure
