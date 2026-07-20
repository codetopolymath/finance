import type { FocusSession, PauseEvent, Task } from '@/types/focus'

const TODAY_SOFT_CAP = 5
export const PAUSE_NUDGE_THRESHOLD = 3
export const SNOOZE_NUDGE_THRESHOLD = 3

function isVisible(task: Task): boolean {
  return task.status === 'open'
}

function bySortOrder(a: Task, b: Task): number {
  return a.sort_order - b.sort_order
}

/** "yyyy-MM-dd" in local time, to compare against `due_date` (a date-only
 * column) without the UTC-midnight rollback `new Date(string)` would cause
 * in timezones ahead of UTC — same reasoning as `parseDateOnly` in
 * `format.ts`. */
export function localDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isoToLocalDateKey(iso: string): string {
  return localDateOnly(new Date(iso))
}

export interface TodayGroup {
  frog: Task | null
  rest: Task[]
  overflowCount: number
}

/** Frog task pinned first, then open tasks due today or overdue, by manual
 * sort order, soft-capped so Today never grows into an overwhelming list —
 * see spec §3/§5.1. Tasks due in the future live only in Upcoming, and
 * undated tasks live only in Someday — Today never duplicates either view.
 * The overflow count is returned (not silently dropped) so the UI can
 * point to where the rest live. */
export function groupForToday(tasks: Task[], now: Date = new Date()): TodayGroup {
  const todayStr = localDateOnly(now)
  const open = tasks.filter(isVisible)
  const frog = open.find((t) => t.is_frog) ?? null
  const dueTodayOrOverdue = open.filter((t) => t !== frog && t.due_date != null && t.due_date <= todayStr)
  const rest = dueTodayOrOverdue.sort(bySortOrder)
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

/** Completed tasks, most recently finished first — there was previously no
 * way to see these at all once marked done. */
export function groupForDone(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.status === 'done')
    .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
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

/** `snooze_count` was tracked from the start but never surfaced anywhere —
 * the spec explicitly wants a soft nudge once it climbs, same no-guilt
 * framing as `pauseNudge`. */
export function snoozeNudge(snoozeCount: number): string | null {
  if (snoozeCount < SNOOZE_NUDGE_THRESHOLD) return null
  return "This one's been snoozed a lot — want to reschedule it, break it into something smaller, or let it go?"
}

/** Every local calendar day that had *some* focus activity — a work session
 * started, or a task completed — counted as "showed up," not "finished
 * everything." Powers the streak below; a day with no activity is just an
 * absent date, not a recorded failure. */
export function computeActiveDates(sessions: FocusSession[], tasks: Task[]): Set<string> {
  const dates = new Set<string>()
  for (const s of sessions) {
    if (s.kind === 'work') dates.add(isoToLocalDateKey(s.started_at))
  }
  for (const t of tasks) {
    if (t.completed_at) dates.add(isoToLocalDateKey(t.completed_at))
  }
  return dates
}

/** Consecutive active days ending at today. If today has no activity yet,
 * counting starts from yesterday instead — a streak isn't broken mid-day,
 * only once a full day passes with nothing logged. */
export function currentStreak(activeDates: Set<string>, now: Date = new Date()): number {
  let cursor = now
  if (!activeDates.has(localDateOnly(cursor))) {
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() - 1)
  }
  let streak = 0
  while (activeDates.has(localDateOnly(cursor))) {
    streak++
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export interface TodaySummary {
  totalMs: number
  sessionCount: number
}

/** Today's focused time/session count across every task — the positive
 * momentum signal the feature was missing; deliberately global (not
 * per-task) so it reads as "how today went," not another per-item stat. */
export function todaySummary(sessions: FocusSession[], pauses: PauseEvent[], now: Date = new Date()): TodaySummary {
  const todayKey = localDateOnly(now)
  const todaysWork = sessions.filter((s) => s.kind === 'work' && isoToLocalDateKey(s.started_at) === todayKey)
  return {
    totalMs: activeWorkMs(todaysWork, pauses, now),
    sessionCount: todaysWork.length,
  }
}
