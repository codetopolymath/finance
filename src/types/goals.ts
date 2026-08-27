export type GoalStatus = 'active' | 'done'

export interface Goal {
  id: number
  title: string
  why: string | null
  status: GoalStatus
  sort_order: number
  created_at: string
  completed_at: string | null
  group_id: number | null
}

export interface GoalGroup {
  id: number
  name: string
  sort_order: number
  created_at: string
}
