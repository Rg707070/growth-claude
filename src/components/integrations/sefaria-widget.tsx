'use client'

import { useEffect, useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react'

interface CalendarItem {
  title: { he: string; en: string }
  displayValue: { he: string; en: string }
  url: string
}

interface SefariaText {
  he: string | string[] | string[][]
  ref: string
  heTitle: string
}

function flattenText(text: string | string[] | string[][]): string[] {
  if (!text) return []
  if (typeof text === 'string') return [text]
  return (text as (string | string[])[]).flatMap((v) =>
    Array.isArray(v) ? v : [v]
  )
}

function SefariaItem({ item }: { item: CalendarItem }) {
  const [open, setOpen] = useState(false)
  const [verses, setVerses] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  const toggle = async () => {
    if (!open && !fetched) {
      setLoading(true)
      try {
        const r = await fetch(
          `https://www.sefaria.org/api/texts/${encodeURIComponent(item.url)}?context=0&pad=0`
        )
        const data: SefariaText = await r.json()
        setVerses(flattenText(data.he).filter(Boolean).slice(0, 10))
      } catch {
        setVerses([])
      }
      setFetched(true)
      setLoading(false)
    }
    setOpen((o) => !o)
  }

  return (
    <div className="rounded-xl border border-amber-500/20 overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-3 bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-right"
      >
        <div className="min-w-0 flex-1">
          <p className="text-amber-400/70 text-xs">{item.title?.he}</p>
          <p className="text-white text-sm font-semibold mt-0.5 truncate">
            {item.displayValue?.he}
          </p>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-amber-400/60 flex-shrink-0 ms-2" />
        ) : (
          <ChevronDown size={14} className="text-amber-400/60 flex-shrink-0 ms-2" />
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-2 bg-amber-500/5 border-t border-amber-500/10">
          {loading ? (
            <p className="text-white/30 text-xs py-2">טוען...</p>
          ) : verses.length > 0 ? (
            <div
              className="space-y-1.5 text-right"
              dir="rtl"
            >
              {verses.map((v, i) => (
                <p
                  key={i}
                  className="text-white/80 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: v }}
                />
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-xs py-2">לא נמצא טקסט</p>
          )}
        </div>
      )}
    </div>
  )
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
      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
        <BookOpen size={16} />
        <span className="text-sm">לא נמצאו לימודים להיום</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-white/40 text-xs font-medium">לימוד יומי</p>
      {items.map((item, i) => (
        <SefariaItem key={i} item={item} />
      ))}
    </div>
  )
}
