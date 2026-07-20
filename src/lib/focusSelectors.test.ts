import { describe, expect, it } from 'vitest'
import {
  activeWorkMs,
  budgetBurn,
  computeActiveDates,
  currentStreak,
  groupForToday,
  isCleanCompletion,
  pauseNudge,
  snoozeNudge,
  todaySummary,
} from './focusSelectors'
import type { FocusSession, PauseEvent, Task } from '@/types/focus'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    title: 'Test task',
    notes: null,
    status: 'open',
    is_frog: false,
    due_date: null,
    snooze_count: 0,
    budget_minutes: null,
    sort_order: 0,
    created_at: '2026-07-20T00:00:00.000Z',
    completed_at: null,
    ...overrides,
  }
}

function makeSession(overrides: Partial<FocusSession> = {}): FocusSession {
  return {
    id: 1,
    task_id: 1,
    kind: 'work',
    planned_minutes: 25,
    started_at: '2026-07-20T10:00:00.000Z',
    ended_at: null,
    status: 'running',
    ...overrides,
  }
}

describe('activeWorkMs', () => {
  it('excludes paused time from a work session', () => {
    const session = makeSession({
      started_at: '2026-07-20T10:00:00.000Z',
      ended_at: '2026-07-20T10:30:00.000Z',
      status: 'completed',
    })
    const pauses: PauseEvent[] = [
      {
        id: 1,
        session_id: 1,
        paused_at: '2026-07-20T10:10:00.000Z',
        resumed_at: '2026-07-20T10:15:00.000Z',
        reason: 'blocked',
        note: null,
      },
    ]
    const now = new Date('2026-07-20T11:00:00.000Z')
    // 30 min total - 5 min paused = 25 min active
    expect(activeWorkMs([session], pauses, now)).toBe(25 * 60_000)
  })

  it('excludes break sessions entirely', () => {
    const work = makeSession({ ended_at: '2026-07-20T10:25:00.000Z', status: 'completed' })
    const brk = makeSession({
      id: 2,
      kind: 'break',
      started_at: '2026-07-20T10:25:00.000Z',
      ended_at: '2026-07-20T10:30:00.000Z',
      status: 'completed',
    })
    const now = new Date('2026-07-20T11:00:00.000Z')
    expect(activeWorkMs([work, brk], [], now)).toBe(25 * 60_000)
  })

  it('counts an in-progress pause up to `now`', () => {
    const session = makeSession({ status: 'paused' })
    const pauses: PauseEvent[] = [
      { id: 1, session_id: 1, paused_at: '2026-07-20T10:20:00.000Z', resumed_at: null, reason: 'other', note: null },
    ]
    const now = new Date('2026-07-20T10:25:00.000Z')
    // 25 min elapsed - 5 min still-open pause = 20 min active
    expect(activeWorkMs([session], pauses, now)).toBe(20 * 60_000)
  })
})

describe('budgetBurn', () => {
  it('returns null when no budget is set', () => {
    expect(budgetBurn(makeTask(), [], [], new Date())).toBeNull()
  })

  it('reports overMs neutrally once spent exceeds budget', () => {
    const task = makeTask({ budget_minutes: 20 })
    const session = makeSession({ ended_at: '2026-07-20T10:30:00.000Z', status: 'completed' })
    const now = new Date('2026-07-20T11:00:00.000Z')
    const burn = budgetBurn(task, [session], [], now)!
    expect(burn.spentMs).toBe(30 * 60_000)
    expect(burn.budgetMs).toBe(20 * 60_000)
    expect(burn.overMs).toBe(10 * 60_000)
  })

  it('freezes at completed_at once the task is done', () => {
    const task = makeTask({ budget_minutes: 60, status: 'done', completed_at: '2026-07-20T10:30:00.000Z' })
    const session = makeSession({ ended_at: '2026-07-20T10:30:00.000Z', status: 'completed' })
    const muchLater = new Date('2026-07-21T00:00:00.000Z')
    const burn = budgetBurn(task, [session], [], muchLater)!
    expect(burn.spentMs).toBe(30 * 60_000)
  })
})

describe('isCleanCompletion', () => {
  it('is true when no pauses touched any of the task sessions', () => {
    const sessions = [makeSession({ id: 1 }), makeSession({ id: 2 })]
    expect(isCleanCompletion(sessions, [])).toBe(true)
  })

  it('is false once any session had a pause', () => {
    const sessions = [makeSession({ id: 1 })]
    const pauses: PauseEvent[] = [
      { id: 1, session_id: 1, paused_at: '2026-07-20T10:05:00.000Z', resumed_at: null, reason: 'other', note: null },
    ]
    expect(isCleanCompletion(sessions, pauses)).toBe(false)
  })
})

describe('pauseNudge', () => {
  it('is null below the threshold and never treated as a block', () => {
    expect(pauseNudge(0)).toBeNull()
    expect(pauseNudge(2)).toBeNull()
  })

  it('surfaces a soft nudge at/above the threshold', () => {
    expect(pauseNudge(3)).not.toBeNull()
  })
})

describe('groupForToday', () => {
  const today = new Date('2026-07-20T12:00:00.000Z')

  it('pins the frog task and soft-caps the due-today/overdue rest to 5, reporting overflow', () => {
    const frog = makeTask({ id: 1, is_frog: true, sort_order: 0, due_date: '2026-07-20' })
    const rest = Array.from({ length: 7 }, (_, i) =>
      makeTask({ id: i + 2, sort_order: i, due_date: '2026-07-19' }),
    )
    const result = groupForToday([frog, ...rest], today)
    expect(result.frog?.id).toBe(1)
    expect(result.rest).toHaveLength(5)
    expect(result.overflowCount).toBe(2)
  })

  it('excludes done and snoozed tasks', () => {
    const open = makeTask({ id: 1, status: 'open', due_date: '2026-07-20' })
    const done = makeTask({ id: 2, status: 'done', due_date: '2026-07-20' })
    const snoozed = makeTask({ id: 3, status: 'snoozed', due_date: '2026-07-20' })
    const result = groupForToday([open, done, snoozed], today)
    expect(result.rest.map((t) => t.id)).toEqual([1])
  })

  it('excludes future-dated (Upcoming) and undated (Someday) tasks', () => {
    const dueToday = makeTask({ id: 1, due_date: '2026-07-20' })
    const overdue = makeTask({ id: 2, due_date: '2026-07-10' })
    const future = makeTask({ id: 3, due_date: '2026-08-01' })
    const undated = makeTask({ id: 4, due_date: null })
    const result = groupForToday([dueToday, overdue, future, undated], today)
    expect(result.rest.map((t) => t.id).sort()).toEqual([1, 2])
  })
})

describe('snoozeNudge', () => {
  it('is null below the threshold and surfaces at/above it', () => {
    expect(snoozeNudge(0)).toBeNull()
    expect(snoozeNudge(2)).toBeNull()
    expect(snoozeNudge(3)).not.toBeNull()
  })
})

describe('computeActiveDates / currentStreak', () => {
  it('counts a work session start and a task completion as activity on their own day', () => {
    const sessions = [makeSession({ id: 1, kind: 'work', started_at: '2026-07-19T10:00:00.000Z' })]
    const tasks = [makeTask({ id: 1, completed_at: '2026-07-18T09:00:00.000Z' })]
    const dates = computeActiveDates(sessions, tasks)
    expect(dates.has('2026-07-19')).toBe(true)
    expect(dates.has('2026-07-18')).toBe(true)
  })

  it('counts consecutive days including today when today is active', () => {
    const dates = new Set(['2026-07-18', '2026-07-19', '2026-07-20'])
    expect(currentStreak(dates, new Date('2026-07-20T12:00:00.000Z'))).toBe(3)
  })

  it('does not break the streak mid-day when today has no activity yet', () => {
    const dates = new Set(['2026-07-18', '2026-07-19'])
    expect(currentStreak(dates, new Date('2026-07-20T06:00:00.000Z'))).toBe(2)
  })

  it('is 0 once a full day is missed', () => {
    const dates = new Set(['2026-07-17'])
    expect(currentStreak(dates, new Date('2026-07-20T12:00:00.000Z'))).toBe(0)
  })
})

describe('todaySummary', () => {
  it('sums only today\'s work sessions, ignoring other days and break sessions', () => {
    const today = new Date('2026-07-20T15:00:00.000Z')
    const sessions = [
      makeSession({ id: 1, kind: 'work', started_at: '2026-07-20T09:00:00.000Z', ended_at: '2026-07-20T09:25:00.000Z', status: 'completed' }),
      makeSession({ id: 2, kind: 'break', started_at: '2026-07-20T09:25:00.000Z', ended_at: '2026-07-20T09:30:00.000Z', status: 'completed' }),
      makeSession({ id: 3, kind: 'work', started_at: '2026-07-19T09:00:00.000Z', ended_at: '2026-07-19T09:25:00.000Z', status: 'completed' }),
    ]
    const result = todaySummary(sessions, [], today)
    expect(result.sessionCount).toBe(1)
    expect(result.totalMs).toBe(25 * 60_000)
  })
})
