export type Language = 'he' | 'en'

export interface Domain {
  slug: string
  nameHe: string
  nameEn: string
  icon: string
  color: string
  gradient: string
  glowColor: string
}

export interface Habit {
  id: string
  user_id: string
  domain_slug: string
  name: string
  description?: string
  frequency: 'daily' | 'weekly'
  xp_reward: number
  is_active: boolean
  created_at: string
}

export interface HabitLog {
  id: string
  user_id: string
  habit_id: string
  completed_at: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  xp: number
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  created_at: string
}

export interface DomainProgress {
  domain: Domain
  totalHabits: number
  completedToday: number
  streak: number
}
