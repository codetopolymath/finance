import { describe, expect, it } from 'vitest'
import {
  busiestHour,
  dailyPoints,
  dayRange,
  hourCounts,
  logsInMonth,
  monthRange,
  weekdayHourCounts,
} from './pauseSelectors'
import type { SmokeLog } from '@/types/pause'

let nextId = 1

// Local-time construction keeps the tests independent of the machine's timezone
function makeLog(at: Date, overrides: Partial<SmokeLog> = {}): SmokeLog {
  return {
    id: nextId++,
    logged_at: at.toISOString(),
    brand_id: 1,
    heart_rate: null,
    stress: null,
    tag: 0,
    tar_mg: 10,
    nicotine_mg: 0.5,
    ...overrides,
  }
}

describe('ranges', () => {
  it('dayRange covers the picked day and the seven days before it', () => {
    const range = dayRange(new Date(2026, 9, 12, 15))
    expect(range.from).toEqual(new Date(2026, 9, 5))
    expect(range.to).toEqual(new Date(2026, 9, 13))
  })

  it('monthRange starts six days before the month and ends at the next month', () => {
    const range = monthRange(new Date(2026, 9, 16))
    expect(range.from).toEqual(new Date(2026, 8, 25))
    expect(range.to).toEqual(new Date(2026, 10, 1))
  })
})

describe('dailyPoints', () => {
  const month = new Date(2026, 9, 1)

  it('returns one point per day through the end of a past month', () => {
    const points = dailyPoints([], month, new Date(2026, 10, 20))
    expect(points).toHaveLength(31)
    expect(points[0].count).toBe(0)
  })

  it('stops at today for the current month', () => {
    expect(dailyPoints([], month, new Date(2026, 9, 16, 9))).toHaveLength(16)
  })

  it('sums count, tar and nicotine per day', () => {
    const logs = [
      makeLog(new Date(2026, 9, 3, 9)),
      makeLog(new Date(2026, 9, 3, 14), { tar_mg: 6, nicotine_mg: 0.3 }),
    ]
    const day = dailyPoints(logs, month, new Date(2026, 9, 16))[2]
    expect(day.count).toBe(2)
    expect(day.tar).toBe(16)
    expect(day.nicotine).toBeCloseTo(0.8)
  })

  it('averages the trailing seven days using logs from before the month', () => {
    const logs = [makeLog(new Date(2026, 8, 30, 10)), makeLog(new Date(2026, 9, 1, 10))]
    const [first] = dailyPoints(logs, month, new Date(2026, 9, 16))
    // Sep 25 - Oct 1 holds two logs
    expect(first.average).toBeCloseTo(2 / 7)
  })
})

describe('hour grids', () => {
  const logs = [
    makeLog(new Date(2026, 9, 12, 15, 5)), // Monday
    makeLog(new Date(2026, 9, 12, 15, 40)),
    makeLog(new Date(2026, 9, 13, 8)), // Tuesday
  ]

  it('counts logs by hour of day', () => {
    const counts = hourCounts(logs)
    expect(counts[15]).toBe(2)
    expect(counts[8]).toBe(1)
  })

  it('counts logs by weekday and hour with Sunday first', () => {
    const counts = weekdayHourCounts(logs)
    expect(counts[1 * 24 + 15]).toBe(2)
    expect(counts[2 * 24 + 8]).toBe(1)
  })

  it('finds the busiest hour, null when empty', () => {
    expect(busiestHour(hourCounts(logs))).toBe(15)
    expect(busiestHour(hourCounts([]))).toBeNull()
  })
})

describe('logsInMonth', () => {
  it('drops logs outside the month', () => {
    const logs = [makeLog(new Date(2026, 8, 30, 10)), makeLog(new Date(2026, 9, 1, 10))]
    expect(logsInMonth(logs, new Date(2026, 9, 16))).toHaveLength(1)
  })
})
