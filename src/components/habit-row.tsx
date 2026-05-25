'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Bell, BellOff, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getDomainBySlug } from '@/lib/domains'
import {
  getReminderForHabit,
  setHabitReminder,
  clearHabitReminder,
  requestNotificationPermission,
} from '@/hooks/use-notifications'
import type { Habit } from '@/types'

interface HabitRowProps {
  habit: Habit
  isCompleted: boolean
  onToggle?: () => void
}

export function HabitRow({ habit, isCompleted, onToggle }: HabitRowProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(isCompleted)
  const [swiped, setSwiped] = useState(false)
  const [showReminderPicker, setShowReminderPicker] = useState(false)
  const [reminder, setReminder] = useState<string | null>(() => getReminderForHabit(habit.id))
  const [pendingTime, setPendingTime] = useState('')
  const touchStartX = useRef<number | null>(null)
  const domain = getDomainBySlug(habit.domain_slug)

  const toggle = async () => {
    if (loading) return
    setLoading(true)
    const prevDone = done
    setDone(!done)
    navigator.vibrate?.(50)

    try {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]

      if (prevDone) {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .match({ habit_id: habit.id, completed_at: today })
        if (error) throw error
      } else {
        const { error } = await supabase.from('habit_logs').upsert({
          habit_id: habit.id,
          completed_at: today,
          user_id: habit.user_id,
        })
        if (error) throw error
      }

      onToggle?.()
      router.refresh()
    } catch {
      setDone(prevDone)
    } finally {
      setLoading(false)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(diff) > 80) {
      setSwiped(true)
      setTimeout(() => setSwiped(false), 400)
      toggle()
    }
  }

  const openReminderPicker = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    if (!showReminderPicker) {
      const granted = await requestNotificationPermission()
      if (!granted) return
      setPendingTime(reminder ?? '')
    }
    setShowReminderPicker((prev) => !prev)
  }

  const saveReminder = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!pendingTime) return
    setHabitReminder(habit.id, pendingTime)
    setReminder(pendingTime)
    setShowReminderPicker(false)
    await createClient().from('habits').update({ schedule_time: pendingTime }).eq('id', habit.id)
  }

  const removeReminder = async (e: React.MouseEvent) => {
    e.stopPropagation()
    clearHabitReminder(habit.id)
    setReminder(null)
    setPendingTime('')
    setShowReminderPicker(false)
    await createClient().from('habits').update({ schedule_time: null }).eq('id', habit.id)
  }

  const accentColor = domain?.color ?? '#6b7280'

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden ${swiped ? 'animate-swipe-done' : ''}`}
      style={{
        background: done
          ? `linear-gradient(90deg, ${accentColor}14 0%, ${accentColor}06 100%)`
          : 'var(--card)',
        border: `1px solid ${done ? `${accentColor}33` : 'var(--c-border)'}`,
        boxShadow: done ? 'none' : '0 1px 2px var(--c-shadow)',
      }}
    >
      {/* Main toggle row */}
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}
        aria-disabled={loading}
        className="flex items-center gap-3 w-full active:scale-[0.98] transition-all cursor-pointer select-none"
        style={{ padding: '0.85rem 1rem', opacity: loading ? 0.5 : 1 }}
      >
        {/* Checkbox */}
        <div
          className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
          style={{
            borderColor: accentColor,
            backgroundColor: done ? accentColor : 'transparent',
            boxShadow: done ? `0 0 0 4px ${accentColor}1a` : 'none',
          }}
        >
          {done && <Check size={12} className="text-white" strokeWidth={3.5} />}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate transition-all"
            style={{
              color: done ? 'var(--muted-foreground)' : 'var(--foreground)',
              textDecoration: done ? 'line-through' : 'none',
            }}
          >
            {habit.name}
          </p>
          {habit.schedule_time && (
            <p className="text-[10px] mt-0.5" style={{ color: accentColor }}>
              🕐 {habit.schedule_time.slice(0, 5)}
            </p>
          )}
          {reminder && (
            <p className="text-[10px] mt-0.5" style={{ color: accentColor }}>
              ⏰ {reminder}
            </p>
          )}
        </div>

        {/* Bell button */}
        <button
          onClick={openReminderPicker}
          onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault() }}
          className="flex-shrink-0 p-1.5 rounded-lg transition-all active:scale-90"
          style={{
            color: reminder ? accentColor : 'var(--muted-foreground)',
            background: reminder ? `${accentColor}18` : 'transparent',
          }}
          aria-label="הגדר תזכורת"
        >
          {reminder ? <Bell size={14} /> : <BellOff size={14} />}
        </button>
      </div>

      {/* Reminder picker (inline) */}
      {showReminderPicker && (
        <div
          className="flex items-center gap-2 px-4 pb-3"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="time"
            value={pendingTime}
            onChange={(e) => setPendingTime(e.target.value)}
            className="rounded-lg px-2 py-1 text-sm flex-1"
            style={{
              background: 'var(--c-input)',
              border: `1px solid ${accentColor}44`,
              color: 'var(--foreground)',
            }}
          />
          <button
            onClick={saveReminder}
            disabled={!pendingTime}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-40"
            style={{ background: accentColor, color: '#fff' }}
          >
            שמור
          </button>
          {reminder && (
            <button
              onClick={removeReminder}
              className="p-1.5 rounded-lg transition-all"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
              aria-label="מחק תזכורת"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
