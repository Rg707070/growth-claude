'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'

interface Photo {
  id: string
  url: string
  caption: string
  taken_at: string
}

interface SlideShowClientProps {
  photos: Photo[]
  weekLabel: string
}

export function SlideShowClient({ photos, weekLabel }: SlideShowClientProps) {
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(true)

  const next = useCallback(() => setIdx((i) => (i + 1) % photos.length), [photos.length])
  const prev = useCallback(() => setIdx((i) => (i - 1 + photos.length) % photos.length), [photos.length])

  useEffect(() => {
    if (!playing) return
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [playing, next])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === ' ') setPlaying((p) => !p)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev])

  const current = photos[idx]

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: '#000' }}
    >
      {/* Week label */}
      <div className="absolute top-6 left-0 right-0 text-center z-10">
        <p className="text-white/50 text-sm">{weekLabel}</p>
      </div>

      {/* Main photo */}
      <div className="relative w-full h-full flex items-center justify-center px-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.id}
          src={current.url}
          alt={current.caption || 'תמונה'}
          className="max-w-full max-h-full object-contain"
          style={{ animation: 'fadein 0.5s ease' }}
        />
      </div>

      {/* Caption */}
      {current.caption && (
        <div className="absolute bottom-20 left-0 right-0 text-center px-8">
          <p className="text-white/80 text-base">{current.caption}</p>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
        <button
          onClick={prev}
          className="p-2 rounded-full text-white/70 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={() => setPlaying((p) => !p)}
          className="p-2 rounded-full text-white/70 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <button
          onClick={next}
          className="p-2 rounded-full text-white/70 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-14 left-0 right-0 flex justify-center gap-1.5">
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIdx(i); setPlaying(false) }}
            className="w-1.5 h-1.5 rounded-full transition-all"
            style={{ background: i === idx ? '#fff' : 'rgba(255,255,255,0.3)' }}
          />
        ))}
      </div>

      <style>{`
        @keyframes fadein { from { opacity: 0; transform: scale(1.02); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
