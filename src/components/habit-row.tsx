'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getDomainBySlug } from '@/lib/domains'
import { useLang } from '@/lib/lang'
import { Input } from '@/components/ui/input'
import type { Habit } from '@/types'

interface HabitRowProps {
  habit: Habit
  isCompleted: boolean
  onToggle?: () => void
}

export function HabitRow({ habit, isCompleted, onToggle }: HabitRowProps) {
  const router = useRouter()
  const { t } = useLang()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(isCompleted)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(habit.name)
  const [saving, setSaving] = useState(false)

  const startX = useRef(0)
  const startY = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longFired = useRef(false)
  const touchActive = useRef(false)

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

  const saveEdit = async () => {
    if (!editName.trim() || saving) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('habits')
        .update({ name: editName.trim() })
        .eq('id', habit.id)
      if (error) throw error
      setEditing(false)
      router.refresh()
    } catch {
      // keep editing open on error
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditName(habit.name)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchActive.current = true
    const t0 = e.touches[0]
    startX.current = t0.clientX
    startY.current = t0.clientY
    longFired.current = false
    clearTimer()
    timerRef.current = setTimeout(() => {
      longFired.current = true
      navigator.vibrate?.(80)
      setEditing(true)
    }, 550)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!timerRef.current) return
    const dx = Math.abs(e.touches[0].clientX - startX.current)
    const dy = Math.abs(e.touches[0].clientY - startY.current)
    if (dx > 8 || dy > 8) clearTimer()
  }

  const handleTouchEnd = () => {
    clearTimer()
    if (longFired.current) {
      longFired.current = false
      return
    }
    toggle()
  }

  const handleTouchCancel = () => {
    clearTimer()
    longFired.current = false
    touchActive.current = false
  }

  const handleClick = () => {
    if (touchActive.current) {
      touchActive.current = false
      return
    }
    toggle()
  }

  if (editing) {
    return (
      <div
        className="flex gap-2 items-center rounded-2xl"
        style={{
          background: 'var(--card)',
          border: `1px solid ${accentColor}55`,
          padding: '0.65rem 1rem',
        }}
      >
        <Input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit()
            if (e.key === 'Escape') cancelEdit()
          }}
          className="rounded-xl flex-1 h-8 text-sm"
          style={{
            background: 'var(--c-input)',
            border: '1px solid var(--c-input-border)',
            color: 'var(--foreground)',
          }}
        />
        <button
          onClick={saveEdit}
          disabled={saving || !editName.trim()}
          className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0 disabled:opacity-50 transition-opacity"
          style={{ background: accentColor, color: '#fff' }}
        >
          {t('save')}
        </button>
        <button
          onClick={cancelEdit}
          className="p-1.5 rounded-lg flex-shrink-0"
          style={{
            background: 'var(--secondary)',
            color: 'var(--muted-foreground)',
            border: '1px solid var(--border)',
          }}
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full flex items-center gap-3 rounded-2xl transition-all overflow-hidden select-none active:scale-[0.98]"
      style={{
        background: done
          ? `linear-gradient(90deg, ${accentColor}14 0%, ${accentColor}06 100%)`
          : 'var(--card)',
        border: `1px solid ${done ? `${accentColor}33` : 'var(--c-border)'}`,
        padding: '0.85rem 1rem',
        boxShadow: done ? 'none' : '0 1px 2px var(--c-shadow)',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        cursor: 'pointer',
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
    </div>
  )
}
