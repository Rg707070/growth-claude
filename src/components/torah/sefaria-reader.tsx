'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronRight, ChevronLeft, X, BookOpen } from 'lucide-react'

const TORAH_COLOR = '#0f766e'

type Chapter = string[]
type ParsedContent =
  | { kind: 'single'; verses: string[] }
  | { kind: 'multi'; chapters: Chapter[] }

function parseContent(he: unknown): ParsedContent {
  if (!he || !Array.isArray(he) || he.length === 0) return { kind: 'single', verses: [] }
  if (Array.isArray(he[0])) {
    return {
      kind: 'multi',
      chapters: (he as string[][]).map((ch) =>
        (Array.isArray(ch) ? ch : [ch]).filter((v): v is string => typeof v === 'string' && v.trim() !== '')
      ),
    }
  }
  return {
    kind: 'single',
    verses: (he as string[]).filter((v): v is string => typeof v === 'string' && v.trim() !== ''),
  }
}

interface TextData {
  heTitle: string
  ref: string
  content: ParsedContent
  next: string | null
  prev: string | null
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
      setData({
        heTitle: json.heTitle ?? ref,
        ref: json.ref ?? ref,
        content: parseContent(json.he),
        next: json.next ?? null,
        prev: json.prev ?? null,
      })
    } catch {
      setError(true)
    }
    setLoading(false)
  }

  function navigate(ref: string) {
    setCurrentRef(ref)
  }

  const isEmpty =
    data &&
    (data.content.kind === 'single'
      ? data.content.verses.length === 0
      : data.content.chapters.every((ch) => ch.length === 0))

  return (
    <div className="flex flex-col" style={{ minHeight: '70vh' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{ background: 'oklch(0.08 0.035 240)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}
      >
        <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
          <X size={18} />
        </button>
        <div className="text-right">
          {data ? (
            <>
              <p className="text-white font-semibold text-sm leading-tight">{data.heTitle}</p>
              <p className="text-amber-400/60 text-xs mt-0.5 font-medium">{data.ref}</p>
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
        {data && !loading && isEmpty && (
          <p className="text-white/30 text-sm text-center py-8">אין טקסט זמין</p>
        )}

        {data && !loading && !isEmpty && data.content.kind === 'single' && (
          <div className="space-y-4">
            {data.content.verses.map((v, i) => (
              <div key={i} className="flex gap-3">
                <span
                  className="shrink-0 mt-1 text-xs font-bold tabular-nums"
                  style={{ color: 'rgba(245,158,11,0.45)', minWidth: '1.2rem', textAlign: 'center' }}
                >
                  {i + 1}
                </span>
                <p
                  className="flex-1 leading-loose text-white/88"
                  style={{ fontSize: '1.05rem', lineHeight: '2rem' }}
                  dangerouslySetInnerHTML={{ __html: v }}
                />
              </div>
            ))}
          </div>
        )}

        {data && !loading && !isEmpty && data.content.kind === 'multi' && (
          <div className="space-y-8">
            {data.content.chapters.map((chapter, ci) =>
              chapter.length === 0 ? null : (
                <div key={ci}>
                  {/* Chapter header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px" style={{ background: 'rgba(245,158,11,0.18)' }} />
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}
                    >
                      פרק {ci + 1}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(245,158,11,0.18)' }} />
                  </div>

                  <div className="space-y-4">
                    {chapter.map((v, vi) => (
                      <div key={vi} className="flex gap-3">
                        <span
                          className="shrink-0 mt-1 text-xs font-bold tabular-nums"
                          style={{ color: 'rgba(245,158,11,0.45)', minWidth: '1.2rem', textAlign: 'center' }}
                        >
                          {vi + 1}
                        </span>
                        <p
                          className="flex-1 leading-loose text-white/88"
                          style={{ fontSize: '1.05rem', lineHeight: '2rem' }}
                          dangerouslySetInnerHTML={{ __html: v }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div
        className="sticky bottom-0"
        style={{ background: 'oklch(0.08 0.035 240)', borderTop: '1px solid rgba(245,158,11,0.12)' }}
      >
        {/* Session button */}
        <div className="px-4 pt-2">
          <button
            onClick={() => data && onStartSession(data.ref)}
            disabled={!data}
            className="w-full text-xs py-2 rounded-lg font-medium transition-opacity disabled:opacity-30"
            style={{ background: `${TORAH_COLOR}22`, color: TORAH_COLOR }}
          >
            התחל שיעור על קטע זה
          </button>
        </div>

        {/* Prev / Next */}
        <div className="flex items-stretch divide-x divide-white/5 pb-1 px-2 pt-1 gap-1">
          <button
            onClick={() => data?.prev && navigate(data.prev)}
            disabled={!data?.prev}
            className="flex-1 flex items-center justify-end gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-20"
            style={{ color: '#f59e0b' }}
            dir="rtl"
          >
            <span className="truncate max-w-28 text-left opacity-70">{data?.prev ?? ''}</span>
            <ChevronRight size={15} className="shrink-0" />
          </button>
          <button
            onClick={() => data?.next && navigate(data.next)}
            disabled={!data?.next}
            className="flex-1 flex items-center justify-start gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-20"
            style={{ color: '#f59e0b' }}
            dir="rtl"
          >
            <ChevronLeft size={15} className="shrink-0" />
            <span className="truncate max-w-28 opacity-70">{data?.next ?? ''}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
