'use client'

import { useState } from 'react'
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
  const domain = getDomainBySlug(habit.domain_slug)

  const toggle = async () => {
    if (loading) return
    setLoading(true)
    const nextDone = !done
    setDone(nextDone)

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

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all text-start disabled:opacity-50"
    >
      <div
        className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200"
        style={{
          borderColor: domain?.color ?? '#6b7280',
          backgroundColor: done ? (domain?.color ?? '#6b7280') : 'transparent',
        }}
      >
        {done && <Check size={12} className="text-white" strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate transition-all ${
            done ? 'line-through text-white/40' : 'text-white'
          }`}
        >
          {habit.name}
        </p>
      </div>
      <span className="text-xs text-white/40 flex-shrink-0">
        +{habit.xp_reward} XP
      </span>
    </button>
  )
}
