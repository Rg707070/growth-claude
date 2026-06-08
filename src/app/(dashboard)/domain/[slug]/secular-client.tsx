'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Plus, X, Check, Trash2,
  BookOpen, Lightbulb,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { useHabitReminders } from '@/hooks/use-notifications'
import { DomainHabitsTab } from '@/components/domain-habits-tab'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  createBook, updateBookStatus, deleteBook,
  createProject, updateProjectStatus, deleteProject,
} from './secular-actions'
import type { Domain, Habit } from '@/types'
import type { SecularBook, SecularProject } from '@/types/secular'

type Tab = 'habits' | 'books' | 'projects'
type BookStatus = SecularBook['status']

const BOOK_STATUSES: { value: BookStatus; he: string; en: string; color: string }[] = [
  { value: 'want', he: 'רוצה לקרוא', en: 'Want', color: '#6366f1' },
  { value: 'reading', he: 'קורא עכשיו', en: 'Reading', color: '#f59e0b' },
  { value: 'done', he: 'סיימתי', en: 'Done', color: '#10b981' },
]

interface Props {
  domain: Domain
  habits: Habit[]
  completedIds: string[]
  userId: string
  books: SecularBook[]
  projects: SecularProject[]
  schemaReady: boolean
}

export function SecularClient({
  domain, habits: initialHabits, completedIds, userId,
  books: initialBooks, projects: initialProjects, schemaReady,
}: Props) {
  const router = useRouter()
  const { isRTL } = useLang()
  const [tab, setTab] = useState<Tab>('habits')
  const [habits, setHabits] = useState(initialHabits)
  const [books, setBooks] = useState(initialBooks)
  const [projects, setProjects] = useState(initialProjects)

  useHabitReminders(habits)

  const completedSet = useMemo(() => new Set(completedIds), [completedIds])
  const color = domain.color

  const readingNow = books.filter((b) => b.status === 'reading').length

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 space-y-5 md:max-w-none md:px-0 md:pt-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl flex-shrink-0"
            style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
          >
            <ArrowRight size={20} style={{ color: 'var(--foreground)', transform: isRTL ? 'none' : 'rotate(180deg)' }} />
          </button>
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${color}22` }}
          >
            {domain.icon}
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
              {isRTL ? domain.nameHe : domain.nameEn}
            </h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {readingNow > 0
                ? (isRTL ? `קורא ${readingNow} ספרים` : `Reading ${readingNow} book${readingNow > 1 ? 's' : ''}`)
                : (isRTL ? 'ספרים ופרויקטים' : 'Books & projects')}
            </p>
          </div>
        </div>

        {!schemaReady && <SchemaBanner isRTL={isRTL} />}

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2">
          {BOOK_STATUSES.map((s) => {
            const count = books.filter((b) => b.status === s.value).length
            return (
              <div key={s.value} className="rounded-xl p-3 text-center"
                style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                <div className="text-lg font-bold" style={{ color: s.color }}>{count}</div>
                <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                  {isRTL ? s.he : s.en}
                </div>
              </div>
            )
          })}
        </div>

        {/* Tab bar */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
          {([
            ['habits', isRTL ? 'הרגלים' : 'Habits'],
            ['books', isRTL ? 'ספרים' : 'Books'],
            ['projects', isRTL ? 'פרויקטים' : 'Projects'],
          ] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className="py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: tab === key ? color : 'transparent', color: tab === key ? 'white' : 'var(--muted-foreground)' }}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'habits' && (
          <DomainHabitsTab habits={habits} completedSet={completedSet} domain={domain}
            userId={userId} onAdded={(h) => setHabits((p) => [...p, h])} isRTL={isRTL} />
        )}
        {tab === 'books' && (
          <BooksTab books={books} color={color} isRTL={isRTL}
            onAdded={(b) => setBooks((p) => [b, ...p])}
            onStatusChange={(id, status) => setBooks((p) => p.map((b) => b.id === id ? { ...b, status } : b))}
            onDeleted={(id) => setBooks((p) => p.filter((b) => b.id !== id))}
          />
        )}
        {tab === 'projects' && (
          <ProjectsTab projects={projects} color={color} isRTL={isRTL}
            onAdded={(pr) => setProjects((p) => [pr, ...p])}
            onStatusChange={(id, status) => setProjects((p) => p.map((pr) => pr.id === id ? { ...pr, status } : pr))}
            onDeleted={(id) => setProjects((p) => p.filter((pr) => pr.id !== id))}
          />
        )}

      </div>
    </div>
  )
}

// ── Shared ─────────────────────────────────────────────────────

function SchemaBanner({ isRTL }: { isRTL: boolean }) {
  return (
    <Card className="p-4" style={{ borderColor: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
      <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
        {isRTL ? 'נדרשת הרצה של מיגרציית SQL' : 'SQL migration required'}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
        {isRTL ? 'הרץ את supabase-secular-schema.sql ב-Supabase' : 'Run supabase-secular-schema.sql in Supabase SQL editor'}
      </p>
    </Card>
  )
}

// ── Books Tab ──────────────────────────────────────────────────

function BooksTab({ books, color, isRTL, onAdded, onStatusChange, onDeleted }: {
  books: SecularBook[]
  color: string
  isRTL: boolean
  onAdded: (b: SecularBook) => void
  onStatusChange: (id: string, status: BookStatus) => void
  onDeleted: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!title.trim()) return
    startTransition(async () => {
      const b = await createBook({ title: title.trim(), author: author.trim() || undefined })
      onAdded(b); setTitle(''); setAuthor(''); setAdding(false)
    })
  }

  const reading = books.filter((b) => b.status === 'reading')
  const want = books.filter((b) => b.status === 'want')
  const done = books.filter((b) => b.status === 'done')

  return (
    <div className="space-y-3">
      {books.length === 0 && !adding && (
        <div className="text-center py-10">
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'הוסף ספרים למעקב' : 'Add books to track your reading'}
          </p>
        </div>
      )}

      {reading.length > 0 && (
        <SectionLabel label={isRTL ? 'קורא עכשיו' : 'Reading now'} color="#f59e0b" />
      )}
      {reading.map((b) => (
        <BookRow key={b.id} book={b} isRTL={isRTL}
          onStatusChange={(s) => startTransition(async () => { await updateBookStatus(b.id, s); onStatusChange(b.id, s) })}
          onDelete={() => startTransition(async () => { await deleteBook(b.id); onDeleted(b.id) })}
          pending={pending}
        />
      ))}

      {want.length > 0 && (
        <SectionLabel label={isRTL ? 'רוצה לקרוא' : 'Want to read'} color="#6366f1" />
      )}
      {want.map((b) => (
        <BookRow key={b.id} book={b} isRTL={isRTL}
          onStatusChange={(s) => startTransition(async () => { await updateBookStatus(b.id, s); onStatusChange(b.id, s) })}
          onDelete={() => startTransition(async () => { await deleteBook(b.id); onDeleted(b.id) })}
          pending={pending}
        />
      ))}

      {done.length > 0 && (
        <SectionLabel label={isRTL ? 'סיימתי' : 'Finished'} color="#10b981" />
      )}
      {done.map((b) => (
        <BookRow key={b.id} book={b} isRTL={isRTL}
          onStatusChange={(s) => startTransition(async () => { await updateBookStatus(b.id, s); onStatusChange(b.id, s) })}
          onDelete={() => startTransition(async () => { await deleteBook(b.id); onDeleted(b.id) })}
          pending={pending}
        />
      ))}

      {adding ? (
        <Card className="p-4 space-y-3 mt-2">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={isRTL ? 'שם הספר' : 'Book title'}
            style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }} />
          <Input value={author} onChange={(e) => setAuthor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={isRTL ? 'מחבר (אופציונלי)' : 'Author (optional)'}
            style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }} />
          <div className="flex gap-2">
            <Button onClick={submit} disabled={pending || !title.trim()} className="flex-1"
              style={{ background: color, color: 'white' }}>
              {isRTL ? 'הוסף' : 'Add'}
            </Button>
            <button onClick={() => { setAdding(false); setTitle(''); setAuthor('') }}
              className="p-2 rounded-xl"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
              <X size={18} />
            </button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed mt-2"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
          <Plus size={18} />
          <span className="text-sm">{isRTL ? 'הוסף ספר' : 'Add Book'}</span>
        </button>
      )}
    </div>
  )
}

function BookRow({ book, isRTL, onStatusChange, onDelete, pending }: {
  book: SecularBook
  isRTL: boolean
  onStatusChange: (s: BookStatus) => void
  onDelete: () => void
  pending: boolean
}) {
  const st = BOOK_STATUSES.find((s) => s.value === book.status)!
  const nextStatus: BookStatus = book.status === 'want' ? 'reading' : book.status === 'reading' ? 'done' : 'want'

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: 'var(--card)', border: '1px solid var(--c-border)', opacity: book.status === 'done' ? 0.65 : 1 }}>
      <button onClick={() => onStatusChange(nextStatus)} disabled={pending}
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm transition-all"
        style={{ background: `${st.color}22`, color: st.color }}
        title={isRTL ? 'שנה סטטוס' : 'Change status'}>
        {book.status === 'done' ? <Check size={14} /> : book.status === 'reading' ? '📖' : '📚'}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate"
          style={{ color: 'var(--foreground)', textDecoration: book.status === 'done' ? 'line-through' : 'none' }}>
          {book.title}
        </p>
        {book.author && (
          <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{book.author}</p>
        )}
      </div>
      <span className="text-[10px] font-semibold flex-shrink-0 px-1.5 py-0.5 rounded-full"
        style={{ background: `${st.color}22`, color: st.color }}>
        {isRTL ? st.he : st.en}
      </span>
      <button onClick={onDelete} disabled={pending}
        className="p-1.5 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ── Projects Tab ───────────────────────────────────────────────

function ProjectsTab({ projects, color, isRTL, onAdded, onStatusChange, onDeleted }: {
  projects: SecularProject[]
  color: string
  isRTL: boolean
  onAdded: (p: SecularProject) => void
  onStatusChange: (id: string, status: 'active' | 'done') => void
  onDeleted: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!title.trim()) return
    startTransition(async () => {
      const p = await createProject({ title: title.trim(), description: desc.trim() || undefined })
      onAdded(p); setTitle(''); setDesc(''); setAdding(false)
    })
  }

  const active = projects.filter((p) => p.status === 'active')
  const done = projects.filter((p) => p.status === 'done')

  return (
    <div className="space-y-2">
      {projects.length === 0 && !adding && (
        <div className="text-center py-10">
          <Lightbulb size={32} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'הוסף פרויקט שאתה עובד עליו' : 'Add a project you\'re working on'}
          </p>
        </div>
      )}

      {active.map((p) => (
        <ProjectRow key={p.id} project={p} color={color} isRTL={isRTL}
          onToggle={() => startTransition(async () => { await updateProjectStatus(p.id, 'done'); onStatusChange(p.id, 'done') })}
          onDelete={() => startTransition(async () => { await deleteProject(p.id); onDeleted(p.id) })}
          pending={pending}
        />
      ))}

      {done.length > 0 && (
        <>
          <SectionLabel label={isRTL ? 'הושלמו' : 'Completed'} color="#10b981" />
          {done.map((p) => (
            <ProjectRow key={p.id} project={p} color={color} isRTL={isRTL}
              onToggle={() => startTransition(async () => { await updateProjectStatus(p.id, 'active'); onStatusChange(p.id, 'active') })}
              onDelete={() => startTransition(async () => { await deleteProject(p.id); onDeleted(p.id) })}
              pending={pending}
            />
          ))}
        </>
      )}

      {adding ? (
        <Card className="p-4 space-y-3 mt-2">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={isRTL ? 'שם הפרויקט' : 'Project name'}
            style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }} />
          <Input value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder={isRTL ? 'תיאור (אופציונלי)' : 'Description (optional)'}
            style={{ background: 'var(--c-input)', border: '1px solid var(--c-input-border)', color: 'var(--foreground)' }} />
          <div className="flex gap-2">
            <Button onClick={submit} disabled={pending || !title.trim()} className="flex-1"
              style={{ background: color, color: 'white' }}>
              {isRTL ? 'הוסף' : 'Add'}
            </Button>
            <button onClick={() => { setAdding(false); setTitle(''); setDesc('') }}
              className="p-2 rounded-xl"
              style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
              <X size={18} />
            </button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed mt-2"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
          <Plus size={18} />
          <span className="text-sm">{isRTL ? 'הוסף פרויקט' : 'Add Project'}</span>
        </button>
      )}
    </div>
  )
}

function ProjectRow({ project, color, isRTL, onToggle, onDelete, pending }: {
  project: SecularProject; color: string; isRTL: boolean
  onToggle: () => void; onDelete: () => void; pending: boolean
}) {
  const done = project.status === 'done'
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: 'var(--card)', border: '1px solid var(--c-border)', opacity: done ? 0.6 : 1 }}>
      <button onClick={onToggle} disabled={pending}
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
        style={{ background: done ? color : 'transparent', border: `2px solid ${color}` }}>
        {done && <Check size={13} color="white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate"
          style={{ color: 'var(--foreground)', textDecoration: done ? 'line-through' : 'none' }}>
          {project.title}
        </p>
        {project.description && (
          <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{project.description}</p>
        )}
      </div>
      <button onClick={onDelete} disabled={pending}
        className="p-1.5 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <p className="text-xs uppercase tracking-wider pt-2 font-semibold" style={{ color }}>
      {label}
    </p>
  )
}
