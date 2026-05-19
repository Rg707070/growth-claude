import type { FamilyHabit, FamilyHabitFrequency } from '@/types/family'

const WINDOW_MS: Record<FamilyHabitFrequency, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 31 * 24 * 60 * 60 * 1000,
}

/**
 * Determines whether completing a habit now continues the streak or resets it.
 * Returns the new streak count without mutating the habit.
 */
export function computeNewStreak(habit: FamilyHabit): number {
  if (!habit.last_completed_at) return 1

  const lastCompleted = new Date(habit.last_completed_at).getTime()
  const windowMs = WINDOW_MS[habit.frequency]
  const isWithinWindow = Date.now() - lastCompleted <= windowMs

  return isWithinWindow ? habit.current_streak + 1 : 1
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

/**
 * Returns how many milliseconds remain before the current streak lapses.
 * Returns 0 if the streak is already dead or was never started.
 */
export function streakTimeRemainingMs(habit: FamilyHabit): number {
  if (!habit.last_completed_at) return 0

  const lastCompleted = new Date(habit.last_completed_at).getTime()
  const windowMs = WINDOW_MS[habit.frequency]
  const remaining = windowMs - (Date.now() - lastCompleted)
  return Math.max(0, remaining)
}
