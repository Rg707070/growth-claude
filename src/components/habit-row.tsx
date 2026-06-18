'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Bell, Pencil, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getDomainBySlug } from '@/lib/domains'
import { useLang } from '@/lib/lang'
import {
  getReminderForHabit,
  setHabitReminder,
  clearHabitReminder,
  requestNotificationPermission,
  playAlarmSound,
} from '@/hooks/use-notifications'
import type { ReminderType, ReminderData } from '@/hooks/use-notifications'
import { scheduleSwReminder, clearSwReminder } from '@/lib/sw-register'
import { EditHabitSheet } from '@/components/edit-habit-sheet'
import type { Habit } from '@/types'

interface HabitRowProps {
  habit: Habit
  isCompleted: boolean
  onToggle?: () => void
}

export function HabitRow({ habit, isCompleted, onToggle }: HabitRowProps) {
  const router = useRouter()
  const { t, isRTL } = useLang()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(isCompleted)
  const [showReminderPicker, setShowReminderPicker] = useState(false)
  const [reminder, setReminder] = useState<ReminderData | null>(() => getReminderForHabit(habit.id))
  const [pendingTime, setPendingTime] = useState('')
  const [pendingType, setPendingType] = useState<ReminderType>('notification')
  const [editOpen, setEditOpen] = useState(false)

  const startX = useRef(0)
  const startY = useRef(0)
  const moved = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longFired = useRef(false)
  const isTouching = useRef(false)

  const domain = getDomainBySlug(habit.domain_slug)
  const accentColor = domain?.color ?? '#6b7280'

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

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

  const openReminderPicker = () => {
    if (!showReminderPicker) {
      setPendingTime(reminder?.time ?? '')
      setPendingType(reminder?.type ?? 'notification')
    }
    setShowReminderPicker((prev) => !prev)
  }

  const saveReminder = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!pendingTime) return
    if (pendingType === 'notification') {
      const granted = await requestNotificationPermission()
      if (!granted) return
      void scheduleSwReminder(
        `habit-${habit.id}`,
        pendingTime,
        `🔔 ${habit.name}`,
        t('habitReminderBody'),
        '/dashboard'
      )
    } else {
      playAlarmSound()
    }
    setHabitReminder(habit.id, pendingTime, pendingType)
    setReminder({ time: pendingTime, type: pendingType })
    setShowReminderPicker(false)
    await createClient().from('habits').update({ schedule_time: pendingTime }).eq('id', habit.id)
  }

  const removeReminder = async (e: React.MouseEvent) => {
    e.stopPropagation()
    clearHabitReminder(habit.id)
    void clearSwReminder(`habit-${habit.id}`)
    setReminder(null)
    setPendingTime('')
    setShowReminderPicker(false)
    await createClient().from('habits').update({ schedule_time: null }).eq('id', habit.id)
  }

  // Long press (550ms) → edit; tap → toggle
  const handleTouchStart = (e: React.TouchEvent) => {
    isTouching.current = true
    moved.current = false
    longFired.current = false
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    clearTimer()
    timerRef.current = setTimeout(() => {
      if (!moved.current) {
        longFired.current = true
        navigator.vibrate?.(80)
        setEditOpen(true)
      }
    }, 550)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - startX.current)
    const dy = Math.abs(e.touches[0].clientY - startY.current)
    if (dx > 8 || dy > 8) {
      moved.current = true
      clearTimer()
    }
  }

  const handleTouchEnd = () => {
    clearTimer()
    if (longFired.current || moved.current) return
    toggle()
  }

  const handleTouchCancel = () => {
    clearTimer()
    longFired.current = false
    moved.current = false
    isTouching.current = false
  }

  // Desktop click — skipped if triggered by touch
  const handleClick = () => {
    if (isTouching.current) {
      isTouching.current = false
      return
    }
    toggle()
  }

  // ── Compact row ───────────────────────────────────────────────────────────

  return (
    <div
      className="rounded-xl relative overflow-hidden"
      style={{
        background: done ? '#10b98106' : 'var(--c-card)',
        border: `1px solid ${done ? '#10b98125' : `${accentColor}25`}`,
      }}
    >
      {/* Thin left accent bar */}
      <div
        className="absolute start-0 top-0 bottom-0 w-0.5"
        style={{ background: done ? '#10b981' : accentColor }}
      />

      {/* Main row */}
      <div className="flex items-center gap-2.5 ps-3.5 pe-1.5 py-2.5">

        {/* Toggle area: checkbox + text */}
        <button
          type="button"
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          onContextMenu={(e) => e.preventDefault()}
          disabled={loading}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-start select-none active:opacity-70 transition-opacity disabled:opacity-50"
          style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          {/* Checkbox circle */}
          <div
            className="flex-shrink-0 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all duration-200"
            style={{
              borderColor: done ? '#10b981' : `${accentColor}70`,
              background: done ? '#10b981' : 'transparent',
            }}
          >
            {done && <Check size={11} strokeWidth={3} color="#fff" />}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium leading-snug truncate"
              style={{
                color: done ? 'var(--muted-foreground)' : 'var(--foreground)',
                textDecoration: done ? 'line-through' : 'none',
                textDecorationColor: '#10b98155',
              }}
            >
              {habit.name}
            </p>
            <p className="text-[10px] leading-none mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {domain?.icon} {isRTL ? domain?.nameHe : domain?.nameEn}
              {habit.schedule_time && (
                <span style={{ color: accentColor }}> · 🕐 {habit.schedule_time.slice(0, 5)}</span>
              )}
            </p>
          </div>
        </button>

        {/* Bell — set/active reminder */}
        <button
          type="button"
          onClick={openReminderPicker}
          className="flex-shrink-0 flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all active:scale-90"
          style={{
            color: reminder ? accentColor : 'var(--muted-foreground)',
            background: reminder ? `${accentColor}18` : 'var(--c-surface-2)',
            border: `1px solid ${reminder ? `${accentColor}40` : 'var(--c-border)'}`,
          }}
          aria-label={t('setReminder')}
        >
          {reminder ? <Bell size={14} /> : <Bell size={14} strokeWidth={1.5} />}
          <span className="text-[9px] leading-none font-medium" style={{ color: reminder ? accentColor : 'var(--muted-foreground)' }}>
            {reminder ? reminder.time.slice(0, 5) : (isRTL ? 'תזכורת' : 'remind')}
          </span>
        </button>

        {/* Edit button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setEditOpen(true) }}
          className="flex-shrink-0 flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all active:scale-90"
          style={{
            color: 'var(--muted-foreground)',
            background: 'var(--c-surface-2)',
            border: '1px solid var(--c-border)',
          }}
          aria-label={t('editHabit')}
        >
          <Pencil size={14} strokeWidth={1.5} />
          <span className="text-[9px] leading-none font-medium" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'עריכה' : 'edit'}
          </span>
        </button>
      </div>

      {/* Edit sheet */}
      <EditHabitSheet habit={habit} open={editOpen} onClose={() => setEditOpen(false)} />

      {/* Reminder picker — expands below the row */}
      {showReminderPicker && (
        <div className="flex flex-col gap-2 px-3 pb-3" onClick={(e) => e.stopPropagation()}>
          <div
            className="flex rounded-xl overflow-hidden"
            style={{ border: `1px solid ${accentColor}44` }}
          >
            <button
              onClick={() => setPendingType('notification')}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 transition-all font-medium"
              style={{
                background: pendingType === 'notification' ? accentColor : 'transparent',
                color: pendingType === 'notification' ? '#fff' : 'var(--muted-foreground)',
              }}
            >
              🔔 {t('reminderNotification')}
            </button>
            <button
              onClick={() => setPendingType('alarm')}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 transition-all font-medium"
              style={{
                background: pendingType === 'alarm' ? accentColor : 'transparent',
                color: pendingType === 'alarm' ? '#fff' : 'var(--muted-foreground)',
              }}
            >
              ⏰ {t('reminderAlarm')}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={pendingTime}
              onChange={(e) => setPendingTime(e.target.value)}
              className="rounded-lg px-2 py-1.5 text-sm flex-1"
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
              {t('save')}
            </button>
            {reminder && (
              <button
                onClick={removeReminder}
                className="p-1.5 rounded-lg transition-all"
                style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
                aria-label={t('deleteReminder')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
