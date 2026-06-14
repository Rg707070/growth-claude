'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, CheckCircle2, Circle, ChevronRight, ChevronLeft, FolderOpen, Folder, X, CalendarDays } from 'lucide-react'
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

// ─── Date utilities ───────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0]
}
function offsetDay(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().split('T')[0]
}
function weekAgoStr() {
  return offsetDay(-6)
}

function dueDateColor(due: string | null): string {
  if (!due) return 'var(--muted-foreground)'
  const t = todayStr()
  if (due < t) return '#ef4444'
  if (due === t) return '#f59e0b'
  if (due === offsetDay(1)) return '#3b82f6'
  return '#10b981'
}

function formatShortDate(dateStr: string, isRTL: boolean): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short' })
}

function relativeTime(isoStr: string, isRTL: boolean): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  if (diff < 60000) return isRTL ? 'עכשיו' : 'now'
  if (diff < 3600000) return isRTL ? `לפני ${Math.floor(diff / 60000)} ד'` : `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return isRTL ? `לפני ${Math.floor(diff / 3600000)} ש'` : `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return isRTL ? `לפני ${Math.floor(diff / 86400000)} ימים` : `${Math.floor(diff / 86400000)}d ago`
  return new Date(isoStr).toLocaleDateString(isRTL ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short' })
}

function folderLastActivity(listId: string, notes: QuickNote[], listCreatedAt: string): string {
  const listNotes = notes.filter(n => n.list_id === listId)
  if (listNotes.length === 0) return listCreatedAt
  return listNotes.reduce((max, n) => (n.created_at > max ? n.created_at : max), listCreatedAt)
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
  const [noteDueDate, setNoteDueDate] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const noteInputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (creatingFolder) folderInputRef.current?.focus()
  }, [creatingFolder])

  useEffect(() => {
    if (activeListId) noteInputRef.current?.focus()
  }, [activeListId])

  useEffect(() => {
    if (showDatePicker) dateInputRef.current?.focus()
  }, [showDatePicker])

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
      .insert({
        user_id: user.id,
        content: text,
        list_id: activeListId,
        due_date: noteDueDate || null,
      })
      .select('id, content, is_done, created_at, list_id, due_date')
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

  // ── Date grouping for pending notes ──────────────────────────────────────
  const t = todayStr()
  const tomorrow = offsetDay(1)
  const weekEnd = offsetDay(7)
  const weekAgo = weekAgoStr()

  const withDue = pending.filter((n: QuickNote) => n.due_date)
  const overdue    = withDue.filter((n: QuickNote) => n.due_date! < t).sort((a: QuickNote, b: QuickNote) => a.due_date!.localeCompare(b.due_date!))
  const dueToday   = withDue.filter((n: QuickNote) => n.due_date === t)
  const dueTomorrow = withDue.filter((n: QuickNote) => n.due_date === tomorrow)
  const dueWeek    = withDue.filter((n: QuickNote) => n.due_date! > tomorrow && n.due_date! <= weekEnd)
  const dueLater   = withDue.filter((n: QuickNote) => n.due_date! > weekEnd).sort((a: QuickNote, b: QuickNote) => a.due_date!.localeCompare(b.due_date!))

  const noDue = pending.filter((n: QuickNote) => !n.due_date)
  const noDueToday   = noDue.filter((n: QuickNote) => n.created_at.startsWith(t))
  const noDueWeek    = noDue.filter((n: QuickNote) => !n.created_at.startsWith(t) && n.created_at >= weekAgo + 'T')
  const noDueOlder   = noDue.filter((n: QuickNote) => n.created_at < weekAgo + 'T')

  // ── Sort folders by last activity ─────────────────────────────────────
  const sortedLists = [...lists].sort((a: NoteList, b: NoteList) => {
    const aLast = folderLastActivity(a.id, notes, a.created_at)
    const bLast = folderLastActivity(b.id, notes, b.created_at)
    return bLast.localeCompare(aLast)
  })

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

          {/* Folder cards — sorted by last activity */}
          <div className="space-y-2">
            {sortedLists.map((list: NoteList, idx: number) => {
              const listNotes = notes.filter((n: QuickNote) => n.list_id === list.id)
              const doneCount = listNotes.filter((n: QuickNote) => n.is_done).length
              const overdueCount = listNotes.filter((n: QuickNote) => !n.is_done && n.due_date && n.due_date < t).length
              const lastActivity = folderLastActivity(list.id, notes, list.created_at)
              const color = folderColor(idx)
              return (
                <FolderCard
                  key={list.id}
                  list={list}
                  total={listNotes.length}
                  done={doneCount}
                  overdueCount={overdueCount}
                  lastActivity={lastActivity}
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
  const activeIdx = sortedLists.findIndex((l: NoteList) => l.id === activeListId)
  const color = folderColor(activeIdx >= 0 ? activeIdx : 0)

  return (
    <div className="min-h-screen pb-28 md:pb-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-lg mx-auto px-4 pt-6">

        {/* Back + folder title */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { setActiveListId(null); setNoteInput(''); setNoteDueDate(''); setShowDatePicker(false) }}
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
        <div className="mb-4">
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-3"
            style={{
              background: 'var(--c-surface-2)',
              border: showDatePicker ? '1px solid var(--primary)' : '1px solid var(--c-border)',
            }}
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
              onClick={() => setShowDatePicker((v: boolean) => !v)}
              className="flex-shrink-0 transition-all active:scale-90"
              aria-label={isRTL ? 'הוסף תאריך יעד' : 'Set due date'}
              title={isRTL ? 'תאריך יעד' : 'Due date'}
            >
              <CalendarDays size={17} style={{ color: noteDueDate ? 'var(--primary)' : 'var(--muted-foreground)' }} />
            </button>
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

          {/* Date picker row */}
          {showDatePicker && (
            <div
              className="flex items-center gap-2 mt-2 px-4 py-2.5 rounded-xl"
              style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}
            >
              <CalendarDays size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span className="text-xs" style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}>
                {isRTL ? 'תאריך יעד:' : 'Due date:'}
              </span>
              <input
                ref={dateInputRef}
                type="date"
                value={noteDueDate}
                min={t}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNoteDueDate(e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none min-w-0"
                style={{ color: 'var(--foreground)', colorScheme: 'dark' }}
              />
              {noteDueDate && (
                <button
                  onClick={() => setNoteDueDate('')}
                  className="flex-shrink-0"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
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

        {/* ── Pending notes by date groups ── */}
        {pending.length > 0 && (
          <div className="mb-6 space-y-1">
            <NotesSection label={isRTL ? '⚠ פג תוקף' : '⚠ Overdue'} labelColor="#ef4444" notes={overdue}    isRTL={isRTL} accentColor={color} onToggle={toggleNote} onDelete={deleteNote} />
            <NotesSection label={isRTL ? 'היום'       : 'Today'}     labelColor="#f59e0b" notes={dueToday}  isRTL={isRTL} accentColor={color} onToggle={toggleNote} onDelete={deleteNote} />
            <NotesSection label={isRTL ? 'מחר'        : 'Tomorrow'}  labelColor="#3b82f6" notes={dueTomorrow} isRTL={isRTL} accentColor={color} onToggle={toggleNote} onDelete={deleteNote} />
            <NotesSection label={isRTL ? 'השבוע'      : 'This week'} labelColor="#8b5cf6" notes={dueWeek}   isRTL={isRTL} accentColor={color} onToggle={toggleNote} onDelete={deleteNote} />
            <NotesSection label={isRTL ? 'מאוחר יותר' : 'Later'}     labelColor="#10b981" notes={dueLater}  isRTL={isRTL} accentColor={color} onToggle={toggleNote} onDelete={deleteNote} />
            <NotesSection label={isRTL ? 'נוסף היום'  : 'Added today'}    labelColor="var(--muted-foreground)" notes={noDueToday}  isRTL={isRTL} accentColor={color} onToggle={toggleNote} onDelete={deleteNote} />
            <NotesSection label={isRTL ? 'השבוע'      : 'This week'}  labelColor="var(--muted-foreground)" notes={noDueWeek}   isRTL={isRTL} accentColor={color} onToggle={toggleNote} onDelete={deleteNote} />
            <NotesSection label={isRTL ? 'ישן יותר'   : 'Older'}      labelColor="var(--muted-foreground)" notes={noDueOlder}  isRTL={isRTL} accentColor={color} onToggle={toggleNote} onDelete={deleteNote} />
          </div>
        )}

        {/* Done notes */}
        {done.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'הושלמו' : 'Done'} ({done.length})
              </span>
            </div>
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

// ─── Notes section with label ─────────────────────────────────────────────
function NotesSection({
  label,
  labelColor,
  notes,
  isRTL,
  accentColor,
  onToggle,
  onDelete,
}: {
  label: string
  labelColor: string
  notes: QuickNote[]
  isRTL: boolean
  accentColor: string
  onToggle: (note: QuickNote) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}) {
  if (notes.length === 0) return null
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: labelColor }}>
          {label}
        </span>
        <div className="flex-1 h-px" style={{ background: `${labelColor}30` }} />
        <span
          className="text-[10px] rounded-full px-1.5 py-0.5 font-semibold"
          style={{ background: `${labelColor}20`, color: labelColor }}
        >
          {notes.length}
        </span>
      </div>
      <div className="space-y-2">
        {notes.map(note => (
          <NoteRow key={note.id} note={note} onToggle={onToggle} onDelete={onDelete} isRTL={isRTL} accentColor={accentColor} />
        ))}
      </div>
    </div>
  )
}

// ─── Folder card ──────────────────────────────────────────────────────────
function FolderCard({
  list,
  total,
  done,
  overdueCount,
  lastActivity,
  color,
  isRTL,
  onClick,
  onDelete,
}: {
  list: NoteList
  total: number
  done: number
  overdueCount: number
  lastActivity: string
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

      {/* Name + count + last activity */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>
            {list.name}
          </p>
          {overdueCount > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
              style={{ background: '#ef444420', color: '#ef4444' }}
            >
              {overdueCount} {isRTL ? 'פגו' : 'overdue'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {total === 0
              ? (isRTL ? 'ריק' : 'Empty')
              : isRTL ? `${done}/${total} הושלמו` : `${done}/${total} done`
            }
          </p>
          {total > 0 && (
            <>
              <span style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>·</span>
              <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                {relativeTime(lastActivity, isRTL)}
              </span>
            </>
          )}
        </div>
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
  const dColor = dueDateColor(note.due_date)

  return (
    <div
      className="group flex items-start gap-3 rounded-2xl px-4 py-3 transition-all"
      style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <button
        onClick={() => onToggle(note)}
        className="flex-shrink-0 mt-0.5 transition-transform active:scale-90"
        aria-label={note.is_done ? (isRTL ? 'בטל סימון' : 'Mark undone') : (isRTL ? 'סמן כבוצע' : 'Mark done')}
      >
        {note.is_done
          ? <CheckCircle2 size={20} style={{ color: accentColor }} />
          : <Circle size={20} strokeWidth={1.5} style={{ color: 'var(--muted-foreground)' }} />
        }
      </button>

      <div className="flex-1 min-w-0">
        <span
          className="text-sm leading-snug block"
          style={{
            color: note.is_done ? 'var(--muted-foreground)' : 'var(--foreground)',
            textDecoration: note.is_done ? 'line-through' : 'none',
          }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {note.content}
        </span>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {note.due_date && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1"
              style={{ background: `${dColor}20`, color: dColor }}
            >
              <CalendarDays size={9} />
              {formatShortDate(note.due_date, isRTL)}
            </span>
          )}
          <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
            {relativeTime(note.created_at, isRTL)}
          </span>
        </div>
      </div>

      <button
        onClick={() => onDelete(note.id)}
        className={`flex-shrink-0 mt-0.5 transition-all active:scale-90 md:opacity-0 md:group-hover:opacity-100 ${showDelete ? 'opacity-100' : 'opacity-0'}`}
        aria-label={isRTL ? 'מחק' : 'Delete'}
        style={{ color: 'var(--muted-foreground)' }}
      >
        <Trash2 size={15} strokeWidth={1.75} />
      </button>
    </div>
  )
}
