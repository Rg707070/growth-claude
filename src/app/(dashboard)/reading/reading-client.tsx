'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, ChevronLeft, ChevronRight, BookOpen, Trash2, Check, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'

interface ReadingBook {
  id: string
  user_id: string
  title: string
  total_pages: number
  current_page: number
  target_date: string
  color: string
  created_at: string
}

const BOOK_COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#0ea5e9']
const MONTHS_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS_HE = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function calcPagesPerDay(book: ReadingBook): number {
  const today = new Date()
  const target = new Date(book.target_date + 'T12:00:00')
  const pagesLeft = book.total_pages - book.current_page
  if (pagesLeft <= 0) return 0
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const daysLeft = Math.ceil((startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)) + 1
  if (daysLeft <= 0) return pagesLeft
  return Math.ceil(pagesLeft / daysLeft)
}

function daysUntilTarget(book: ReadingBook): number {
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
      if (b.current_page >= b.total_pages) return false
      const target = new Date(b.target_date + 'T12:00:00')
      const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate())
      return date >= todayStart && date <= targetStart
    })
    .map((b) => ({ book: b, pages: calcPagesPerDay(b) }))
}

interface AddBookFormProps {
  userId: string
  nextColor: string
  onClose: () => void
  onSaved: () => void
  isRTL: boolean
}

function AddBookForm({ userId, nextColor, onClose, onSaved, isRTL }: AddBookFormProps) {
  const [title, setTitle] = useState('')
  const [totalPages, setTotalPages] = useState('')
  const [currentPage, setCurrentPage] = useState('0')
  const [targetDate, setTargetDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    if (!title.trim() || !totalPages || !targetDate) return
    const tp = parseInt(totalPages)
    const cp = parseInt(currentPage || '0')
    if (isNaN(tp) || tp <= 0) {
      setError(isRTL ? 'מספר עמודים לא תקין' : 'Invalid page count')
      return
    }
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from('reading_books').insert({
      user_id: userId,
      title: title.trim(),
      total_pages: tp,
      current_page: Math.max(0, Math.min(cp, tp - 1)),
      target_date: targetDate,
      color: nextColor,
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
        className="relative w-full max-w-md rounded-2xl p-5 shadow-2xl"
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
                placeholder="300"
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
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{
                  background: 'var(--c-input)',
                  border: '1px solid var(--c-input-border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>
          </div>

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
              disabled={!title.trim() || !totalPages || !targetDate || saving}
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

interface BookCardProps {
  book: ReadingBook
  isRTL: boolean
  onDeleted: () => void
  onUpdated: () => void
}

function BookCard({ book, isRTL, onDeleted, onUpdated }: BookCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [logPages, setLogPages] = useState('')
  const [logging, setLogging] = useState(false)
  const [showLog, setShowLog] = useState(false)

  const pagesPerDay = calcPagesPerDay(book)
  const daysLeft = daysUntilTarget(book)
  const pagesLeft = book.total_pages - book.current_page
  const progress = Math.min(100, (book.current_page / book.total_pages) * 100)
  const isDone = pagesLeft <= 0
  const isOverdue = daysLeft < 0 && !isDone

  const handleDelete = async () => {
    const supabase = createClient()
    await supabase.from('reading_books').delete().eq('id', book.id)
    onDeleted()
  }

  const handleLogProgress = async () => {
    const pages = parseInt(logPages)
    if (isNaN(pages) || pages <= 0) return
    setLogging(true)
    const supabase = createClient()
    const newPage = Math.min(book.total_pages, book.current_page + pages)
    await supabase
      .from('reading_books')
      .update({ current_page: newPage, updated_at: new Date().toISOString() })
      .eq('id', book.id)
    setLogging(false)
    setShowLog(false)
    setLogPages('')
    onUpdated()
  }

  return (
    <div
      className="rounded-2xl p-4 relative"
      style={{
        background: `linear-gradient(135deg, ${book.color}18, ${book.color}08)`,
        border: `1px solid ${book.color}35`,
      }}
    >
      <div
        className="absolute start-0 top-3 bottom-3 w-1 rounded-full"
        style={{ background: book.color }}
      />

      <div className="ps-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>
              {book.title}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {book.current_page} / {book.total_pages} {isRTL ? "עמ'" : 'pg'}
            </p>
          </div>

          {isDone && (
            <span
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full shrink-0"
              style={{ background: '#10b98120', color: '#10b981' }}
            >
              <Check size={12} />
              {isRTL ? 'הסתיים!' : 'Done!'}
            </span>
          )}
          {isOverdue && !isDone && (
            <span
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full shrink-0"
              style={{ background: '#f43f5e20', color: '#f43f5e' }}
            >
              <AlertCircle size={12} />
              {isRTL ? 'עבר המועד' : 'Overdue'}
            </span>
          )}
          {!isDone && !isOverdue && (
            <span
              className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
              style={{ background: `${book.color}22`, color: book.color }}
            >
              {pagesPerDay} {isRTL ? "עמ'/יום" : 'pg/day'}
            </span>
          )}
        </div>

        <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ background: 'var(--c-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: isDone ? '#10b981' : book.color }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {isDone
              ? isRTL ? 'כל הכבוד!' : 'Well done!'
              : isOverdue
              ? isRTL ? `נותרו ${pagesLeft} עמ'` : `${pagesLeft} pages left`
              : isRTL
              ? `נותרו ${daysLeft} ימים`
              : `${daysLeft} days left`}
          </span>

          <div className="flex items-center gap-1">
            {!isDone && !showLog && (
              <button
                onClick={() => setShowLog(true)}
                className="text-xs px-2.5 py-1 rounded-lg transition-all font-medium"
                style={{ background: `${book.color}25`, color: book.color }}
              >
                {isRTL ? '+ קריאה' : '+ Read'}
              </button>
            )}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg transition-all"
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
            )}
          </div>
        </div>

        {showLog && (
          <div className="flex gap-2 mt-3">
            <input
              autoFocus
              type="number"
              min="1"
              value={logPages}
              onChange={(e) => setLogPages(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogProgress()}
              placeholder={isRTL ? "עמ' שנקראו היום" : 'Pages read today'}
              className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{
                background: 'var(--c-input)',
                border: '1px solid var(--c-input-border)',
                color: 'var(--foreground)',
              }}
            />
            <button
              onClick={handleLogProgress}
              disabled={logging}
              className="px-3 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
              style={{ background: book.color }}
            >
              {logging ? '...' : isRTL ? 'שמור' : 'Log'}
            </button>
            <button
              onClick={() => { setShowLog(false); setLogPages('') }}
              className="p-2 rounded-xl"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

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
  const activeBooks = books.filter((b) => b.current_page < b.total_pages)

  const goToPrev = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  const goToNext = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

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
          <div
            key={i}
            className="text-center text-[10px] font-semibold py-1"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[3px]">
        {days.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
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
                  <div
                    className="text-[9px] text-center font-medium"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    +{booksThisDay.length - 2}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {activeBooks.length > 0 && (
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
      )}
    </div>
  )
}

interface ReadingClientProps {
  userId: string
  initialBooks: ReadingBook[]
}

export function ReadingClient({ userId, initialBooks }: ReadingClientProps) {
  const router = useRouter()
  const { isRTL } = useLang()
  const [books, setBooks] = useState<ReadingBook[]>(initialBooks)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    setBooks(initialBooks)
  }, [initialBooks])

  const refresh = () => router.refresh()
  const nextColor = BOOK_COLORS[books.length % BOOK_COLORS.length]

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
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
                {isRTL ? 'לוח קריאה' : 'Reading Planner'}
              </h1>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'חשב כמה עמודים לקרוא כל יום' : 'Calculate your daily reading goal'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95"
            style={{
              background: 'var(--brand-gradient)',
              boxShadow: '0 4px 12px var(--c-hero-shadow)',
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            {isRTL ? 'הוסף ספר' : 'Add Book'}
          </button>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--muted-foreground)' }}>
            <BookOpen size={44} className="mx-auto mb-3 opacity-25" />
            <p className="text-sm font-medium">
              {isRTL ? 'עדיין אין ספרים' : 'No books yet'}
            </p>
            <p className="text-xs mt-1 opacity-70">
              {isRTL ? 'הוסף ספר וקבל תוכנית קריאה יומית' : 'Add a book to get your daily reading plan'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {books.map((book) => (
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

        {books.length > 0 && (
          <div>
            <h2 className="font-semibold text-sm mb-3" style={{ color: 'var(--foreground)' }}>
              {isRTL ? 'לוח קריאה חודשי' : 'Monthly Reading Calendar'}
            </h2>
            <ReadingCalendar books={books} isRTL={isRTL} />
          </div>
        )}
      </div>

      {showAdd && (
        <AddBookForm
          userId={userId}
          nextColor={nextColor}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); refresh() }}
          isRTL={isRTL}
        />
      )}
    </div>
  )
}
