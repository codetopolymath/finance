import { describe, expect, it } from 'vitest'
import {
  activeWorkMs,
  budgetBurn,
  groupForToday,
  isCleanCompletion,
  pauseNudge,
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
  it('pins the frog task and soft-caps the rest to 5, reporting overflow', () => {
    const frog = makeTask({ id: 1, is_frog: true, sort_order: 0 })
    const rest = Array.from({ length: 7 }, (_, i) => makeTask({ id: i + 2, sort_order: i }))
    const result = groupForToday([frog, ...rest])
    expect(result.frog?.id).toBe(1)
    expect(result.rest).toHaveLength(5)
    expect(result.overflowCount).toBe(2)
  })

  it('excludes done and snoozed tasks', () => {
    const open = makeTask({ id: 1, status: 'open' })
    const done = makeTask({ id: 2, status: 'done' })
    const snoozed = makeTask({ id: 3, status: 'snoozed' })
    const result = groupForToday([open, done, snoozed])
    expect(result.rest.map((t) => t.id)).toEqual([1])
  })
})
