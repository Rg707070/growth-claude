'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, PenLine, BookOpen } from 'lucide-react'
import { TorahSummaryPanel } from './torah-summary-panel'

const TORAH_COLOR = '#0f766e'

interface Props {
  initialRef: string
  userId: string
  onClose: () => void
  onStartSession: (ref: string) => void
}

type MobileTab = 'read' | 'summary'

export function SefariaReader({ initialRef, userId, onClose, onStartSession }: Props) {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const [resolvedRef, setResolvedRef] = useState(initialRef)
  const [heTitle, setHeTitle] = useState('')
  const [resolving, setResolving] = useState(true)
  const [splitMode, setSplitMode] = useState(false)
  const [mobileTab, setMobileTab] = useState<MobileTab>('read')

  useEffect(() => {
    setResolving(true)
    setIframeUrl(null)

    fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(initialRef)}?context=0&pad=0`)
      .then((r) => r.json())
      .then((data) => {
        const ref: string = data.ref ?? initialRef
        setResolvedRef(ref)
        setHeTitle(data.heTitle ?? '')
        setIframeUrl(`https://www.sefaria.org/${ref.replace(/ /g, '.')}?lang=he&aliyot=0`)
      })
      .catch(() => {
        setIframeUrl(`https://www.sefaria.org/${initialRef.replace(/ /g, '.')}?lang=he&aliyot=0`)
      })
      .finally(() => setResolving(false))
  }, [initialRef])

  const sefariaSrc = iframeUrl

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 9rem)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(245,158,11,0.18)', background: 'var(--c-surface)' }}
      >
        {/* Start session */}
        <button
          onClick={() => onStartSession(resolvedRef)}
          disabled={resolving}
          className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition-opacity disabled:opacity-30 shrink-0"
          style={{ background: `${TORAH_COLOR}22`, color: TORAH_COLOR }}
        >
          התחל שיעור
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0 text-right">
          {heTitle && <p className="text-white/80 text-sm font-semibold truncate">{heTitle}</p>}
          <p className="text-amber-400/50 text-xs truncate">{resolvedRef}</p>
        </div>

        {/* Split / Close */}
        <button
          onClick={() => { setSplitMode((v) => !v); setMobileTab('read') }}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{
            background: splitMode ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.05)',
            color: splitMode ? '#f59e0b' : 'var(--c-text-subtle)',
          }}
          title="סיכום לצד הטקסט"
        >
          <PenLine size={15} />
        </button>
        <button onClick={onClose} className="shrink-0 text-white/40 hover:text-white/70 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Mobile tabs (only in split mode) */}
      {splitMode && (
        <div className="md:hidden flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {(['read', 'summary'] as MobileTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors"
              style={{
                background: mobileTab === tab ? 'rgba(245,158,11,0.08)' : 'transparent',
                color: mobileTab === tab ? '#f59e0b' : 'var(--c-text-subtle)',
                borderBottom: mobileTab === tab ? '2px solid #f59e0b' : '2px solid transparent',
              }}
            >
              {tab === 'read' ? <><BookOpen size={13} /> קריאה</> : <><PenLine size={13} /> סיכום</>}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      {!splitMode ? (
        /* Full-width Sefaria */
        <div className="flex-1 overflow-hidden relative">
          {resolving && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={22} className="animate-spin" style={{ color: 'rgba(245,158,11,0.5)' }} />
            </div>
          )}
          {sefariaSrc && (
            <iframe key={sefariaSrc} src={sefariaSrc} className="w-full h-full border-0" title="Sefaria" />
          )}
        </div>
      ) : (
        /* Split mode */
        <>
          {/* Mobile: one panel at a time */}
          <div className="flex-1 overflow-hidden md:hidden">
            {mobileTab === 'read' ? (
              <>
                {resolving && (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 size={22} className="animate-spin" style={{ color: 'rgba(245,158,11,0.5)' }} />
                  </div>
                )}
                {sefariaSrc && (
                  <iframe key={sefariaSrc} src={sefariaSrc} className="w-full h-full border-0" title="Sefaria" />
                )}
              </>
            ) : (
              <TorahSummaryPanel userId={userId} defaultTitle={heTitle || resolvedRef} />
            )}
          </div>

          {/* Desktop: side by side */}
          <div className="flex-1 overflow-hidden hidden md:flex">
            {/* Summary panel — right side (RTL: start) */}
            <div className="w-80 lg:w-96 shrink-0 overflow-hidden flex flex-col" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
              <TorahSummaryPanel userId={userId} defaultTitle={heTitle || resolvedRef} />
            </div>

            {/* Sefaria iframe — left side (RTL: end) */}
            <div className="flex-1 overflow-hidden relative">
              {resolving && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={22} className="animate-spin" style={{ color: 'rgba(245,158,11,0.5)' }} />
                </div>
              )}
              {sefariaSrc && (
                <iframe key={sefariaSrc} src={sefariaSrc} className="w-full h-full border-0" title="Sefaria" />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
