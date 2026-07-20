import type { FocusSession, PauseEvent, Task } from '@/types/focus'

const TODAY_SOFT_CAP = 5
export const PAUSE_NUDGE_THRESHOLD = 3

function isVisible(task: Task): boolean {
  return task.status === 'open'
}

function bySortOrder(a: Task, b: Task): number {
  return a.sort_order - b.sort_order
}

export interface TodayGroup {
  frog: Task | null
  rest: Task[]
  overflowCount: number
}

/** Frog task pinned first, then the rest by manual sort order, soft-capped
 * so Today never grows into an overwhelming list — see spec §3/§5.1. The
 * overflow count is returned (not silently dropped) so the UI can point to
 * where the rest live. */
export function groupForToday(tasks: Task[]): TodayGroup {
  const open = tasks.filter(isVisible)
  const frog = open.find((t) => t.is_frog) ?? null
  const rest = open.filter((t) => t !== frog).sort(bySortOrder)
  return {
    frog,
    rest: rest.slice(0, TODAY_SOFT_CAP),
    overflowCount: Math.max(0, rest.length - TODAY_SOFT_CAP),
  }
}

/** Open tasks with a due date, grouped by date ascending. */
export function groupForUpcoming(tasks: Task[]): { date: string; tasks: Task[] }[] {
  const dated = tasks.filter((t) => isVisible(t) && t.due_date)
  const groups = new Map<string, Task[]>()
  for (const t of dated) {
    const key = t.due_date!
    const list = groups.get(key)
    if (list) list.push(t)
    else groups.set(key, [t])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => ({ date, tasks: list.sort(bySortOrder) }))
}

/** Open tasks with no due date — the low-friction catch-all. */
export function groupForSomeday(tasks: Task[]): Task[] {
  return tasks.filter((t) => isVisible(t) && !t.due_date).sort(bySortOrder)
}

export function snoozedTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === 'snoozed')
}

function pauseDurationMs(pause: PauseEvent, now: Date): number {
  const start = new Date(pause.paused_at).getTime()
  const end = pause.resumed_at ? new Date(pause.resumed_at).getTime() : now.getTime()
  return Math.max(0, end - start)
}

function sessionActiveMs(session: FocusSession, pauses: PauseEvent[], now: Date): number {
  const start = new Date(session.started_at).getTime()
  const end = session.ended_at ? new Date(session.ended_at).getTime() : now.getTime()
  const total = Math.max(0, end - start)
  const paused = pauses
    .filter((p) => p.session_id === session.id)
    .reduce((sum, p) => sum + pauseDurationMs(p, now), 0)
  return Math.max(0, total - paused)
}

/** Sums active (non-paused) duration across a task's `work` sessions only —
 * break time and paused time never count against budget, per spec §5.2. */
export function activeWorkMs(sessions: FocusSession[], pauses: PauseEvent[], now: Date): number {
  return sessions
    .filter((s) => s.kind === 'work')
    .reduce((sum, s) => sum + sessionActiveMs(s, pauses, now), 0)
}

export interface BudgetBurn {
  spentMs: number
  budgetMs: number
  overMs: number
}

/** Frozen (no `now` dependency in effect) once the task is done — callers
 * should pass `task.completed_at` as `now` in that case so the bar stops
 * updating, per spec §5.2. */
export function budgetBurn(task: Task, sessions: FocusSession[], pauses: PauseEvent[], now: Date): BudgetBurn | null {
  if (task.budget_minutes == null) return null
  const effectiveNow = task.completed_at ? new Date(task.completed_at) : now
  const spentMs = activeWorkMs(sessions, pauses, effectiveNow)
  const budgetMs = task.budget_minutes * 60_000
  return { spentMs, budgetMs, overMs: Math.max(0, spentMs - budgetMs) }
}

export interface CycleCounts {
  workSessions: number
  breakSessions: number
}

export function cycleCounts(sessions: FocusSession[]): CycleCounts {
  return {
    workSessions: sessions.filter((s) => s.kind === 'work').length,
    breakSessions: sessions.filter((s) => s.kind === 'break').length,
  }
}

/** A completed task is a "clean" completion if none of its sessions were
 * ever paused — a positive reinforcement signal, never a judgment of
 * sessions that did need pauses. */
export function isCleanCompletion(sessions: FocusSession[], pauses: PauseEvent[]): boolean {
  const sessionIds = new Set(sessions.map((s) => s.id))
  return !pauses.some((p) => sessionIds.has(p.session_id))
}

/** Soft, optional nudge text once a session's pause count crosses the
 * threshold — never a block, per spec §5.2. */
export function pauseNudge(pauseCountForSession: number): string | null {
  if (pauseCountForSession < PAUSE_NUDGE_THRESHOLD) return null
  return "This one's been paused a few times — want to break it up or reschedule it?"
}
