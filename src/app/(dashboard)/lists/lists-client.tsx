'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import type { QuickNote } from './page'

interface ListsClientProps {
  initialNotes: QuickNote[]
}

export function ListsClient({ initialNotes }: ListsClientProps) {
  const { isRTL } = useLang()
  const router = useRouter()
  const [notes, setNotes] = useState<QuickNote[]>(initialNotes)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const addNote = async () => {
    const text = input.trim()
    if (!text || saving) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data, error } = await supabase
      .from('quick_notes')
      .insert({ user_id: user.id, content: text })
      .select('id, content, is_done, created_at')
      .single()

    if (!error && data) {
      setNotes((prev: QuickNote[]) => [data as QuickNote, ...prev])
      setInput('')
    }
    setSaving(false)
    inputRef.current?.focus()
  }

  const toggleDone = async (note: QuickNote) => {
    const next = !note.is_done
    setNotes((prev: QuickNote[]) => prev.map((n: QuickNote) => n.id === note.id ? { ...n, is_done: next } : n))
    const supabase = createClient()
    await supabase.from('quick_notes').update({ is_done: next }).eq('id', note.id)
  }

  const deleteNote = async (id: string) => {
    setNotes((prev: QuickNote[]) => prev.filter((n: QuickNote) => n.id !== id))
    const supabase = createClient()
    await supabase.from('quick_notes').delete().eq('id', id)
  }

  const pending = notes.filter((n: QuickNote) => !n.is_done)
  const done = notes.filter((n: QuickNote) => n.is_done)

  return (
    <div className="min-h-screen pb-28 md:pb-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-lg mx-auto px-4 pt-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            {isRTL ? 'רשימות' : 'Lists'}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'רשום מה שעולה לך בראש' : 'Jot down anything you want to remember'}
          </p>
        </div>

        {/* Quick add input */}
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-6"
          style={{
            background: 'var(--c-surface-2)',
            border: '1px solid var(--c-border)',
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addNote()}
            placeholder={isRTL ? 'הוסף פריט...' : 'Add an item...'}
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: 'var(--foreground)' }}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          <button
            onClick={addNote}
            disabled={!input.trim() || saving}
            className="flex items-center justify-center w-8 h-8 rounded-xl transition-all active:scale-90 disabled:opacity-30"
            style={{ background: 'var(--brand-gradient)' }}
            aria-label={isRTL ? 'הוסף' : 'Add'}
          >
            <Plus size={16} strokeWidth={2.6} color="white" />
          </button>
        </div>

        {/* Empty state */}
        {notes.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'אין פריטים עדיין — הוסף את הראשון' : 'No items yet — add the first one'}
            </p>
          </div>
        )}

        {/* Pending notes */}
        {pending.length > 0 && (
          <div className="space-y-2 mb-6">
            {pending.map((note: QuickNote) => (
              <NoteRow key={note.id} note={note} onToggle={toggleDone} onDelete={deleteNote} isRTL={isRTL} />
            ))}
          </div>
        )}

        {/* Done notes */}
        {done.length > 0 && (
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider px-1 mb-2"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {isRTL ? 'הושלמו' : 'Done'} ({done.length})
            </p>
            <div className="space-y-2 opacity-60">
              {done.map((note: QuickNote) => (
                <NoteRow key={note.id} note={note} onToggle={toggleDone} onDelete={deleteNote} isRTL={isRTL} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function NoteRow({
  note,
  onToggle,
  onDelete,
  isRTL,
}: {
  note: QuickNote
  onToggle: (note: QuickNote) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  isRTL: boolean
}) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div
      className="group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all active:scale-[0.99]"
      style={{
        background: 'var(--c-surface-2)',
        border: '1px solid var(--c-border)',
      }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <button
        onClick={() => onToggle(note)}
        className="flex-shrink-0 transition-transform active:scale-90"
        aria-label={note.is_done ? (isRTL ? 'בטל סימון' : 'Mark undone') : (isRTL ? 'סמן כבוצע' : 'Mark done')}
      >
        {note.is_done
          ? <CheckCircle2 size={20} style={{ color: 'var(--primary)' }} />
          : <Circle size={20} strokeWidth={1.5} style={{ color: 'var(--muted-foreground)' }} />
        }
      </button>

      <span
        className="flex-1 text-sm leading-snug"
        style={{
          color: note.is_done ? 'var(--muted-foreground)' : 'var(--foreground)',
          textDecoration: note.is_done ? 'line-through' : 'none',
        }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {note.content}
      </span>

      <button
        onClick={() => onDelete(note.id)}
        className={`flex-shrink-0 transition-all active:scale-90 md:opacity-0 md:group-hover:opacity-100 ${showDelete ? 'opacity-100' : 'opacity-0'}`}
        aria-label={isRTL ? 'מחק' : 'Delete'}
        style={{ color: 'var(--muted-foreground)' }}
      >
        <Trash2 size={15} strokeWidth={1.75} />
      </button>
    </div>
  )
}
