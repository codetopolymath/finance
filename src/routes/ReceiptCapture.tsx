import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ReceiptUpload } from '@/components/finance/ReceiptUpload'
import { ReceiptConfirmForm } from '@/components/finance/ReceiptConfirmForm'
import { parseReceiptText } from '@/lib/receipt-parser'
import type { ParsedReceipt } from '@/types/receipt'

type Step =
  | { stage: 'upload' }
  | { stage: 'unrecognized'; reason: string }
  | { stage: 'confirm'; parsed: ParsedReceipt; imagePreviewUrl: string }

export default function ReceiptCapture() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>({ stage: 'upload' })

  const handleExtracted = (rawText: string, imagePreviewUrl: string) => {
    const result = parseReceiptText(rawText)
    if (!result.ok) {
      setStep({ stage: 'unrecognized', reason: result.reason })
      return
    }
    setStep({ stage: 'confirm', parsed: result, imagePreviewUrl })
  }

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    toast.success('Transaction saved')
    navigate('/automations')
  }

  return (
    <div className="flex flex-col gap-4">
      {step.stage === 'upload' && <ReceiptUpload onExtracted={handleExtracted} />}

      {step.stage === 'unrecognized' && (
        <div className="flex flex-col gap-3 rounded-lg border p-6 text-center">
          <p className="text-sm text-muted-foreground">{step.reason}</p>
          <p className="text-xs text-muted-foreground">
            Only PhonePe's "Paid to" / "Received from" share receipts are supported right now.
          </p>
          <Button variant="outline" onClick={() => setStep({ stage: 'upload' })} className="w-fit self-center">
            Try another screenshot
          </Button>
        </div>
      )}

      {step.stage === 'confirm' && (
        <ReceiptConfirmForm
          parsed={step.parsed}
          imagePreviewUrl={step.imagePreviewUrl}
          onSaved={handleSaved}
          onCancel={() => setStep({ stage: 'upload' })}
        />
      )}
    </div>
  )
}
