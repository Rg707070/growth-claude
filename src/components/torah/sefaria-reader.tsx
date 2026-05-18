'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronRight, ChevronLeft, X, BookOpen } from 'lucide-react'

const TORAH_COLOR = '#0f766e'

interface TextData {
  heTitle: string
  ref: string
  verses: string[]
  next: string | null
  prev: string | null
}

function flattenHe(text: unknown): string[] {
  if (!text) return []
  if (typeof text === 'string') return [text]
  if (Array.isArray(text)) return text.flatMap((v) => flattenHe(v))
  return []
}

interface Props {
  initialRef: string
  onClose: () => void
  onStartSession: (ref: string) => void
}

export function SefariaReader({ initialRef, onClose, onStartSession }: Props) {
  const [currentRef, setCurrentRef] = useState(initialRef)
  const [data, setData] = useState<TextData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    load(currentRef)
  }, [currentRef])

  async function load(ref: string) {
    setLoading(true)
    setError(false)
    setData(null)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    try {
      const r = await fetch(
        `https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&pad=0`
      )
      const json = await r.json()
      const verses = flattenHe(json.he).filter(Boolean)
      setData({
        heTitle: json.heTitle ?? ref,
        ref: json.ref ?? ref,
        verses,
        next: json.next ?? null,
        prev: json.prev ?? null,
      })
    } catch {
      setError(true)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col" style={{ minHeight: '70vh' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{ background: 'oklch(0.08 0.035 240)', borderBottom: '1px solid rgba(245,158,11,0.15)' }}
      >
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/70 transition-colors"
        >
          <X size={18} />
        </button>
        <div className="text-right">
          {data ? (
            <>
              <p className="text-white font-semibold text-sm leading-tight">{data.heTitle}</p>
              <p className="text-amber-400/50 text-xs mt-0.5">{data.ref}</p>
            </>
          ) : (
            <p className="text-white/40 text-sm">{currentRef}</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5" dir="rtl">
        {loading && (
          <div className="flex items-center justify-center py-16 gap-2 text-white/30">
            <BookOpen size={18} />
            <span className="text-sm">טוען...</span>
          </div>
        )}
        {error && (
          <p className="text-white/30 text-sm text-center py-16">לא נמצא טקסט — בדוק את המראה מקום</p>
        )}
        {data && !loading && (
          <div className="space-y-3">
            {data.verses.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">אין טקסט זמין</p>
            ) : (
              data.verses.map((v, i) => (
                <p
                  key={i}
                  className="text-white/88 leading-loose"
                  style={{ fontSize: '1.05rem', lineHeight: '2rem' }}
                  dangerouslySetInnerHTML={{ __html: v }}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-3 sticky bottom-0"
        style={{ background: 'oklch(0.08 0.035 240)', borderTop: '1px solid rgba(245,158,11,0.1)' }}
      >
        {/* Next (forward in text = visually left in RTL) */}
        <button
          onClick={() => data?.next && setCurrentRef(data.next)}
          disabled={!data?.next}
          className="flex items-center gap-1 text-xs font-medium transition-opacity disabled:opacity-20"
          style={{ color: '#f59e0b' }}
          dir="rtl"
        >
          <ChevronLeft size={16} />
          הבא
        </button>

        {/* Start session */}
        <button
          onClick={() => data && onStartSession(data.ref)}
          disabled={!data}
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity disabled:opacity-30"
          style={{ background: `${TORAH_COLOR}22`, color: TORAH_COLOR }}
        >
          התחל שיעור
        </button>

        {/* Prev (back = visually right in RTL) */}
        <button
          onClick={() => data?.prev && setCurrentRef(data.prev)}
          disabled={!data?.prev}
          className="flex items-center gap-1 text-xs font-medium transition-opacity disabled:opacity-20"
          style={{ color: '#f59e0b' }}
          dir="rtl"
        >
          הקודם
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
