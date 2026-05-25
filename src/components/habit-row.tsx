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

  const accentColor = domain?.color ?? '#6b7280'

  return (
    <button
      onClick={toggle}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={loading}
      className={`relative w-full flex items-center gap-3 rounded-2xl active:scale-[0.98] transition-all text-start disabled:opacity-50 overflow-hidden ${
        swiped ? 'animate-swipe-done' : ''
      }`}
      style={{
        background: done
          ? `linear-gradient(90deg, ${accentColor}14 0%, ${accentColor}06 100%)`
          : 'var(--card)',
        border: `1px solid ${done ? `${accentColor}33` : 'var(--c-border)'}`,
        padding: '0.85rem 1rem',
        boxShadow: done ? 'none' : '0 1px 2px var(--c-shadow)',
      }}
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
      </div>
    </button>
  )
}
