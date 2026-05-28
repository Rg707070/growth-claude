export type DomainTaskUrgency = 'low' | 'normal' | 'high' | 'critical'
export type DomainTaskStatus = 'pending' | 'done'

export interface DomainTask {
  id: string
  user_id: string
  domain_slug: string
  title: string
  category: string
  urgency: DomainTaskUrgency
  status: DomainTaskStatus
  due_date: string | null
  created_at: string
}

export type DomainGoalStatus = 'active' | 'done' | 'backlog'

export interface DomainGoal {
  id: string
  user_id: string
  domain_slug: string
  title: string
  type: string
  status: DomainGoalStatus
  notes: string | null
  created_at: string
}
