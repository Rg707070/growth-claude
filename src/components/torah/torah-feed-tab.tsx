'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck, Clock, User } from 'lucide-react'
import { useLang } from '@/lib/lang'

const TORAH_COLOR = '#0f766e'

interface FeedLesson {
  id: string
  title: string
  speaker: string
  duration: string
  category: string
  description: string
  categoryColor: string
}

const STATIC_FEED: FeedLesson[] = [
  {
    id: '1',
    title: 'פרשת בראשית — בריאת העולם ותפקיד האדם',
    speaker: 'הרב צוקרמן',
    duration: '45',
    category: 'פרשה',
    description: 'עיון מעמיק במשמעות הבריאה, יחס האדם לעולם ותפקידו בו',
    categoryColor: '#7c3aed',
  },
  {
    id: '2',
    title: 'הלכות שבת — מלאכות אסורות ומותרות',
    speaker: 'הרב ליבוביץ',
    duration: '32',
    category: 'הלכה',
    description: 'סיכום מעשי של ל"ט מלאכות ויישומן בחיי היומיום',
    categoryColor: '#b45309',
  },
  {
    id: '3',
    title: 'מסכת ברכות — קריאת שמע ותפילה',
    speaker: 'הרב גולדברג',
    duration: '28',
    category: 'גמרא',
    description: 'שיעור על ברכות קריאת שמע ויסודות התפילה',
    categoryColor: '#0f766e',
  },
  {
    id: '4',
    title: 'מדות האדם לפי מסילת ישרים',
    speaker: 'הרב כהן',
    duration: '38',
    category: 'מחשבה',
    description: 'עיון בפרק הזהירות — כיצד אדם זוכה לזהירות ומה מעכב אותה',
    categoryColor: '#0369a1',
  },
  {
    id: '5',
    title: 'תנ"ך — ספר בראשית עם פירוש רש"י',
    speaker: 'הרב אברהם',
    duration: '22',
    category: 'תנ"ך',
    description: 'לימוד הפרשיות הראשונות עם פירוש רש"י המבואר',
    categoryColor: '#15803d',
  },
  {
    id: '6',
    title: 'אמונה ובטחון — שיטת הרמב"ן',
    speaker: 'הרב פרידמן',
    duration: '41',
    category: 'מחשבה',
    description: 'הגדרת הבטחון לשיטת הרמב"ן ויישומה המעשי',
    categoryColor: '#0369a1',
  },
  {
    id: '7',
    title: 'הלכות תפילה — זמנים ומנהגים',
    speaker: 'הרב שטיינברג',
    duration: '19',
    category: 'הלכה',
    description: 'זמני התפילות, תפילת שחרית, מנחה וערבית',
    categoryColor: '#b45309',
  },
  {
    id: '8',
    title: 'משנה סדר מועד — מסכת שבת',
    speaker: 'הרב וינברג',
    duration: '25',
    category: 'משנה',
    description: 'לימוד המשנה עם הסבר מפורט לכל הלכה',
    categoryColor: '#be185d',
  },
]

const ALL_CATEGORIES = ['הכל', ...Array.from(new Set(STATIC_FEED.map((l) => l.category)))]

export function TorahFeedTab({ userId }: { userId: string }) {
  const { t } = useLang()
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [activeCategory, setActiveCategory] = useState('הכל')

  const filtered =
    activeCategory === 'הכל'
      ? STATIC_FEED
      : STATIC_FEED.filter((l) => l.category === activeCategory)

  function toggleSave(id: string) {
    setSaved((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="pb-4">
      {/* Category filter */}
      <div className="flex overflow-x-auto scrollbar-hide px-4 py-3 gap-2">
        {ALL_CATEGORIES.map((cat) => (
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
            isSaved={saved.has(lesson.id)}
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
  onToggleSave,
}: {
  lesson: FeedLesson
  isSaved: boolean
  onToggleSave: () => void
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <button
          onClick={onToggleSave}
          className="mt-0.5 transition-opacity hover:opacity-70 shrink-0"
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
            style={{ background: `${lesson.categoryColor}20`, color: lesson.categoryColor }}
          >
            {lesson.category}
          </span>
          <h3 className="text-sm font-semibold text-white/90 leading-snug mb-1">
            {lesson.title}
          </h3>
          <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{lesson.description}</p>
        </div>
      </div>

      {/* Bottom row */}
      <div
        className="flex items-center justify-end gap-3 pt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-1 text-white/30">
          <Clock size={12} />
          <span className="text-xs">{lesson.duration} דק'</span>
        </div>
        <div className="flex items-center gap-1 text-white/30">
          <User size={12} />
          <span className="text-xs">{lesson.speaker}</span>
        </div>
      </div>
    </div>
  )
}
