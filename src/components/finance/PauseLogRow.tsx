import { formatTime } from '@/lib/format'
import { TAG_NAMES, type SmokeLog } from '@/types/pause'

interface PauseLogRowProps {
  log: SmokeLog
  brandName: string
}

export function PauseLogRow({ log, brandName }: PauseLogRowProps) {
  const tag = TAG_NAMES[log.tag] ?? ''

  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
      <span className="w-16 shrink-0 font-mono text-sm tabular-nums">
        {formatTime(new Date(log.logged_at))}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">{brandName}</span>
      {tag && <span className="text-2xs text-muted-foreground">{tag}</span>}
      <span className="shrink-0 font-mono text-2xs text-muted-foreground tabular-nums">
        {log.heart_rate !== null ? `${log.heart_rate} bpm` : '–'}
      </span>
    </div>
  )
}
