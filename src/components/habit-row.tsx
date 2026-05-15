'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getDomainBySlug } from '@/lib/domains'
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
  const touchStartX = useRef<number | null>(null)
  const domain = getDomainBySlug(habit.domain_slug)

  const toggle = async () => {
    if (loading) return
    setLoading(true)
    const nextDone = !done
    setDone(nextDone)

    // Haptic feedback
    navigator.vibrate?.(50)

    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    if (done) {
      await supabase
        .from('habit_logs')
        .delete()
        .match({ habit_id: habit.id, completed_at: today })
      await supabase.rpc('update_profile_xp', {
        uid: habit.user_id,
        xp_delta: -habit.xp_reward,
      })
    } else {
      await supabase.from('habit_logs').upsert({
        habit_id: habit.id,
        completed_at: today,
        user_id: habit.user_id,
      })
      await supabase.rpc('update_profile_xp', {
        uid: habit.user_id,
        xp_delta: habit.xp_reward,
      })
    }

    setLoading(false)
    onToggle?.()
    router.refresh()
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

  const accentColor = domain?.color ?? '#6b7280'

  return (
    <button
      onClick={toggle}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={loading}
      className={`relative w-full flex items-center gap-3 rounded-xl active:scale-[0.98] transition-all text-start disabled:opacity-50 overflow-hidden ${
        swiped ? 'animate-swipe-done' : ''
      }`}
      style={{
        background: done
          ? `${accentColor}0e`
          : 'oklch(0.14 0.04 238 / 80%)',
        border: `1px solid ${done ? `${accentColor}25` : 'oklch(0.75 0.12 210 / 10%)'}`,
        padding: '0.75rem',
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
        style={{ background: done ? accentColor : `${accentColor}50` }}
      />

      {/* Checkbox */}
      <div
        className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300"
        style={{
          borderColor: accentColor,
          backgroundColor: done ? accentColor : 'transparent',
          boxShadow: done ? `0 0 10px ${accentColor}50` : 'none',
        }}
      >
        {done && <Check size={12} className="text-white" strokeWidth={3} />}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold truncate transition-all ${
            done ? 'text-white/35' : 'text-white'
          }`}
          style={{ textDecoration: done ? 'line-through' : 'none' }}
        >
          {habit.name}
        </p>
      </div>

      {/* XP badge */}
      <span
        className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{
          background: done ? `${accentColor}20` : 'oklch(0.75 0.17 205 / 12%)',
          color: done ? accentColor : 'oklch(0.75 0.17 205)',
        }}
      >
        +{habit.xp_reward}
      </span>
    </button>
  )
}
