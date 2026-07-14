import { useRef, useState } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReceiptUploadProps {
  onExtracted: (rawText: string, imagePreviewUrl: string) => void
}

/** Runs OCR entirely client-side via Tesseract.js, dynamically imported so it
 * never lands in the main app bundle — only loaded when this screen opens.
 * The worker is created fresh per upload and terminated immediately after
 * recognition (success or failure) so its WASM heap memory is released
 * rather than kept resident across uses. */
export function ReceiptUpload({ onExtracted }: ReceiptUploadProps) {
  const [status, setStatus] = useState<'idle' | 'reading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFile = async (file: File) => {
    setStatus('reading')
    setErrorMessage(null)
    const imagePreviewUrl = URL.createObjectURL(file)

    let worker: Awaited<ReturnType<typeof import('tesseract.js').createWorker>> | null = null
    let failed = false
    try {
      const { createWorker } = await import('tesseract.js')
      worker = await createWorker('eng')
      const { data } = await worker.recognize(file)
      onExtracted(data.text, imagePreviewUrl)
    } catch (error) {
      failed = true
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to read the image')
    } finally {
      if (worker) await worker.terminate()
      if (!failed) setStatus('idle')
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
      <ImagePlus className="size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Upload a PhonePe "Transaction Successful" screenshot
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) handleFile(file)
          event.target.value = ''
        }}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={status === 'reading'} className="w-fit">
        {status === 'reading' ? <Loader2 className="animate-spin" /> : <ImagePlus />}
        {status === 'reading' ? 'Reading receipt…' : 'Choose screenshot'}
      </Button>
      {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
    </div>
  )
}
