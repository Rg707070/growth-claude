import type { FamilyHabit, FamilyHabitFrequency } from '@/types/family'

const WINDOW_MS: Record<FamilyHabitFrequency, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 31 * 24 * 60 * 60 * 1000,
}

/**
 * Returns true if the habit's streak is currently live (last completion
 * falls within its valid window) and false if it has lapsed.
 */
export function isStreakAlive(habit: FamilyHabit): boolean {
  if (!habit.last_completed_at) return false

  const lastCompleted = new Date(habit.last_completed_at).getTime()
  const windowMs = WINDOW_MS[habit.frequency]
  return Date.now() - lastCompleted <= windowMs
}
