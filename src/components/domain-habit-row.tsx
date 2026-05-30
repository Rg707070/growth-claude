'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Circle, CheckCircle2, Pencil, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getDomainBySlug } from '@/lib/domains'
import { useLang } from '@/lib/lang'
import { Input } from '@/components/ui/input'
import type { Habit } from '@/types'

interface Props {
  habit: Habit
  isCompleted: boolean
}

export function DomainHabitRow({ habit, isCompleted }: Props) {
  const router = useRouter()
  const { t } = useLang()
  const [done, setDone] = useState(isCompleted)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(habit.name)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const domain = getDomainBySlug(habit.domain_slug)
  const color = domain?.color ?? '#6b7280'

  const toggle = async () => {
    if (loading) return
    setLoading(true)
    const prev = done
    setDone(!done)
    navigator.vibrate?.(50)
    try {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      if (prev) {
        const { error } = await supabase.from('habit_logs').delete().match({ habit_id: habit.id, completed_at: today })
        if (error) throw error
      } else {
        const { error } = await supabase.from('habit_logs').upsert({ habit_id: habit.id, completed_at: today, user_id: habit.user_id })
        if (error) throw error
      }
      router.refresh()
    } catch {
      setDone(prev)
    } finally {
      setLoading(false)
    }
  }

  const saveEdit = async () => {
    if (!editName.trim() || saving) return
    setSaving(true)
    try {
      const { error } = await createClient().from('habits').update({ name: editName.trim() }).eq('id', habit.id)
      if (error) throw error
      setEditing(false)
      router.refresh()
    } catch {
      // keep edit open
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditName(habit.name)
    setConfirmDelete(false)
  }

  const deleteHabit = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      const { error } = await createClient().from('habits').update({ is_active: false }).eq('id', habit.id)
      if (error) throw error
      router.refresh()
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  if (editing) {
    return (
      <div
        className="flex gap-2 items-center rounded-xl px-3 py-2"
        style={{ background: 'var(--card)', border: `1px solid ${color}55` }}
      >
        <Input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit()
            if (e.key === 'Escape') cancelEdit()
          }}
          className="flex-1 h-8 text-sm rounded-lg"
          style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }}
        />
        <button
          onClick={saveEdit}
          disabled={saving || !editName.trim()}
          className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0 disabled:opacity-50 transition-opacity"
          style={{ background: color, color: '#fff' }}
        >
          {t('save')}
        </button>
        {confirmDelete ? (
          <button
            onClick={deleteHabit}
            disabled={deleting}
            className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0 font-medium disabled:opacity-50"
            style={{ background: '#ef4444', color: '#fff' }}
          >
            {t('deleteConfirm')}
          </button>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg flex-shrink-0 transition-colors"
            style={{ color: '#ef4444' }}
            aria-label={t('deleteHabit')}
          >
            <Trash2 size={14} />
          </button>
        )}
        <button
          onClick={cancelEdit}
          className="p-1.5 rounded-lg flex-shrink-0"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 transition-all"
      style={{
        background: done ? `${color}12` : 'var(--card)',
        border: `1px solid ${done ? color + '40' : 'var(--border)'}`,
        minHeight: '52px',
      }}
    >
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className="flex-shrink-0 transition-all active:scale-90 disabled:opacity-50"
      >
        {done
          ? <CheckCircle2 size={22} style={{ color }} />
          : <Circle size={22} style={{ color: 'var(--muted-foreground)' }} />
        }
      </button>
      <span
        className="flex-1 text-sm font-medium py-3.5 text-right"
        style={{
          color: done ? 'var(--muted-foreground)' : 'var(--foreground)',
          textDecoration: done ? 'line-through' : 'none',
        }}
      >
        {habit.name}
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex-shrink-0 p-2 rounded-lg transition-all active:scale-90 opacity-40 hover:opacity-80"
        style={{ color: 'var(--muted-foreground)' }}
        aria-label="edit"
      >
        <Pencil size={14} />
      </button>
    </div>
  )
}
