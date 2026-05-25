'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Pencil, X } from 'lucide-react'
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
  const [swiped, setSwiped] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(habit.name)
  const [saving, setSaving] = useState(false)
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

  if (editing) {
    return (
      <div
        className="flex gap-2 items-center rounded-2xl"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--c-border)',
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
      className={`relative w-full flex items-center rounded-2xl overflow-hidden ${
        swiped ? 'animate-swipe-done' : ''
      }`}
      style={{
        background: done
          ? `linear-gradient(90deg, ${accentColor}14 0%, ${accentColor}06 100%)`
          : 'var(--card)',
        border: `1px solid ${done ? `${accentColor}33` : 'var(--c-border)'}`,
        boxShadow: done ? 'none' : '0 1px 2px var(--c-shadow)',
      }}
    >
      {/* Toggle area */}
      <button
        onClick={toggle}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={loading}
        className="flex-1 flex items-center gap-3 text-start disabled:opacity-50 active:scale-[0.98] transition-all"
        style={{ padding: '0.85rem 0.75rem 0.85rem 1rem' }}
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

      {/* Edit button */}
      <button
        onClick={() => setEditing(true)}
        className="p-1.5 mx-2 rounded-lg flex-shrink-0 active:scale-95 transition-transform"
        style={{
          background: `${accentColor}22`,
          color: accentColor,
          border: `1px solid ${accentColor}44`,
        }}
      >
        <Pencil size={13} strokeWidth={2.5} />
      </button>
    </div>
  )
}
