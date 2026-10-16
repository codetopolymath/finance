import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { PauseBrand, SmokeLog } from '@/types/pause'

const LOG_COLUMNS = 'id, logged_at, brand_id, heart_rate, stress, tag, tar_mg, nicotine_mg'

export interface PauseRange {
  from: Date
  /** Exclusive */
  to: Date
}

async function fetchSmokeLogs({ from, to }: PauseRange): Promise<SmokeLog[]> {
  const { data, error } = await supabase
    .schema('pausewatch')
    .from('smoke_log')
    .select(LOG_COLUMNS)
    .gte('logged_at', from.toISOString())
    .lt('logged_at', to.toISOString())
    .order('logged_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    tar_mg: Number(row.tar_mg),
    nicotine_mg: Number(row.nicotine_mg),
  }))
}

/** Bounded to a day or month window (a few hundred rows at most); everything
 * else is derived client-side. Keyed by ISO bounds so each window caches alone. */
export function useSmokeLogs(range: PauseRange) {
  return useQuery({
    queryKey: ['pause', 'smoke_log', range.from.toISOString(), range.to.toISOString()],
    queryFn: () => fetchSmokeLogs(range),
    staleTime: 30_000,
  })
}

async function fetchBrands(): Promise<PauseBrand[]> {
  const { data, error } = await supabase
    .schema('pausewatch')
    .from('brands')
    .select('id, name, data_quality')
    .order('id', { ascending: true })
  if (error) throw error
  return data ?? []
}

export function usePauseBrands() {
  return useQuery({
    queryKey: ['pause', 'brands'],
    queryFn: fetchBrands,
    staleTime: Infinity,
  })
}
