export type TaskStatus = 'open' | 'done' | 'snoozed'

export interface Task {
  id: number
  title: string
  notes: string | null
  status: TaskStatus
  is_frog: boolean
  due_date: string | null
  snooze_count: number
  budget_minutes: number | null
  sort_order: number
  created_at: string
  completed_at: string | null
}

export type SessionKind = 'work' | 'break'
export type SessionStatus = 'running' | 'paused' | 'completed' | 'abandoned'

export interface FocusSession {
  id: number
  task_id: number
  kind: SessionKind
  planned_minutes: number
  started_at: string
  ended_at: string | null
  status: SessionStatus
}

export type PauseReason = 'blocked' | 'urgent' | 'other'

export interface PauseEvent {
  id: number
  session_id: number
  paused_at: string
  resumed_at: string | null
  reason: PauseReason
  note: string | null
}

export const WORK_MINUTES = 25
export const BREAK_MINUTES = 5
