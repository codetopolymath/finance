import { describe, expect, it } from 'vitest'
import { parseReceiptText } from './receipt-parser'

// Fixtures are transcribed OCR text approximating the 12 real PhonePe
// "Transaction Successful" sample receipts used to design this parser (see
// feature/receipt-transaction-capture.md). Line order mirrors the receipt's
// own visual layout, since the parser is label-anchored, not position-based.

describe('parseReceiptText', () => {
  it('parses a basic "Paid to" merchant payment (Swiggy Instamart)', () => {
    const result = parseReceiptText(`
      Transaction Successful
      12 July 2026 at 22:12

      ₹245

      Paid to
      Swiggy Instamart
      swiggyinstamart@icici

      PhonePe Transaction ID
      T2607122212345678901

      Debited from
      XXXXXXXXXX41
      ₹245

      UTR: 123456789012
    `)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.direction).toBe('paid_to')
    expect(result.counterpartyName).toBe('Swiggy Instamart')
    expect(result.counterpartyHandle).toBe('swiggyinstamart@icici')
    expect(result.message).toBeNull()
    expect(result.phonepeTransactionId).toBe('T2607122212345678901')
    expect(result.maskedAccount).toBe('XXXXXXXXXX41')
    expect(result.utr).toBe('123456789012')
    expect(result.amountPrimary).toBe(245)
    expect(result.amountSecondary).toBe(245)
    expect(result.amountsMatch).toBe(true)
    expect(result.dateTimeRaw).toBe('12 July 2026 at 22:12')
  })

  it('parses a "Received from" P2P credit with a verified banking name (Kunal Chakole)', () => {
    const result = parseReceiptText(`
      Transaction Successful
      10 July 2026 at 18:45

      ₹500

      Received from
      Kunal Chakole
      9876543210
      Banking name : KUNAL CHAKOLE ✓

      PhonePe Transaction ID
      T2607101845123456789

      Credited to
      0799XXXXXXXX0642
      ₹500

      UTR: 234567890123
    `)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.direction).toBe('received_from')
    expect(result.counterpartyName).toBe('Kunal Chakole')
    expect(result.counterpartyHandle).toBe('9876543210')
    expect(result.bankingName).toBe('KUNAL CHAKOLE')
    expect(result.maskedAccount).toBe('0799XXXXXXXX0642')
    expect(result.amountsMatch).toBe(true)
  })

  it('parses a "Paid to" P2P transfer via Paytm handle with a custom Message', () => {
    const result = parseReceiptText(`
      Transaction Successful
      9 July 2026 at 20:05

      ₹100

      Paid to
      Ashwin Naresh Meshram
      ashwinmeshram@ptaxis

      Message
      SCREEN GAURD

      PhonePe Transaction ID
      T2607092005111222333

      Debited from
      XXXXXXXXXX41
      ₹100

      UTR: 345678901234
    `)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.counterpartyHandle).toBe('ashwinmeshram@ptaxis')
    expect(result.message).toBe('SCREEN GAURD')
  })

  it('parses a merchant payment with a decimal amount (Burger King)', () => {
    const result = parseReceiptText(`
      Transaction Successful
      8 July 2026 at 13:30

      ₹349.50

      Paid to
      Burger King
      burgerking@ybl

      PhonePe Transaction ID
      T2607081330444555666

      Debited from
      XXXXXXXXXX41
      ₹349.50

      UTR: 456789012345
    `)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.amountPrimary).toBe(349.5)
    expect(result.amountSecondary).toBe(349.5)
    expect(result.amountsMatch).toBe(true)
  })

  it('parses a truncated vendor name with the Message field as a fallback full name (BookMyShow)', () => {
    const result = parseReceiptText(`
      Transaction Successful
      7 July 2026 at 21:00

      ₹720

      Paid to
      BigTree Entertainm…
      bigtree@hdfcbank

      Message
      BIGTREE ENTERTAINMENT PRIVATE LIMITED

      PhonePe Transaction ID
      T2607072100777888999

      Debited from
      XXXXXXXXXX41
      ₹720

      UTR: 567890123456
    `)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.counterpartyName).toBe('BigTree Entertainm…')
    expect(result.message).toBe('BIGTREE ENTERTAINMENT PRIVATE LIMITED')
  })

  it('parses a bill payment with both vendor name and UPI ID truncated', () => {
    const result = parseReceiptText(`
      Transaction Successful
      6 July 2026 at 11:15

      ₹1500

      Paid to
      Maharashtra State El…
      mahadiscom@sbi…

      Message
      billpay

      PhonePe Transaction ID
      T2607061115222333444

      Debited from
      XXXXXXXXXX41
      ₹1500

      UTR: 678901234567
    `)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.counterpartyName).toBe('Maharashtra State El…')
    expect(result.message).toBe('billpay')
  })

  it('parses an AUTOPAY subscription charge with an OLEX-prefixed transaction ID', () => {
    const result = parseReceiptText(`
      Transaction Successful
      5 July 2026 at 03:00

      ₹99

      Paid to
      Apple Media Services
      apple@icici

      Message
      Execution test

      PhonePe Transaction ID
      OLEX2607050300555666

      Debited from
      XXXXXXXXXX41
      ₹99

      UTR: 789012345678
    `)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.phonepeTransactionId).toBe('OLEX2607050300555666')
    expect(result.message).toBe('Execution test')
  })

  it('flags mismatched amount instances instead of silently picking one', () => {
    const result = parseReceiptText(`
      Transaction Successful
      4 July 2026 at 10:00

      ₹245

      Paid to
      Some Vendor
      vendor@ybl

      PhonePe Transaction ID
      T2607041000111111111

      Debited from
      XXXXXXXXXX41
      ₹250

      UTR: 890123456789
    `)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.amountsMatch).toBe(false)
  })

  it('gracefully refuses an unrecognized layout instead of misparsing', () => {
    const result = parseReceiptText(`
      Some Other App
      Payment Confirmation
      ₹50
    `)

    expect(result.ok).toBe(false)
  })
})
