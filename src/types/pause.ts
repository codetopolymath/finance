export interface SmokeLog {
  id: number
  logged_at: string
  brand_id: number
  heart_rate: number | null
  stress: number | null
  tag: number
  tar_mg: number
  nicotine_mg: number
}

export interface PauseBrand {
  id: number
  name: string
  data_quality: 'low' | 'medium' | 'estimate' | 'placeholder'
}

// Index = smoke_log.tag value, mirrors the watch app's Tags module
export const TAG_NAMES = ['', 'Stress', 'Coffee', 'Break', 'Social'] as const
