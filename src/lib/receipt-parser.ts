// Deterministic, label-anchored parser for PhonePe's "Transaction Successful"
// share-receipt layout. No LLM involvement by design (see
// feature/receipt-transaction-capture.md's decision log) — the layout is
// fixed/template-stable, so a human reviewing the parsed result before saving
// is more reliable than a model guessing at exact digits.
//
// Zero non-stdlib imports: this file must run identically in the browser
// (in-app OCR upload) and in a Deno edge function (future iOS Shortcut path).
import type { ParseResult, ReceiptDirection } from '@/types/receipt'

function normalizeLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

const AMOUNT_RE = /₹\s*([\d,]+(?:\.\d{1,2})?)/g

function parseAmount(text: string): number | null {
  const match = /([\d,]+(?:\.\d{1,2})?)/.exec(text)
  if (!match) return null
  const value = Number(match[1].replace(/,/g, ''))
  return Number.isFinite(value) ? value : null
}

function allAmounts(lines: string[]): number[] {
  const amounts: number[] = []
  for (const line of lines) {
    for (const match of line.matchAll(AMOUNT_RE)) {
      const value = parseAmount(match[1])
      if (value !== null) amounts.push(value)
    }
  }
  return amounts
}

const DATE_TIME_RE = /(\d{1,2}\s+\w+\s+\d{4})\s+at\s+(\d{1,2}:\d{2}\s*(?:am|pm)?)/i

function findDateTime(lines: string[]): string | null {
  for (const line of lines) {
    const match = DATE_TIME_RE.exec(line)
    if (match) return `${match[1]} at ${match[2]}`
  }
  return null
}

const UPI_ID_RE = /^[\w.-]+@[\w.-]+$/
const PHONE_RE = /^\+?\d[\d\s-]{8,14}\d$/

/** Finds a label line (optionally "Label: value" inline) and returns the
 * value — either the inline capture or the next non-blank line. Labels are
 * matched loosely (case-insensitive, optional trailing colon) since OCR
 * engines are inconsistent about punctuation/casing. */
function findLabelValue(lines: string[], labelRe: RegExp): string | null {
  for (let i = 0; i < lines.length; i++) {
    const match = labelRe.exec(lines[i])
    if (!match) continue
    const inline = lines[i].slice(match[0].length).replace(/^[:\s]+/, '').trim()
    if (inline) return inline
    if (lines[i + 1]) return lines[i + 1]
    return null
  }
  return null
}

const DIRECTION_RE = /^(paid to|received from)\b/i

export function parseReceiptText(raw: string): ParseResult {
  const lines = normalizeLines(raw)

  let direction: ReceiptDirection | null = null
  let directionIndex = -1
  for (let i = 0; i < lines.length; i++) {
    const match = DIRECTION_RE.exec(lines[i])
    if (match) {
      direction = match[1].toLowerCase() === 'paid to' ? 'paid_to' : 'received_from'
      directionIndex = i
      break
    }
  }

  if (!direction) {
    return { ok: false, reason: "Couldn't recognize this receipt layout — no 'Paid to' or 'Received from' label found." }
  }

  const counterpartyName = lines[directionIndex + 1] ?? null
  if (!counterpartyName) {
    return { ok: false, reason: 'Direction label found but no counterparty name followed it.' }
  }

  let counterpartyHandle: string | null = null
  let bankingName: string | null = null
  const afterName = lines[directionIndex + 2]
  if (afterName && (UPI_ID_RE.test(afterName) || PHONE_RE.test(afterName))) {
    counterpartyHandle = afterName
  }

  if (direction === 'received_from') {
    const bankingLine = lines.find((line) => /^banking name\s*:/i.test(line))
    if (bankingLine) {
      bankingName = bankingLine.replace(/^banking name\s*:/i, '').replace(/✓/g, '').trim()
    }
  }

  const message = findLabelValue(lines, /^message\s*:?/i)

  const phonepeTransactionId = findLabelValue(lines, /^phonepe transaction id\s*:?/i)

  const debitedOrCreditedLabelRe = /^(debited from|credited to)\s*:?/i
  const maskedAccount = findLabelValue(lines, debitedOrCreditedLabelRe)

  const utrRaw = findLabelValue(lines, /^utr\s*:?/i)
  const utr = utrRaw ? (utrRaw.match(/\d+/)?.[0] ?? null) : null

  const amounts = allAmounts(lines)
  const amountPrimary = amounts[0] ?? null
  const amountSecondary = amounts[1] ?? null
  const amountsMatch =
    amountPrimary !== null && amountSecondary !== null && amountPrimary === amountSecondary

  const dateTimeRaw = findDateTime(lines)

  return {
    ok: true,
    direction,
    counterpartyName,
    counterpartyHandle,
    bankingName,
    message,
    amountPrimary,
    amountSecondary,
    dateTimeRaw,
    phonepeTransactionId,
    maskedAccount,
    utr,
    amountsMatch,
  }
}
