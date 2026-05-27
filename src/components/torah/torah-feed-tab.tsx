'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck, Clock, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { TorahLesson } from '@/types'

const TORAH_COLOR = '#0f766e'

interface Props {
  userId: string
  lessons: TorahLesson[]
  savedLessonIds: string[]
  onSavedChange: (ids: string[]) => void
}

export function TorahFeedTab({ userId, lessons, savedLessonIds, onSavedChange }: Props) {
  const supabase = createClient()
  const [activeCategory, setActiveCategory] = useState('הכל')
  const [pending, setPending] = useState<string | null>(null)

  const categories = ['הכל', ...Array.from(new Set(lessons.map((l) => l.category)))]

  const filtered =
    activeCategory === 'הכל' ? lessons : lessons.filter((l) => l.category === activeCategory)

  async function toggleSave(lessonId: string) {
    if (pending) return
    setPending(lessonId)
    const isSaved = savedLessonIds.includes(lessonId)

    if (isSaved) {
      await supabase
        .from('saved_lessons')
        .delete()
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
      onSavedChange(savedLessonIds.filter((id) => id !== lessonId))
    } else {
      await supabase.from('saved_lessons').insert({ user_id: userId, lesson_id: lessonId })
      onSavedChange([...savedLessonIds, lessonId])
    }
    setPending(null)
  }

  if (lessons.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-white/25 text-sm">אין שיעורים זמינים כרגע</p>
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Category filter */}
      <div className="flex overflow-x-auto scrollbar-hide px-4 py-3 gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0"
            style={
              activeCategory === cat
                ? { background: TORAH_COLOR, color: '#fff' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)' }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {filtered.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            isSaved={savedLessonIds.includes(lesson.id)}
            isPending={pending === lesson.id}
            onToggleSave={() => toggleSave(lesson.id)}
          />
        ))}
      </div>
    </div>
  )
}

function LessonCard({
  lesson,
  isSaved,
  isPending,
  onToggleSave,
}: {
  lesson: TorahLesson
  isSaved: boolean
  isPending: boolean
  onToggleSave: () => void
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <button
          onClick={onToggleSave}
          disabled={isPending}
          className="mt-0.5 transition-opacity hover:opacity-70 disabled:opacity-40 shrink-0"
        >
          {isSaved ? (
            <BookmarkCheck size={18} style={{ color: TORAH_COLOR }} />
          ) : (
            <Bookmark size={18} className="text-white/25" />
          )}
        </button>
        <div className="flex-1 text-right">
          <span
            className="inline-block text-xs px-2 py-0.5 rounded-full mb-2"
            style={{
              background: `${lesson.category_color}20`,
              color: lesson.category_color,
            }}
          >
            {lesson.category}
          </span>
          <h3 className="text-sm font-semibold text-white/90 leading-snug mb-1">
            {lesson.title}
          </h3>
          {lesson.description && (
            <p className="text-xs text-white/40 leading-relaxed line-clamp-2">
              {lesson.description}
            </p>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div
        className="flex items-center justify-end gap-3 pt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-1 text-white/30">
          <Clock size={12} />
          <span className="text-xs">{lesson.duration_minutes} דק&apos;</span>
        </div>
        <div className="flex items-center gap-1 text-white/30">
          <User size={12} />
          <span className="text-xs">{lesson.speaker}</span>
        </div>
      </div>
    </div>
  )
}
