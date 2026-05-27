'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, X, ChevronLeft, ChevronRight, BookOpen, Trash2,
  Check, AlertCircle, FileText, CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'

interface ReadingBook {
  id: string
  user_id: string
  title: string
  total_pages: number | null
  current_page: number
  total_chapters: number | null
  current_chapter: number
  target_date: string | null
  color: string
  notes: string
  completed: boolean
  created_at: string
}

const BOOK_COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#0ea5e9']
const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS_HE = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function calcPagesPerDay(book: ReadingBook): number {
  if (!book.total_pages || !book.target_date) return 0
  const pagesLeft = book.total_pages - book.current_page
  if (pagesLeft <= 0) return 0
  const today = new Date()
  const target = new Date(book.target_date + 'T12:00:00')
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const daysLeft = Math.ceil((startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)) + 1
  if (daysLeft <= 0) return pagesLeft
  return Math.ceil(pagesLeft / daysLeft)
}

function daysUntilTarget(book: ReadingBook): number | null {
  if (!book.target_date) return null
  const today = new Date()
  const target = new Date(book.target_date + 'T12:00:00')
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.ceil((startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24))
}

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function booksForDay(
  books: ReadingBook[],
  year: number,
  month: number,
  day: number
): { book: ReadingBook; pages: number }[] {
  const date = new Date(year, month, day)
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return books
    .filter((b) => {
      if (!b.total_pages || !b.target_date) return false
      if (b.current_page >= b.total_pages) return false
      const target = new Date(b.target_date + 'T12:00:00')
      const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate())
      return date >= todayStart && date <= targetStart
    })
    .map((b) => ({ book: b, pages: calcPagesPerDay(b) }))
}

// ─── Add Book Form ───────────────────────────────────────────────────────────

interface AddBookFormProps {
  userId: string
  nextColor: string
  defaultCompleted: boolean
  onClose: () => void
  onSaved: () => void
  isRTL: boolean
}

function AddBookForm({ userId, nextColor, defaultCompleted, onClose, onSaved, isRTL }: AddBookFormProps) {
  const [title, setTitle] = useState('')
  const [totalPages, setTotalPages] = useState('')
  const [currentPage, setCurrentPage] = useState('0')
  const [totalChapters, setTotalChapters] = useState('')
  const [currentChapter, setCurrentChapter] = useState('0')
  const [targetDate, setTargetDate] = useState('')
  const [notes, setNotes] = useState('')
  const [completed, setCompleted] = useState(defaultCompleted)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!title.trim()) return
    const tp = totalPages ? parseInt(totalPages) : null
    const cp = tp ? Math.max(0, Math.min(parseInt(currentPage || '0'), tp - 1)) : 0
    const tc = totalChapters ? parseInt(totalChapters) : null
    const cc = tc ? Math.max(0, Math.min(parseInt(currentChapter || '0'), tc - 1)) : 0

    if (tp !== null && (isNaN(tp) || tp <= 0)) {
      setError(isRTL ? 'מספר עמודים לא תקין' : 'Invalid page count')
      return
    }
    if (tc !== null && (isNaN(tc) || tc <= 0)) {
      setError(isRTL ? 'מספר פרקים לא תקין' : 'Invalid chapter count')
      return
    }

    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from('reading_books').insert({
      user_id: userId,
      title: title.trim(),
      total_pages: tp,
      current_page: cp,
      total_chapters: tc,
      current_chapter: cc,
      target_date: targetDate || null,
      color: nextColor,
      notes: notes.trim(),
      completed,
    })
    setSaving(false)
    if (err) {
      setError(isRTL ? 'שגיאה בשמירה' : 'Save failed')
      return
    }
    onSaved()
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl p-5 shadow-2xl overflow-y-auto max-h-[90vh]"
        style={{ background: 'var(--c-fab-sheet)', border: '1px solid var(--c-border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
            {isRTL ? 'הוסף ספר' : 'Add Book'}
          </span>
          <button onClick={onClose} style={{ color: 'var(--muted-foreground)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isRTL ? 'שם הספר...' : 'Book title...'}
            className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
            style={{
              background: 'var(--c-input)',
              border: '1px solid var(--c-input-border)',
              color: 'var(--foreground)',
            }}
            dir={isRTL ? 'rtl' : 'ltr'}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'סה"כ עמודים' : 'Total pages'}
              </label>
              <input
                type="number"
                min="1"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                placeholder={isRTL ? 'לא חובה' : 'Optional'}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{
                  background: 'var(--c-input)',
                  border: '1px solid var(--c-input-border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'עמוד נוכחי' : 'Current page'}
              </label>
              <input
                type="number"
                min="0"
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
                placeholder="0"
                disabled={!totalPages}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none disabled:opacity-40"
                style={{
                  background: 'var(--c-input)',
                  border: '1px solid var(--c-input-border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'סה"כ פרקים' : 'Total chapters'}
              </label>
              <input
                type="number"
                min="1"
                value={totalChapters}
                onChange={(e) => setTotalChapters(e.target.value)}
                placeholder={isRTL ? 'לא חובה' : 'Optional'}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{
                  background: 'var(--c-input)',
                  border: '1px solid var(--c-input-border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'פרק נוכחי' : 'Current chapter'}
              </label>
              <input
                type="number"
                min="0"
                value={currentChapter}
                onChange={(e) => setCurrentChapter(e.target.value)}
                placeholder="0"
                disabled={!totalChapters}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none disabled:opacity-40"
                style={{
                  background: 'var(--c-input)',
                  border: '1px solid var(--c-input-border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>
          </div>

          {!completed && (
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'תאריך סיום יעד' : 'Target completion date'}
              </label>
              <input
                type="date"
                min={minDate}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{
                  background: 'var(--c-input)',
                  border: '1px solid var(--c-input-border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>
          )}

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'הערות' : 'Notes'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isRTL ? 'מחשבות, תובנות, ציטוטים...' : 'Thoughts, insights, quotes...'}
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
              style={{
                background: 'var(--c-input)',
                border: '1px solid var(--c-input-border)',
                color: 'var(--foreground)',
              }}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setCompleted((v) => !v)}
              className="w-10 h-6 rounded-full transition-colors relative shrink-0"
              style={{ background: completed ? '#10b981' : 'var(--c-border)' }}
            >
              <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                style={{ transform: completed ? 'translateX(18px)' : 'translateX(2px)' }}
              />
            </div>
            <span className="text-sm" style={{ color: 'var(--foreground)' }}>
              {isRTL ? 'כבר קראתי את הספר' : 'I already read this book'}
            </span>
          </label>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}
            >
              {isRTL ? 'ביטול' : 'Cancel'}
            </button>
            <button
              onClick={save}
              disabled={!title.trim() || saving}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50"
              style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 12px var(--c-hero-shadow)' }}
            >
              {saving ? '...' : isRTL ? 'שמור' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Book Card ───────────────────────────────────────────────────────────────

interface BookCardProps {
  book: ReadingBook
  isRTL: boolean
  onDeleted: () => void
  onUpdated: () => void
}

function BookCard({ book, isRTL, onDeleted, onUpdated }: BookCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [logPages, setLogPages] = useState('')
  const [logChapters, setLogChapters] = useState('')
  const [logging, setLogging] = useState(false)
  const [showLogPages, setShowLogPages] = useState(false)
  const [showLogChapters, setShowLogChapters] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(book.notes)
  const [savingNotes, setSavingNotes] = useState(false)
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasPages = book.total_pages !== null && book.total_pages > 0
  const hasChapters = book.total_chapters !== null && book.total_chapters > 0
  const pagesLeft = hasPages ? book.total_pages! - book.current_page : null
  const chaptersLeft = hasChapters ? book.total_chapters! - book.current_chapter : null
  const pageProgress = hasPages ? Math.min(100, (book.current_page / book.total_pages!) * 100) : null
  const chapterProgress = hasChapters ? Math.min(100, (book.current_chapter / book.total_chapters!) * 100) : null
  const isPagesComplete = hasPages && pagesLeft! <= 0
  const isChaptersComplete = hasChapters && chaptersLeft! <= 0
  const pagesPerDay = hasPages ? calcPagesPerDay(book) : 0
  const daysLeft = daysUntilTarget(book)
  const isOverdue = daysLeft !== null && daysLeft < 0 && !isPagesComplete && !isChaptersComplete

  const handleDelete = async () => {
    const supabase = createClient()
    await supabase.from('reading_books').delete().eq('id', book.id)
    onDeleted()
  }

  const handleLogPages = async () => {
    const pages = parseInt(logPages)
    if (isNaN(pages) || pages <= 0 || !hasPages) return
    setLogging(true)
    const supabase = createClient()
    const newPage = Math.min(book.total_pages!, book.current_page + pages)
    await supabase
      .from('reading_books')
      .update({ current_page: newPage, updated_at: new Date().toISOString() })
      .eq('id', book.id)
    setLogging(false)
    setShowLogPages(false)
    setLogPages('')
    onUpdated()
  }

  const handleLogChapters = async () => {
    const chapters = parseInt(logChapters)
    if (isNaN(chapters) || chapters <= 0 || !hasChapters) return
    setLogging(true)
    const supabase = createClient()
    const newChapter = Math.min(book.total_chapters!, book.current_chapter + chapters)
    await supabase
      .from('reading_books')
      .update({ current_chapter: newChapter, updated_at: new Date().toISOString() })
      .eq('id', book.id)
    setLogging(false)
    setShowLogChapters(false)
    setLogChapters('')
    onUpdated()
  }

  const handleMarkComplete = async () => {
    const supabase = createClient()
    await supabase
      .from('reading_books')
      .update({ completed: true, updated_at: new Date().toISOString() })
      .eq('id', book.id)
    onUpdated()
  }

  const handleNotesChange = useCallback(
    (value: string) => {
      setNotesValue(value)
      if (notesTimer.current) clearTimeout(notesTimer.current)
      notesTimer.current = setTimeout(async () => {
        setSavingNotes(true)
        const supabase = createClient()
        await supabase
          .from('reading_books')
          .update({ notes: value, updated_at: new Date().toISOString() })
          .eq('id', book.id)
        setSavingNotes(false)
      }, 800)
    },
    [book.id]
  )

  useEffect(() => {
    return () => {
      if (notesTimer.current) clearTimeout(notesTimer.current)
    }
  }, [])

  const deleteControls = !confirmDelete ? (
    <button
      onClick={() => setConfirmDelete(true)}
      className="p-1.5 rounded-lg"
      style={{ color: 'var(--muted-foreground)' }}
    >
      <Trash2 size={14} />
    </button>
  ) : (
    <div className="flex gap-1">
      <button
        onClick={handleDelete}
        className="text-xs px-2 py-1 rounded-lg"
        style={{ background: '#f43f5e20', color: '#f43f5e' }}
      >
        {isRTL ? 'מחק' : 'Del'}
      </button>
      <button
        onClick={() => setConfirmDelete(false)}
        className="text-xs px-2 py-1 rounded-lg"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {isRTL ? 'בטל' : 'No'}
      </button>
    </div>
  )

  return (
    <div
      className="rounded-2xl p-4 relative"
      style={{
        background: `linear-gradient(135deg, ${book.color}18, ${book.color}08)`,
        border: `1px solid ${book.color}35`,
      }}
    >
      <div className="absolute start-0 top-3 bottom-3 w-1 rounded-full" style={{ background: book.color }} />

      <div className="ps-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>
              {book.title}
            </h3>
            {(hasPages || hasChapters) && !book.completed && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {hasPages && `${book.current_page}/${book.total_pages} ${isRTL ? "עמ'" : 'pg'}`}
                {hasPages && hasChapters && ' · '}
                {hasChapters && `${book.current_chapter}/${book.total_chapters} ${isRTL ? 'פרקים' : 'ch'}`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {book.completed && (
              <span
                className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                style={{ background: '#10b98120', color: '#10b981' }}
              >
                <Check size={12} />
                {isRTL ? 'נקרא' : 'Read'}
              </span>
            )}
            {!book.completed && isOverdue && (
              <span
                className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                style={{ background: '#f43f5e20', color: '#f43f5e' }}
              >
                <AlertCircle size={12} />
                {isRTL ? 'עבר המועד' : 'Overdue'}
              </span>
            )}
            {!book.completed && !isOverdue && pagesPerDay > 0 && (
              <span
                className="text-xs font-bold px-2 py-1 rounded-full"
                style={{ background: `${book.color}22`, color: book.color }}
              >
                {pagesPerDay} {isRTL ? "עמ'/יום" : 'pg/d'}
              </span>
            )}
          </div>
        </div>

        {/* Progress bars */}
        {hasPages && !book.completed && (
          <div className="mb-2">
            <div className="flex justify-between text-[10px] mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
              <span>{isRTL ? 'עמודים' : 'Pages'}</span>
              <span>{Math.round(pageProgress!)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-border)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pageProgress}%`, background: isPagesComplete ? '#10b981' : book.color }}
              />
            </div>
          </div>
        )}

        {hasChapters && !book.completed && (
          <div className="mb-2">
            <div className="flex justify-between text-[10px] mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
              <span>{isRTL ? 'פרקים' : 'Chapters'}</span>
              <span>{Math.round(chapterProgress!)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-border)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${chapterProgress}%`, background: isChaptersComplete ? '#10b981' : book.color }}
              />
            </div>
          </div>
        )}

        {/* Action row (active books) */}
        {!book.completed && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {daysLeft !== null
                ? isOverdue
                  ? isRTL
                    ? pagesLeft ? `נותרו ${pagesLeft} עמ'` : ''
                    : pagesLeft ? `${pagesLeft} pages left` : ''
                  : isRTL ? `נותרו ${daysLeft} ימים` : `${daysLeft} days left`
                : ''}
            </span>

            <div className="flex items-center gap-1">
              {hasPages && !showLogPages && !showLogChapters && (
                <button
                  onClick={() => setShowLogPages(true)}
                  className="text-xs px-2 py-1 rounded-lg font-medium"
                  style={{ background: `${book.color}25`, color: book.color }}
                >
                  {isRTL ? '+ עמ׳' : '+ pg'}
                </button>
              )}
              {hasChapters && !showLogChapters && !showLogPages && (
                <button
                  onClick={() => setShowLogChapters(true)}
                  className="text-xs px-2 py-1 rounded-lg font-medium"
                  style={{ background: `${book.color}25`, color: book.color }}
                >
                  {isRTL ? '+ פרק' : '+ ch'}
                </button>
              )}
              <button
                onClick={() => setShowNotes((v) => !v)}
                className="p-1.5 rounded-lg"
                style={{ color: showNotes ? book.color : 'var(--muted-foreground)' }}
              >
                <FileText size={14} />
              </button>
              <button
                onClick={handleMarkComplete}
                className="p-1.5 rounded-lg"
                style={{ color: 'var(--muted-foreground)' }}
                title={isRTL ? 'סמן כנקרא' : 'Mark as read'}
              >
                <CheckCircle2 size={14} />
              </button>
              {deleteControls}
            </div>
          </div>
        )}

        {/* Action row (completed books) */}
        {book.completed && (
          <div className="flex justify-end items-center gap-1 mt-2">
            <button
              onClick={() => setShowNotes((v) => !v)}
              className="p-1.5 rounded-lg"
              style={{ color: showNotes ? book.color : 'var(--muted-foreground)' }}
            >
              <FileText size={14} />
            </button>
            {deleteControls}
          </div>
        )}

        {/* Log pages inline input */}
        {showLogPages && (
          <div className="flex gap-2 mt-3">
            <input
              autoFocus
              type="number"
              min="1"
              value={logPages}
              onChange={(e) => setLogPages(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogPages()}
              placeholder={isRTL ? "עמ' שנקראו" : 'Pages read'}
              className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{
                background: 'var(--c-input)',
                border: '1px solid var(--c-input-border)',
                color: 'var(--foreground)',
              }}
            />
            <button
              onClick={handleLogPages}
              disabled={logging}
              className="px-3 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
              style={{ background: book.color }}
            >
              {logging ? '...' : isRTL ? 'שמור' : 'Log'}
            </button>
            <button
              onClick={() => { setShowLogPages(false); setLogPages('') }}
              className="p-2 rounded-xl"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Log chapters inline input */}
        {showLogChapters && (
          <div className="flex gap-2 mt-3">
            <input
              autoFocus
              type="number"
              min="1"
              value={logChapters}
              onChange={(e) => setLogChapters(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogChapters()}
              placeholder={isRTL ? 'פרקים שנקראו' : 'Chapters read'}
              className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{
                background: 'var(--c-input)',
                border: '1px solid var(--c-input-border)',
                color: 'var(--foreground)',
              }}
            />
            <button
              onClick={handleLogChapters}
              disabled={logging}
              className="px-3 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
              style={{ background: book.color }}
            >
              {logging ? '...' : isRTL ? 'שמור' : 'Log'}
            </button>
            <button
              onClick={() => { setShowLogChapters(false); setLogChapters('') }}
              className="p-2 rounded-xl"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Inline notes */}
        {showNotes && (
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${book.color}30` }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'הערות' : 'Notes'}
              </span>
              {savingNotes && (
                <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                  {isRTL ? 'שומר...' : 'Saving...'}
                </span>
              )}
            </div>
            <textarea
              value={notesValue}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder={isRTL ? 'הערות, תובנות, ציטוטים...' : 'Notes, insights, quotes...'}
              rows={4}
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none"
              style={{
                background: 'var(--c-input)',
                border: `1px solid ${book.color}30`,
                color: 'var(--foreground)',
              }}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Reading Calendar ────────────────────────────────────────────────────────

interface ReadingCalendarProps {
  books: ReadingBook[]
  isRTL: boolean
}

function ReadingCalendar({ books, isRTL }: ReadingCalendarProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const days = getCalendarDays(year, month)
  const dayHeaders = isRTL ? DAYS_HE : DAYS_EN
  const monthName = isRTL ? MONTHS_HE[month] : MONTHS_EN[month]
  const activeBooks = books.filter((b) => !b.completed && b.total_pages && b.current_page < b.total_pages)

  const goToPrev = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1)
  }
  const goToNext = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1)
  }

  if (activeBooks.length === 0) return null

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={isRTL ? goToNext : goToPrev}
          className="p-2 rounded-xl transition-all"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
          {monthName} {year}
        </span>
        <button
          onClick={isRTL ? goToPrev : goToNext}
          className="p-2 rounded-xl transition-all"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {dayHeaders.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold py-1" style={{ color: 'var(--muted-foreground)' }}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[3px]">
        {days.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const dateObj = new Date(year, month, day)
          const todayObj = new Date(today.getFullYear(), today.getMonth(), today.getDate())
          const isPast = dateObj < todayObj
          const booksThisDay = booksForDay(activeBooks, year, month, day)

          return (
            <div
              key={day}
              className="rounded-xl p-1 min-h-[52px] flex flex-col"
              style={{
                background: isToday ? 'var(--c-primary-glow)' : 'transparent',
                border: isToday ? '1px solid var(--primary)' : '1px solid transparent',
                opacity: isPast ? 0.4 : 1,
              }}
            >
              <span
                className="text-[11px] font-semibold text-center block"
                style={{ color: isToday ? 'var(--primary)' : 'var(--foreground)' }}
              >
                {day}
              </span>
              <div className="flex flex-col gap-[2px] mt-0.5">
                {booksThisDay.slice(0, 2).map(({ book, pages }) => (
                  <div
                    key={book.id}
                    className="rounded text-[9px] font-bold text-center px-0.5 leading-tight py-[1px]"
                    style={{ background: `${book.color}30`, color: book.color }}
                    title={`${book.title}: ${pages} ${isRTL ? "עמ'" : 'pg'}`}
                  >
                    {pages}{isRTL ? 'ע' : 'p'}
                  </div>
                ))}
                {booksThisDay.length > 2 && (
                  <div className="text-[9px] text-center font-medium" style={{ color: 'var(--muted-foreground)' }}>
                    +{booksThisDay.length - 2}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 flex flex-wrap gap-3" style={{ borderTop: '1px solid var(--c-border)' }}>
        {activeBooks.map((b) => (
          <div key={b.id} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: b.color }} />
            <span className="text-[11px] truncate max-w-[100px]" style={{ color: 'var(--muted-foreground)' }}>
              {b.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

type Tab = 'want_to_read' | 'have_read'

interface ReadingClientProps {
  userId: string
  initialBooks: ReadingBook[]
}

export function ReadingClient({ userId, initialBooks }: ReadingClientProps) {
  const router = useRouter()
  const { isRTL } = useLang()
  const [books, setBooks] = useState<ReadingBook[]>(initialBooks)
  const [showAdd, setShowAdd] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('want_to_read')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync local state with server-fetched prop after router.refresh
    setBooks(initialBooks)
  }, [initialBooks])

  const refresh = () => router.refresh()
  const nextColor = BOOK_COLORS[books.length % BOOK_COLORS.length]

  const wantToReadBooks = books.filter((b) => !b.completed)
  const haveReadBooks = books.filter((b) => b.completed)
  const displayBooks = activeTab === 'want_to_read' ? wantToReadBooks : haveReadBooks

  const tabs: { id: Tab; labelHe: string; labelEn: string }[] = [
    { id: 'want_to_read', labelHe: 'רוצה לקרוא', labelEn: 'Want to Read' },
    { id: 'have_read', labelHe: 'קראתי', labelEn: "I've Read" },
  ]

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--c-primary-glow)', color: 'var(--primary)' }}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                {isRTL ? 'ספרים' : 'Books'}
              </h1>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'עקוב אחר הקריאה שלך' : 'Track your reading'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95"
            style={{ background: 'var(--brand-gradient)', boxShadow: '0 4px 12px var(--c-hero-shadow)' }}
          >
            <Plus size={16} strokeWidth={2.5} />
            {isRTL ? 'הוסף' : 'Add'}
          </button>
        </div>

        {/* Tabs */}
        <div
          className="grid grid-cols-2 rounded-xl p-1 gap-1"
          style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const count = tab.id === 'want_to_read' ? wantToReadBooks.length : haveReadBooks.length
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: isActive ? 'var(--c-fab-sheet)' : 'transparent',
                  color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                }}
              >
                {isRTL ? tab.labelHe : tab.labelEn}
                {count > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                    style={{
                      background: isActive ? 'var(--primary)' : 'var(--c-border)',
                      color: isActive ? 'oklch(0.08 0.035 240)' : 'var(--muted-foreground)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Book list */}
        {displayBooks.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--muted-foreground)' }}>
            <BookOpen size={44} className="mx-auto mb-3 opacity-25" />
            <p className="text-sm font-medium">
              {activeTab === 'want_to_read'
                ? isRTL ? 'אין ספרים ברשימת הקריאה' : 'No books in your reading list'
                : isRTL ? 'עדיין לא סיימת ספרים' : 'No books finished yet'}
            </p>
            <p className="text-xs mt-1 opacity-70">
              {activeTab === 'want_to_read'
                ? isRTL ? 'הוסף ספרים שאתה רוצה לקרוא' : 'Add books you want to read'
                : isRTL ? 'סמן ספרים שסיימת לקרוא' : 'Mark books as read when finished'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                isRTL={isRTL}
                onDeleted={refresh}
                onUpdated={refresh}
              />
            ))}
          </div>
        )}

        {/* Calendar — only on the want-to-read tab */}
        {activeTab === 'want_to_read' && wantToReadBooks.length > 0 && (
          <div>
            <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--foreground)' }}>
              {isRTL ? 'לוח קריאה חודשי' : 'Monthly Reading Calendar'}
            </h2>
            <ReadingCalendar books={wantToReadBooks} isRTL={isRTL} />
          </div>
        )}
      </div>

      {showAdd && (
        <AddBookForm
          userId={userId}
          nextColor={nextColor}
          defaultCompleted={activeTab === 'have_read'}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); refresh() }}
          isRTL={isRTL}
        />
      )}
    </div>
  )
}
