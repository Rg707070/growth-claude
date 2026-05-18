'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'

const TORAH_COLOR = '#0f766e'

interface Props {
  initialRef: string
  onClose: () => void
  onStartSession: (ref: string) => void
}

export function SefariaReader({ initialRef, onClose, onStartSession }: Props) {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const [resolvedRef, setResolvedRef] = useState(initialRef)
  const [heTitle, setHeTitle] = useState('')
  const [resolving, setResolving] = useState(true)

  useEffect(() => {
    setResolving(true)
    setIframeUrl(null)

    fetch(
      `https://www.sefaria.org/api/texts/${encodeURIComponent(initialRef)}?context=0&pad=0`
    )
      .then((r) => r.json())
      .then((data) => {
        const ref: string = data.ref ?? initialRef
        setResolvedRef(ref)
        setHeTitle(data.heTitle ?? '')
        // Sefaria URL format: spaces → dots
        const path = ref.replace(/ /g, '.')
        setIframeUrl(`https://www.sefaria.org/${path}?lang=he&aliyot=0`)
      })
      .catch(() => {
        // Fallback: load directly with user's input
        const path = initialRef.replace(/ /g, '.')
        setIframeUrl(`https://www.sefaria.org/${path}?lang=he&aliyot=0`)
      })
      .finally(() => setResolving(false))
  }, [initialRef])

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 9rem)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(245,158,11,0.18)', background: 'oklch(0.08 0.035 240)' }}
      >
        <button
          onClick={() => onStartSession(resolvedRef)}
          disabled={resolving}
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity disabled:opacity-30"
          style={{ background: `${TORAH_COLOR}22`, color: TORAH_COLOR }}
        >
          התחל שיעור
        </button>

        <div className="text-right flex-1 mx-3 min-w-0">
          {heTitle && (
            <p className="text-white/80 text-sm font-semibold truncate">{heTitle}</p>
          )}
          <p className="text-amber-400/50 text-xs truncate">{resolvedRef}</p>
        </div>

        <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors shrink-0">
          <X size={18} />
        </button>
      </div>

      {/* Loading */}
      {resolving && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={22} className="animate-spin" style={{ color: 'rgba(245,158,11,0.5)' }} />
        </div>
      )}

      {/* Sefaria iframe */}
      {iframeUrl && (
        <iframe
          key={iframeUrl}
          src={iframeUrl}
          className="flex-1 w-full border-0"
          title="Sefaria"
          allow="fullscreen"
        />
      )}
    </div>
  )
}
