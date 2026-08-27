import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { Goal, GoalGroup, GoalStatus } from '@/types/goals'

const GOAL_COLUMNS = 'id, title, why, status, sort_order, created_at, completed_at, group_id'

async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select(GOAL_COLUMNS)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

/** Single bulk fetch, same reasoning as `useTasks` — a personal goals list
 * is small enough that one cached query beats paginating. */
export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
    staleTime: 30_000,
  })
}

function useInvalidateGoals() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['goals'] })
}

/** Only a title is required — mirrors `useCreateTask`'s capture-bar shape. */
export function useCreateGoal() {
  const invalidate = useInvalidateGoals()
  return useMutation({
    mutationFn: async (title: string) => {
      const { data: existing } = await supabase
        .from('goals')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
      const nextSortOrder = ((existing?.[0]?.sort_order as number | undefined) ?? -1) + 1
      const { error } = await supabase.from('goals').insert({ title, sort_order: nextSortOrder })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export interface GoalPatch {
  title?: string
  why?: string | null
  group_id?: number | null
}

export function useUpdateGoal() {
  const invalidate = useInvalidateGoals()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: GoalPatch }) => {
      const { error } = await supabase.from('goals').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

function useSetGoalStatus() {
  const invalidate = useInvalidateGoals()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: GoalStatus }) => {
      const { error } = await supabase
        .from('goals')
        .update({ status, completed_at: status === 'done' ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useCompleteGoal() {
  const setStatus = useSetGoalStatus()
  return {
    ...setStatus,
    mutate: (id: number) => setStatus.mutate({ id, status: 'done' }),
  }
}

export function useReopenGoal() {
  const setStatus = useSetGoalStatus()
  return {
    ...setStatus,
    mutate: (id: number) => setStatus.mutate({ id, status: 'active' }),
  }
}

/** Unlike tasks, goals expose a real hard delete — there's no session
 * history that depends on a goal row, and "add a goal" needs an undo path. */
export function useDeleteGoal() {
  const invalidate = useInvalidateGoals()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

const GOAL_GROUP_COLUMNS = 'id, name, sort_order, created_at'

async function fetchGoalGroups(): Promise<GoalGroup[]> {
  const { data, error } = await supabase
    .from('goal_groups')
    .select(GOAL_GROUP_COLUMNS)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

/** Folders are optional and few — same single-bulk-fetch reasoning as `useGoals`. */
export function useGoalGroups() {
  return useQuery({
    queryKey: ['goal_groups'],
    queryFn: fetchGoalGroups,
    staleTime: 30_000,
  })
}

function useInvalidateGoalGroups() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['goal_groups'] })
}

export function useCreateGoalGroup() {
  const invalidate = useInvalidateGoalGroups()
  return useMutation({
    mutationFn: async (name: string) => {
      const { data: existing } = await supabase
        .from('goal_groups')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
      const nextSortOrder = ((existing?.[0]?.sort_order as number | undefined) ?? -1) + 1
      const { error } = await supabase.from('goal_groups').insert({ name, sort_order: nextSortOrder })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useRenameGoalGroup() {
  const invalidate = useInvalidateGoalGroups()
  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const { error } = await supabase.from('goal_groups').update({ name }).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

/** The FK is `on delete set null`, so goals in a deleted folder become
 * ungrouped rather than being deleted themselves. */
export function useDeleteGoalGroup() {
  const invalidateGroups = useInvalidateGoalGroups()
  const invalidateGoals = useInvalidateGoals()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('goal_groups').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      invalidateGroups()
      invalidateGoals()
    },
  })
}
