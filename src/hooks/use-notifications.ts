'use client'

import { useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'growth-habit-reminders'

export type ReminderType = 'notification' | 'alarm'

export interface ReminderData {
  time: string
  type: ReminderType
}

export function getStoredReminders(): Record<string, ReminderData> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, unknown>
    const result: Record<string, ReminderData> = {}
    for (const [id, value] of Object.entries(raw)) {
      if (typeof value === 'string') {
        result[id] = { time: value, type: 'notification' }
      } else if (value && typeof value === 'object' && 'time' in value) {
        result[id] = value as ReminderData
      }
    }
    return result
  } catch {
    return {}
  }
}

function saveReminders(reminders: Record<string, ReminderData>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders))
}

export function getReminderForHabit(habitId: string): ReminderData | null {
  return getStoredReminders()[habitId] ?? null
}

export function setHabitReminder(habitId: string, time: string, type: ReminderType) {
  const reminders = getStoredReminders()
  reminders[habitId] = { time, type }
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

export function playAlarmSound() {
  if (typeof window === 'undefined') return
  const CtxClass =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!CtxClass) return

  const ctx = new CtxClass()
  const beep = (startTime: number, freq: number, duration: number) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
    osc.start(startTime)
    osc.stop(startTime + duration)
  }
  beep(ctx.currentTime, 880, 0.25)
  beep(ctx.currentTime + 0.3, 1100, 0.25)
  beep(ctx.currentTime + 0.6, 1320, 0.4)
  beep(ctx.currentTime + 1.1, 880, 0.25)
  beep(ctx.currentTime + 1.4, 1320, 0.5)
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
    if (typeof window === 'undefined') return

    const reminders = getStoredReminders()
    const active = timeoutsRef.current

    active.forEach((t) => clearTimeout(t))
    active.clear()

    habits.forEach((habit) => {
      const reminder = reminders[habit.id]
      if (!reminder) return
      const delay = msUntilTime(reminder.time)
      if (delay < 0) return

      const t = setTimeout(() => {
        if (reminder.type === 'alarm') {
          playAlarmSound()
        } else if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`🔔 ${habit.name}`, {
            body: 'זמן לבצע את ההרגל! 💪',
            icon: '/apple-icon.png',
            tag: `habit-${habit.id}`,
            requireInteraction: false,
          })
        }
        active.delete(habit.id)
      }, delay)

      active.set(habit.id, t)
    })
  }, [habits])

  useEffect(() => {
    scheduleAll()
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t))
      timeoutsRef.current.clear()
    }
  }, [scheduleAll])

  return { scheduleAll }
}
