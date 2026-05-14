'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, BookOpen } from 'lucide-react'

interface CalendarItem {
  title: { he: string; en: string }
  displayValue: { he: string; en: string }
  url: string
}

export function SefariaWidget() {
  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(
      'https://www.sefaria.org/api/calendars?timezone=Asia/Jerusalem&diaspora=0&custom=ashkenaz'
    )
      .then((r) => r.json())
      .then((data) => {
        setItems((data.calendar_items ?? []).slice(0, 4))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/30 text-sm py-3">
        <BookOpen size={16} />
        <span>טוען מספריא...</span>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <a
        href="https://www.sefaria.org"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400"
      >
        <BookOpen size={16} />
        <span className="text-sm">פתח ספריא</span>
        <ExternalLink size={12} className="mr-auto" />
      </a>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-white/40 text-xs font-medium">לימוד יומי</p>
      {items.map((item, i) => (
        <a
          key={i}
          href={`https://www.sefaria.org/${item.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors group"
        >
          <div className="min-w-0">
            <p className="text-amber-400/70 text-xs">{item.title?.he}</p>
            <p className="text-white text-sm font-semibold mt-0.5 truncate">
              {item.displayValue?.he}
            </p>
          </div>
          <ExternalLink
            size={14}
            className="text-amber-400/40 group-hover:text-amber-400 transition-colors flex-shrink-0 ms-2"
          />
        </a>
      ))}
    </div>
  )
}
