import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { FocusSession, PauseEvent, PauseReason, Task, TaskStatus } from '@/types/focus'
import { BREAK_MINUTES, WORK_MINUTES } from '@/types/focus'

const TASK_COLUMNS =
  'id, title, notes, status, is_frog, due_date, snooze_count, budget_minutes, sort_order, created_at, completed_at'
const SESSION_COLUMNS = 'id, task_id, kind, planned_minutes, started_at, ended_at, status'
const PAUSE_COLUMNS = 'id, session_id, paused_at, resumed_at, reason, note'

async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_COLUMNS)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

/** Single bulk fetch, same reasoning as `useTransactions` — a personal task
 * list is small enough that one cached query beats paginating. */
export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 30_000,
  })
}

function useInvalidateTasks() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
}

export interface NewTask {
  title: string
  notes?: string | null
  due_date?: string | null
  budget_minutes?: number | null
}

/** Only a title is required — every other field is optional and omitted
 * from the insert entirely rather than defaulted, per spec §3. */
export function useCreateTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: async (task: NewTask) => {
      const { data: existing } = await supabase
        .from('tasks')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
      const nextSortOrder = ((existing?.[0]?.sort_order as number | undefined) ?? -1) + 1
      const { error } = await supabase.from('tasks').insert({ ...task, sort_order: nextSortOrder })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export interface TaskPatch {
  title?: string
  notes?: string | null
  due_date?: string | null
  budget_minutes?: number | null
  is_frog?: boolean
  sort_order?: number
  status?: TaskStatus
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: TaskPatch }) => {
      const { error } = await supabase.from('tasks').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

/** Snoozing always succeeds instantly and never asks for a reason — the
 * primary, low-friction way a task leaves Today without being done. */
export function useSnoozeTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: async (task: Task) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'snoozed', snooze_count: task.snooze_count + 1 })
        .eq('id', task.id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

/** Un-snoozes back to open, for the weekly-review affordance (re-triage:
 * reschedule, move to Someday, or leave due-date-less). */
export function useUnsnoozeTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: async ({ id, due_date }: { id: number; due_date?: string | null }) => {
      const patch: TaskPatch = { status: 'open' }
      if (due_date !== undefined) patch.due_date = due_date
      const { error } = await supabase.from('tasks').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

/** Marking a task done ends its active session immediately, regardless of
 * time left, per spec §5.2. */
export function useCompleteTask() {
  const invalidate = useInvalidateTasks()
  return useMutation({
    mutationFn: async (task: Task) => {
      const now = new Date().toISOString()
      const { error: sessionError } = await supabase
        .from('focus_sessions')
        .update({ status: 'completed', ended_at: now })
        .eq('task_id', task.id)
        .in('status', ['running', 'paused'])
      if (sessionError) throw sessionError

      const { error } = await supabase
        .from('tasks')
        .update({ status: 'done', completed_at: now })
        .eq('id', task.id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

async function fetchSessionsForTask(taskId: number): Promise<{ sessions: FocusSession[]; pauses: PauseEvent[] }> {
  const { data: sessions, error: sessionsError } = await supabase
    .from('focus_sessions')
    .select(SESSION_COLUMNS)
    .eq('task_id', taskId)
    .order('started_at', { ascending: true })
  if (sessionsError) throw sessionsError

  const sessionIds = (sessions ?? []).map((s) => s.id)
  if (sessionIds.length === 0) return { sessions: sessions ?? [], pauses: [] }

  const { data: pauses, error: pausesError } = await supabase
    .from('pause_events')
    .select(PAUSE_COLUMNS)
    .in('session_id', sessionIds)
  if (pausesError) throw pausesError

  return { sessions: sessions ?? [], pauses: pauses ?? [] }
}

export function useFocusSessions(taskId: number | null) {
  return useQuery({
    queryKey: ['focus-sessions', taskId],
    queryFn: () => fetchSessionsForTask(taskId!),
    enabled: taskId != null,
    staleTime: 15_000,
  })
}

export interface ActiveSession {
  session: FocusSession
  task: Task
  pauses: PauseEvent[]
}

async function fetchActiveSession(): Promise<ActiveSession | null> {
  const { data: sessions, error } = await supabase
    .from('focus_sessions')
    .select(SESSION_COLUMNS)
    .in('status', ['running', 'paused'])
    .limit(1)
  if (error) throw error
  const session = sessions?.[0]
  if (!session) return null

  // Breaks are the one session kind allowed to auto-end — work sessions
  // never auto-end even if they overrun, per spec §5.2/§7.
  if (session.kind === 'break' && session.status === 'running') {
    const plannedEnd = new Date(session.started_at).getTime() + session.planned_minutes * 60_000
    if (Date.now() >= plannedEnd) {
      const { error: endError } = await supabase
        .from('focus_sessions')
        .update({ status: 'completed', ended_at: new Date(plannedEnd).toISOString() })
        .eq('id', session.id)
      if (endError) throw endError
      return null
    }
  }

  const [{ data: task, error: taskError }, { data: pauses, error: pausesError }] = await Promise.all([
    supabase.from('tasks').select(TASK_COLUMNS).eq('id', session.task_id).single(),
    supabase.from('pause_events').select(PAUSE_COLUMNS).eq('session_id', session.id),
  ])
  if (taskError) throw taskError
  if (pausesError) throw pausesError

  return { session, task: task!, pauses: pauses ?? [] }
}

/** Polled at a modest interval so the active-session bar (and the
 * single-tasking guard) stays correct even if another tab/device changed
 * things — the underlying truth is always the stored timestamps, this
 * query just keeps the UI in sync with them. */
export function useActiveFocusSession() {
  return useQuery({
    queryKey: ['focus-sessions', 'active'],
    queryFn: fetchActiveSession,
    staleTime: 10_000,
    refetchInterval: 30_000,
  })
}

function useInvalidateSessions() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['focus-sessions'] })
}

export class ActiveSessionExistsError extends Error {
  constructor() {
    super('Finish or step away from your current focus session first')
  }
}

/** App-side guard against the single-tasking rule — the DB's partial
 * unique index (`one_active_focus_session`) is the real backstop if this
 * check ever loses a race. */
export function useStartWorkSession() {
  const invalidate = useInvalidateSessions()
  return useMutation({
    mutationFn: async (taskId: number) => {
      const active = await fetchActiveSession()
      if (active) throw new ActiveSessionExistsError()
      const { error } = await supabase.from('focus_sessions').insert({
        task_id: taskId,
        kind: 'work',
        planned_minutes: WORK_MINUTES,
        status: 'running',
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function usePauseSession() {
  const invalidate = useInvalidateSessions()
  return useMutation({
    mutationFn: async ({
      sessionId,
      reason,
      note,
    }: {
      sessionId: number
      reason: PauseReason
      note?: string
    }) => {
      const { error: sessionError } = await supabase
        .from('focus_sessions')
        .update({ status: 'paused' })
        .eq('id', sessionId)
      if (sessionError) throw sessionError

      const { error } = await supabase
        .from('pause_events')
        .insert({ session_id: sessionId, reason, note: note?.trim() || null })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useResumeSession() {
  const invalidate = useInvalidateSessions()
  return useMutation({
    mutationFn: async (sessionId: number) => {
      const { data: openPause, error: findError } = await supabase
        .from('pause_events')
        .select('id')
        .eq('session_id', sessionId)
        .is('resumed_at', null)
        .order('paused_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (findError) throw findError
      if (openPause) {
        const { error } = await supabase
          .from('pause_events')
          .update({ resumed_at: new Date().toISOString() })
          .eq('id', openPause.id)
        if (error) throw error
      }
      const { error: sessionError } = await supabase
        .from('focus_sessions')
        .update({ status: 'running' })
        .eq('id', sessionId)
      if (sessionError) throw sessionError
    },
    onSuccess: invalidate,
  })
}

/** Ends a work session normally (not via task completion) and starts the
 * 5-minute break that follows it, per spec §5.2. */
export function useEndWorkSession() {
  const invalidate = useInvalidateSessions()
  return useMutation({
    mutationFn: async (sessionId: number) => {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('focus_sessions')
        .update({ status: 'completed', ended_at: now })
        .eq('id', sessionId)
      if (error) throw error

      const { data: session, error: taskLookupError } = await supabase
        .from('focus_sessions')
        .select('task_id')
        .eq('id', sessionId)
        .single()
      if (taskLookupError) throw taskLookupError

      const { error: breakError } = await supabase.from('focus_sessions').insert({
        task_id: session!.task_id,
        kind: 'break',
        planned_minutes: BREAK_MINUTES,
        status: 'running',
      })
      if (breakError) throw breakError
    },
    onSuccess: invalidate,
  })
}

/** Skipping a break is not a hard block on the user's behavior — it just
 * ends the break early so a new work session can start right away. */
export function useSkipBreak() {
  const invalidate = useInvalidateSessions()
  return useMutation({
    mutationFn: async (sessionId: number) => {
      const { error } = await supabase
        .from('focus_sessions')
        .update({ status: 'completed', ended_at: new Date().toISOString() })
        .eq('id', sessionId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}
