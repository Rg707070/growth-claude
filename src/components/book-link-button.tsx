'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import {
  attachLink,
  detachLink,
  fetchLinksForSource,
  type BookLinkSourceType,
} from '@/lib/book-links'

interface BookOption {
  id: string
  title: string
  color: string
}

interface LinkToBookButtonProps {
  userId: string
  sourceType: BookLinkSourceType
  sourceId: string | null
  variant?: 'icon' | 'full'
}

export function LinkToBookButton({
  userId,
  sourceType,
  sourceId,
  variant = 'icon',
}: LinkToBookButtonProps) {
  const router = useRouter()
  const { t, isRTL } = useLang()
  const [open, setOpen] = useState(false)
  const [books, setBooks] = useState<BookOption[]>([])
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set())
  const [loadingBooks, setLoadingBooks] = useState(false)

  useEffect(() => {
    if (!sourceId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear linked state when the source has no saved id yet
      setLinkedIds(new Set())
      return
    }
    const load = async () => {
      const supabase = createClient()
      const links = await fetchLinksForSource(supabase, { sourceType, sourceId })
      setLinkedIds(new Set(links.map((l) => l.book_id)))
    }
    void load()
  }, [sourceId, sourceType])

  const loadBooks = useCallback(async () => {
    setLoadingBooks(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('reading_books')
      .select('id, title, color')
      .order('created_at', { ascending: false })
    setBooks((data as BookOption[] | null) ?? [])
    setLoadingBooks(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lazily load the book list when the picker opens
    if (open) void loadBooks()
  }, [open, loadBooks])

  const toggle = async (bookId: string) => {
    if (!sourceId) return
    const isLinked = linkedIds.has(bookId)
    setLinkedIds((prev) => {
      const next = new Set(prev)
      if (isLinked) next.delete(bookId)
      else next.add(bookId)
      return next
    })
    const supabase = createClient()
    if (isLinked) {
      await detachLink(supabase, { bookId, sourceType, sourceId })
    } else {
      await attachLink(supabase, { userId, bookId, sourceType, sourceId })
    }
    router.refresh()
  }

  const disabled = !sourceId
  const linkedCount = linkedIds.size
  const active = linkedCount > 0

  const trigger =
    variant === 'full' ? (
      <button
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        title={disabled ? t('saveFirstToLink') : t('linkToBook')}
        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all disabled:opacity-30"
        style={{ background: 'var(--secondary)', color: active ? 'var(--primary)' : 'var(--muted-foreground)' }}
      >
        <BookOpen size={13} />
        {t('linkToBook')}
        {active && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {linkedCount}
          </span>
        )}
      </button>
    ) : (
      <button
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        title={disabled ? t('saveFirstToLink') : t('linkToBook')}
        className="relative p-1.5 rounded-lg transition-colors disabled:opacity-30"
        style={{ color: active ? 'var(--primary)' : 'var(--muted-foreground)' }}
      >
        <BookOpen size={14} />
        {active && (
          <span
            className="absolute -top-1 -end-1 min-w-[14px] h-[14px] px-1 flex items-center justify-center text-[9px] font-bold rounded-full leading-none"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {linkedCount}
          </span>
        )}
      </button>
    )

  return (
    <span className="relative inline-flex">
      {trigger}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-2xl p-3 md:absolute md:inset-x-auto md:bottom-auto md:top-9 md:end-0 md:w-64"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
            }}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <p
              className="text-xs font-semibold mb-2 px-1"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {t('linkToBook')}
            </p>

            {loadingBooks ? (
              <p className="text-xs px-1 py-3 text-center" style={{ color: 'var(--muted-foreground)' }}>
                …
              </p>
            ) : books.length === 0 ? (
              <div className="px-1 py-3 text-center">
                <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
                  {t('noBooksToLink')}
                </p>
                <Link
                  href="/reading"
                  className="text-xs underline"
                  style={{ color: 'var(--primary)' }}
                  onClick={() => setOpen(false)}
                >
                  {isRTL ? 'אזור הקריאה' : 'Reading'}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto">
                {books.map((book) => {
                  const isLinked = linkedIds.has(book.id)
                  return (
                    <button
                      key={book.id}
                      onClick={() => void toggle(book.id)}
                      className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-start transition-colors"
                      style={{
                        background: isLinked ? `${book.color}1a` : 'transparent',
                        color: 'var(--foreground)',
                      }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: book.color }}
                      />
                      <span className="flex-1 truncate">{book.title}</span>
                      {isLinked && <Check size={14} style={{ color: book.color }} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </span>
  )
}
