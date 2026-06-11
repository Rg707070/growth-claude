'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, CheckCircle2, Circle, ChevronRight, ChevronLeft, FolderOpen, Folder, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import type { NoteList, QuickNote } from './page'

interface ListsClientProps {
  initialLists: NoteList[]
  initialNotes: QuickNote[]
}

// ─── Folder colors cycling ────────────────────────────────────────────────
const FOLDER_COLORS = [
  '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE',
]
function folderColor(index: number) {
  return FOLDER_COLORS[index % FOLDER_COLORS.length]
}

// ─── Main component ───────────────────────────────────────────────────────
export function ListsClient({ initialLists, initialNotes }: ListsClientProps) {
  const { isRTL } = useLang()
  const [lists, setLists] = useState<NoteList[]>(initialLists)
  const [notes, setNotes] = useState<QuickNote[]>(initialNotes)
  const [activeListId, setActiveListId] = useState<string | null>(null)

  // Create folder state
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [savingFolder, setSavingFolder] = useState(false)
  const folderInputRef = useRef<HTMLInputElement>(null)

  // Note input state
  const [noteInput, setNoteInput] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const noteInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (creatingFolder) folderInputRef.current?.focus()
  }, [creatingFolder])

  useEffect(() => {
    if (activeListId) noteInputRef.current?.focus()
  }, [activeListId])

  // ── Create folder ───────────────────────────────────────────────────────
  const createFolder = async () => {
    const name = folderName.trim()
    if (!name || savingFolder) return
    setSavingFolder(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingFolder(false); return }

    const { data, error } = await supabase
      .from('note_lists')
      .insert({ user_id: user.id, name })
      .select('id, name, created_at')
      .single()

    if (!error && data) {
      setLists((prev: NoteList[]) => [...prev, data as NoteList])
      setFolderName('')
      setCreatingFolder(false)
    }
    setSavingFolder(false)
  }

  const deleteFolder = async (id: string) => {
    setLists((prev: NoteList[]) => prev.filter((l: NoteList) => l.id !== id))
    setNotes((prev: QuickNote[]) => prev.filter((n: QuickNote) => n.list_id !== id))
    const supabase = createClient()
    await supabase.from('note_lists').delete().eq('id', id)
  }

  // ── Notes within active folder ──────────────────────────────────────────
  const addNote = async () => {
    const text = noteInput.trim()
    if (!text || savingNote || !activeListId) return
    setSavingNote(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingNote(false); return }

    const { data, error } = await supabase
      .from('quick_notes')
      .insert({ user_id: user.id, content: text, list_id: activeListId })
      .select('id, content, is_done, created_at, list_id')
      .single()

    if (!error && data) {
      setNotes((prev: QuickNote[]) => [data as QuickNote, ...prev])
      setNoteInput('')
    }
    setSavingNote(false)
    noteInputRef.current?.focus()
  }

  const toggleNote = async (note: QuickNote) => {
    const next = !note.is_done
    setNotes((prev: QuickNote[]) =>
      prev.map((n: QuickNote) => n.id === note.id ? { ...n, is_done: next } : n)
    )
    const supabase = createClient()
    await supabase.from('quick_notes').update({ is_done: next }).eq('id', note.id)
  }

  const deleteNote = async (id: string) => {
    setNotes((prev: QuickNote[]) => prev.filter((n: QuickNote) => n.id !== id))
    const supabase = createClient()
    await supabase.from('quick_notes').delete().eq('id', id)
  }

  const activeList = lists.find((l: NoteList) => l.id === activeListId)
  const activeNotes = notes.filter((n: QuickNote) => n.list_id === activeListId)
  const pending = activeNotes.filter((n: QuickNote) => !n.is_done)
  const done = activeNotes.filter((n: QuickNote) => n.is_done)

  // ── Folder list view ───────────────────────────────────────────────────
  if (!activeListId) {
    return (
      <div className="min-h-screen pb-28 md:pb-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-lg mx-auto px-4 pt-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                {isRTL ? 'רשימות' : 'Lists'}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {lists.length === 0
                  ? (isRTL ? 'צור תיקייה ראשונה' : 'Create your first folder')
                  : isRTL ? `${lists.length} תיקיות` : `${lists.length} folder${lists.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
            <button
              onClick={() => setCreatingFolder(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{
                background: 'var(--brand-gradient)',
                color: 'white',
                boxShadow: '0 4px 12px var(--c-hero-shadow)',
              }}
            >
              <Plus size={15} strokeWidth={2.6} />
              {isRTL ? 'תיקייה' : 'Folder'}
            </button>
          </div>

          {/* Create folder inline input */}
          {creatingFolder && (
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-4"
              style={{
                background: 'var(--c-surface-2)',
                border: '1px solid var(--primary)',
                boxShadow: '0 0 0 3px var(--c-primary-glow)',
              }}
            >
              <Folder size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <input
                ref={folderInputRef}
                value={folderName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFolderName(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') createFolder()
                  if (e.key === 'Escape') { setCreatingFolder(false); setFolderName('') }
                }}
                placeholder={isRTL ? 'שם התיקייה...' : 'Folder name...'}
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: 'var(--foreground)' }}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <button
                onClick={() => { setCreatingFolder(false); setFolderName('') }}
                style={{ color: 'var(--muted-foreground)' }}
              >
                <X size={16} />
              </button>
              <button
                onClick={createFolder}
                disabled={!folderName.trim() || savingFolder}
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-all active:scale-90 disabled:opacity-30"
                style={{ background: 'var(--brand-gradient)' }}
              >
                <Plus size={14} strokeWidth={2.6} color="white" />
              </button>
            </div>
          )}

          {/* Empty state */}
          {lists.length === 0 && !creatingFolder && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📂</div>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'אין תיקיות עדיין' : 'No folders yet'}
              </p>
            </div>
          )}

          {/* Folder cards */}
          <div className="space-y-2">
            {lists.map((list: NoteList, idx: number) => {
              const listNotes = notes.filter((n: QuickNote) => n.list_id === list.id)
              const doneCount = listNotes.filter((n: QuickNote) => n.is_done).length
              const color = folderColor(idx)
              return (
                <FolderCard
                  key={list.id}
                  list={list}
                  total={listNotes.length}
                  done={doneCount}
                  color={color}
                  isRTL={isRTL}
                  onClick={() => setActiveListId(list.id)}
                  onDelete={() => deleteFolder(list.id)}
                />
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Notes inside folder ────────────────────────────────────────────────
  const activeIdx = lists.findIndex((l: NoteList) => l.id === activeListId)
  const color = folderColor(activeIdx)

  return (
    <div className="min-h-screen pb-28 md:pb-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-lg mx-auto px-4 pt-6">

        {/* Back + folder title */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { setActiveListId(null); setNoteInput('') }}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-90"
            style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', color: 'var(--muted-foreground)' }}
            aria-label={isRTL ? 'חזור' : 'Back'}
          >
            {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <div className="flex items-center gap-2">
            <FolderOpen size={22} style={{ color }} />
            <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              {activeList?.name}
            </h1>
          </div>
          <span className="ms-auto text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}22`, color }}>
            {activeNotes.length}
          </span>
        </div>

        {/* Add note input */}
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-6"
          style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}
        >
          <input
            ref={noteInputRef}
            value={noteInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNoteInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addNote()}
            placeholder={isRTL ? 'הוסף פריט...' : 'Add an item...'}
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: 'var(--foreground)' }}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          <button
            onClick={addNote}
            disabled={!noteInput.trim() || savingNote}
            className="flex items-center justify-center w-8 h-8 rounded-xl transition-all active:scale-90 disabled:opacity-30"
            style={{ background: 'var(--brand-gradient)' }}
            aria-label={isRTL ? 'הוסף' : 'Add'}
          >
            <Plus size={16} strokeWidth={2.6} color="white" />
          </button>
        </div>

        {/* Empty state */}
        {activeNotes.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'הוסף פריט ראשון לתיקייה' : 'Add the first item to this folder'}
            </p>
          </div>
        )}

        {/* Pending notes */}
        {pending.length > 0 && (
          <div className="space-y-2 mb-6">
            {pending.map((note: QuickNote) => (
              <NoteRow key={note.id} note={note} onToggle={toggleNote} onDelete={deleteNote} isRTL={isRTL} accentColor={color} />
            ))}
          </div>
        )}

        {/* Done notes */}
        {done.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider px-1 mb-2" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'הושלמו' : 'Done'} ({done.length})
            </p>
            <div className="space-y-2 opacity-60">
              {done.map((note: QuickNote) => (
                <NoteRow key={note.id} note={note} onToggle={toggleNote} onDelete={deleteNote} isRTL={isRTL} accentColor={color} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Folder card ──────────────────────────────────────────────────────────
function FolderCard({
  list,
  total,
  done,
  color,
  isRTL,
  onClick,
  onDelete,
}: {
  list: NoteList
  total: number
  done: number
  color: string
  isRTL: boolean
  onClick: () => void
  onDelete: () => void | Promise<void>
}) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div
      className="group flex items-center gap-4 rounded-2xl px-4 py-4 cursor-pointer transition-all active:scale-[0.99] hover:scale-[1.005]"
      style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}
      onClick={onClick}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      {/* Folder icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}22`, border: `1px solid ${color}40` }}
      >
        <Folder size={22} style={{ color }} />
      </div>

      {/* Name + count */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>
          {list.name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {total === 0
            ? (isRTL ? 'ריק' : 'Empty')
            : isRTL
              ? `${done}/${total} הושלמו`
              : `${done}/${total} done`
          }
        </p>
      </div>

      {/* Progress bar (if has items) */}
      {total > 0 && (
        <div className="w-12 flex flex-col items-end gap-1">
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: `${color}22` }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.round((done / total) * 100)}%`, background: color }}
            />
          </div>
          <span className="text-[10px]" style={{ color }}>
            {Math.round((done / total) * 100)}%
          </span>
        </div>
      )}

      {/* Chevron / delete */}
      <div className="flex-shrink-0 flex items-center gap-1">
        <button
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete() }}
          className={`transition-all active:scale-90 md:opacity-0 md:group-hover:opacity-100 ${showDelete ? 'opacity-60' : 'opacity-0'}`}
          aria-label={isRTL ? 'מחק תיקייה' : 'Delete folder'}
          style={{ color: 'var(--muted-foreground)' }}
        >
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
        {isRTL
          ? <ChevronLeft size={16} style={{ color: 'var(--muted-foreground)' }} />
          : <ChevronRight size={16} style={{ color: 'var(--muted-foreground)' }} />
        }
      </div>
    </div>
  )
}

// ─── Note row ─────────────────────────────────────────────────────────────
function NoteRow({
  note,
  onToggle,
  onDelete,
  isRTL,
  accentColor,
}: {
  note: QuickNote
  onToggle: (note: QuickNote) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  isRTL: boolean
  accentColor: string
}) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div
      className="group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
      style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <button
        onClick={() => onToggle(note)}
        className="flex-shrink-0 transition-transform active:scale-90"
        aria-label={note.is_done ? (isRTL ? 'בטל סימון' : 'Mark undone') : (isRTL ? 'סמן כבוצע' : 'Mark done')}
      >
        {note.is_done
          ? <CheckCircle2 size={20} style={{ color: accentColor }} />
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
