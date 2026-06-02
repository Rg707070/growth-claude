export type FamilyTaskCategory = 'household' | 'financial' | 'shopping' | 'childcare' | 'social' | 'other'
export type FamilyTaskStatus = 'pending' | 'in_progress' | 'done'
export type FamilyTaskUrgency = 'low' | 'normal' | 'high' | 'critical'

export interface FamilyTaskFolder {
  id: string
  user_id: string
  name: string
  color: string
  sort_order: number
  created_at: string
}

export interface FamilyTask {
  id: string
  user_id: string
  family_id: string
  title: string
  category: FamilyTaskCategory
  status: FamilyTaskStatus
  urgency: FamilyTaskUrgency
  due_date: string | null
  folder_id: string | null
  assigned_to: string | null
  is_recurring: boolean
  rotation_index: number
  created_at: string
  updated_at: string
}

export type FamilyHabitFrequency = 'daily' | 'weekly' | 'monthly'
export type FamilyHabitAccountability = 'shared_streak' | 'individual'

export interface FamilyHabit {
  id: string
  user_id: string
  family_id: string
  name: string
  frequency: FamilyHabitFrequency
  accountability_type: FamilyHabitAccountability
  current_streak: number
  last_completed_at: string | null
  context_anchor: string | null
  is_active: boolean
  created_at: string
}

export type RoutineBreakerType = 'day_trip' | 'restaurant' | 'long_term_travel' | 'relocation' | 'activity' | 'other'
export type RoutineBreakerCostTier = 'budget' | 'moderate' | 'luxury'
export type RoutineBreakerStatus = 'backlog' | 'planned' | 'archived'

export interface MediaLink {
  url: string
  label: string
}

export interface RoutineBreaker {
  id: string
  user_id: string
  family_id: string
  title: string
  type: RoutineBreakerType
  cost_tier: RoutineBreakerCostTier
  status: RoutineBreakerStatus
  media_links: MediaLink[]
  target_date: string | null
  notes: string | null
  created_at: string
}

export interface RoutineBreakerFilters {
  type?: RoutineBreakerType
  cost_tier?: RoutineBreakerCostTier
}

// ─── Family Events ───────────────────────────────────────────

export type FamilyEventCategory =
  | 'birthday'
  | 'holiday'
  | 'trip'
  | 'gathering'
  | 'appointment'
  | 'activity'
  | 'other'

export type FamilyEventStatus = 'upcoming' | 'completed' | 'cancelled'

export type FamilyEventRecurrence = 'weekly' | 'monthly' | 'yearly'

export interface FamilyEvent {
  id: string
  user_id: string
  family_id: string
  title: string
  category: FamilyEventCategory
  event_date: string  // YYYY-MM-DD
  is_recurring: boolean
  recurrence: FamilyEventRecurrence | null
  notes: string | null
  status: FamilyEventStatus
  created_at: string
}
