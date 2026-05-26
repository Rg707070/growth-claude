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
  xp_reward?: number
  is_active: boolean
  reminder_time?: string | null
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
  last_activity_date: string | null
  created_at: string
}

export interface DomainProgress {
  domain: Domain
  totalHabits: number
  completedToday: number
}

export interface DomainStats {
  slug: string
  streak: number
  failingDays: number
}

export type TextCategory = 'gemara' | 'mishnah' | 'tanakh' | 'halacha' | 'article' | 'other'

export interface TorahLesson {
  id: string
  title: string
  speaker: string
  duration_minutes: number
  category: string
  description: string | null
  category_color: string
  created_at: string
}

export interface LearningSession {
  id: string
  user_id: string
  text_title: string
  text_category: TextCategory
  started_at: string
  ended_at: string | null
  duration_seconds: number
  created_at: string
}

export interface LearningNote {
  id: string
  user_id: string
  session_id: string | null
  content: string
  type: 'note' | 'question' | 'highlight'
  text_reference: string | null
  created_at: string
  updated_at: string
}

export interface DailyTrack {
  id: string
  user_id: string
  name: string
  content: string
  last_done: string | null
  sort_order: number
  created_at: string
}

export interface LearningSummary {
  id: string
  user_id: string
  title: string
  content: string
  source: string | null
  category: string
  tags: string[]
  folder: string
  is_favorite: boolean
  created_at: string
  updated_at: string
}
