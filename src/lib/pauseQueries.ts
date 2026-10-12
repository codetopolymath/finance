import { useQuery } from '@tanstack/react-query'
import { subDays, startOfDay } from 'date-fns'
import { supabase } from './supabase'
import type { PauseBrand, SmokeLog } from '@/types/pause'

const LOG_COLUMNS = 'id, logged_at, brand_id, heart_rate, stress, tag, tar_mg, nicotine_mg'
const HISTORY_DAYS = 30

async function fetchSmokeLogs(): Promise<SmokeLog[]> {
  const since = startOfDay(subDays(new Date(), HISTORY_DAYS - 1)).toISOString()
  const { data, error } = await supabase
    .schema('pausewatch')
    .from('smoke_log')
    .select(LOG_COLUMNS)
    .gte('logged_at', since)
    .order('logged_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    tar_mg: Number(row.tar_mg),
    nicotine_mg: Number(row.nicotine_mg),
  }))
}

/** One bounded fetch (30 days is a few hundred rows at most), so the
 * Today/Trend/Rhythm screens share a cache entry and derive everything client-side. */
export function useSmokeLogs() {
  return useQuery({
    queryKey: ['pause', 'smoke_log'],
    queryFn: fetchSmokeLogs,
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
