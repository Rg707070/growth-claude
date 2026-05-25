'use client'

import { useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'growth-habit-reminders'

export function getStoredReminders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveReminders(reminders: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders))
}

export function getReminderForHabit(habitId: string): string | null {
  return getStoredReminders()[habitId] ?? null
}

export function setHabitReminder(habitId: string, time: string) {
  const reminders = getStoredReminders()
  reminders[habitId] = time
  saveReminders(reminders)
}

export function clearHabitReminder(habitId: string) {
  const reminders = getStoredReminders()
  delete reminders[habitId]
  saveReminders(reminders)
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

function msUntilTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  const now = new Date()
  const target = new Date()
  target.setHours(hours, minutes, 0, 0)
  if (target <= now) return -1
  return target.getTime() - now.getTime()
}

export function useHabitReminders(habits: Array<{ id: string; name: string }>) {
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const scheduleAll = useCallback(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const reminders = getStoredReminders()
    const active = timeoutsRef.current

    // Clear existing timeouts
    active.forEach((t) => clearTimeout(t))
    active.clear()

    habits.forEach((habit) => {
      const time = reminders[habit.id]
      if (!time) return
      const delay = msUntilTime(time)
      if (delay < 0) return

      const t = setTimeout(() => {
        new Notification(`⏰ ${habit.name}`, {
          body: 'זמן לבצע את ההרגל! 💪',
          icon: '/apple-icon.png',
          tag: `habit-${habit.id}`,
          requireInteraction: false,
        })
        active.delete(habit.id)
      }, delay)

      active.set(habit.id, t)
    })
  }, [habits])

  // Re-schedule whenever habits or reminders change
  useEffect(() => {
    scheduleAll()
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t))
      timeoutsRef.current.clear()
    }
  }, [scheduleAll])

  return { scheduleAll }
}
