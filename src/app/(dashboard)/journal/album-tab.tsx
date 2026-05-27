'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { Camera, Share2, X, Plus, Check, Copy } from 'lucide-react'
import type { PhotoEntry } from './page'

interface AlbumTabProps {
  userId: string
  initialPhotos: PhotoEntry[]
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function formatWeekLabel(weekStart: string, isRTL: boolean): string {
  const start = new Date(weekStart)
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const locale = isRTL ? 'he-IL' : 'en-US'
  return `${start.toLocaleDateString(locale, { day: 'numeric', month: 'long' })} – ${end.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}`
}

export function AlbumTab({ userId, initialPhotos }: AlbumTabProps) {
  const { isRTL } = useLang()
  const [photos, setPhotos] = useState<PhotoEntry[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [shareUrls, setShareUrls] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ photos: PhotoEntry[]; index: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pendingWeek = useRef<string | null>(null)

  const grouped = photos.reduce<Record<string, PhotoEntry[]>>((acc, p) => {
    if (!acc[p.week_start]) acc[p.week_start] = []
    acc[p.week_start].push(p)
    return acc
  }, {})
  const sortedWeeks = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const getPhotoUrl = (path: string) => {
    const supabase = createClient()
    return supabase.storage.from('journal-photos').getPublicUrl(path).data.publicUrl
  }

  const uploadPhoto = async (file: File, weekStart: string) => {
    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    // eslint-disable-next-line react-hooks/purity -- inside event handler, not render
    const path = `${userId}/${weekStart}/${Date.now()}.${ext}`
    const supabase = createClient()
    const { error } = await supabase.storage.from('journal-photos').upload(path, file)
    if (!error) {
      const { data: inserted } = await supabase
        .from('photo_entries')
        .insert({ user_id: userId, storage_path: path, caption: '', week_start: weekStart, taken_at: new Date().toISOString().split('T')[0] })
        .select('id, storage_path, caption, week_start, taken_at')
        .single()
      if (inserted) setPhotos((prev) => [inserted as PhotoEntry, ...prev])
    }
    setUploading(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !pendingWeek.current) return
    await uploadPhoto(file, pendingWeek.current)
    e.target.value = ''
  }

  const triggerUpload = (weekStart: string) => {
    pendingWeek.current = weekStart
    fileRef.current?.click()
  }

  const deletePhoto = async (photo: PhotoEntry) => {
    const supabase = createClient()
    await supabase.storage.from('journal-photos').remove([photo.storage_path])
    await supabase.from('photo_entries').delete().eq('id', photo.id).eq('user_id', userId)
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
  }

  const shareWeek = async (weekStart: string) => {
    const supabase = createClient()
    const token = crypto.randomUUID()
    await supabase
      .from('album_shares')
      .upsert({ user_id: userId, week_start: weekStart, share_token: token }, { onConflict: 'user_id,week_start' })

    const { data } = await supabase
      .from('album_shares')
      .select('share_token')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .single()

    if (data) {
      const url = `${window.location.origin}/share/album/${data.share_token}`
      setShareUrls((prev) => ({ ...prev, [weekStart]: url }))
    }
  }

  const copyUrl = async (weekStart: string) => {
    const url = shareUrls[weekStart]
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(weekStart)
    setTimeout(() => setCopied(null), 2000)
  }

  const currentWeek = getWeekStart(new Date())

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Current week upload zone if no photos this week */}
      {!grouped[currentWeek] && (
        <div
          className="mb-8 border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors hover:border-primary/50"
          style={{ borderColor: 'var(--c-card-border)' }}
          onClick={() => triggerUpload(currentWeek)}
        >
          <Camera size={32} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {isRTL ? 'הוסף תמונה לשבוע הזה' : 'Add photo to this week'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {formatWeekLabel(currentWeek, isRTL)}
          </p>
        </div>
      )}

      {sortedWeeks.length === 0 && !!grouped[currentWeek] ? null : sortedWeeks.length === 0 ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isRTL ? 'עדיין אין תמונות — הוסף תמונה ראשונה' : 'No photos yet — add your first photo'}
        </div>
      ) : null}

      <div className="space-y-10">
        {sortedWeeks.map((week) => {
          const weekPhotos = grouped[week]
          const shareUrl = shareUrls[week]
          return (
            <div key={week}>
              {/* Week header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                    {isRTL ? 'שבוע' : 'Week'}
                  </p>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {formatWeekLabel(week, isRTL)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {shareUrl ? (
                    <button
                      onClick={() => void copyUrl(week)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                      style={{ background: 'var(--c-primary-glow)', color: 'var(--primary)' }}
                    >
                      {copied === week ? <Check size={13} /> : <Copy size={13} />}
                      {copied === week ? (isRTL ? 'הועתק!' : 'Copied!') : (isRTL ? 'העתק קישור' : 'Copy link')}
                    </button>
                  ) : (
                    <button
                      onClick={() => void shareWeek(week)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                      style={{ background: 'var(--c-card)', color: 'var(--muted-foreground)', border: '1px solid var(--c-card-border)' }}
                    >
                      <Share2 size={13} />
                      {isRTL ? 'שתף מצגת' : 'Share slideshow'}
                    </button>
                  )}
                  <button
                    onClick={() => triggerUpload(week)}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                    style={{ background: 'var(--c-card)', color: 'var(--muted-foreground)', border: '1px solid var(--c-card-border)' }}
                  >
                    <Plus size={13} />
                    {isRTL ? 'הוסף' : 'Add'}
                  </button>
                </div>
              </div>

              {/* Photo grid */}
              <div className="grid grid-cols-3 gap-2">
                {weekPhotos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                    onClick={() => setLightbox({ photos: weekPhotos, index: idx })}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getPhotoUrl(photo.storage_path)}
                      alt={photo.caption || ''}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        void deletePhoto(photo)
                      }}
                      className="absolute top-1 end-1 opacity-0 group-hover:opacity-100 p-1 rounded-full transition-opacity"
                      style={{ background: 'rgba(0,0,0,0.6)' }}
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Lightbox / Slideshow */}
      {lightbox && (
        <Slideshow
          photos={lightbox.photos}
          startIndex={lightbox.index}
          getUrl={getPhotoUrl}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

function Slideshow({
  photos,
  startIndex,
  getUrl,
  onClose,
}: {
  photos: PhotoEntry[]
  startIndex: number
  getUrl: (path: string) => string
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)
  const current = photos[idx]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.95)' }}
      onClick={onClose}
    >
      <button
        className="absolute top-4 end-4 p-2 rounded-full text-white"
        style={{ background: 'rgba(255,255,255,0.15)' }}
        onClick={onClose}
      >
        <X size={20} />
      </button>

      {idx > 0 && (
        <button
          className="absolute start-4 top-1/2 -translate-y-1/2 p-3 rounded-full text-white text-xl font-bold"
          style={{ background: 'rgba(255,255,255,0.15)' }}
          onClick={(e) => { e.stopPropagation(); setIdx(idx - 1) }}
        >
          ‹
        </button>
      )}

      <div className="max-w-lg w-full px-4" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getUrl(current.storage_path)}
          alt={current.caption || ''}
          className="w-full max-h-[80vh] object-contain rounded-2xl"
        />
        {current.caption && (
          <p className="text-white/70 text-sm text-center mt-3">{current.caption}</p>
        )}
        <p className="text-white/40 text-xs text-center mt-1">
          {idx + 1} / {photos.length}
        </p>
      </div>

      {idx < photos.length - 1 && (
        <button
          className="absolute end-4 top-1/2 -translate-y-1/2 p-3 rounded-full text-white text-xl font-bold"
          style={{ background: 'rgba(255,255,255,0.15)' }}
          onClick={(e) => { e.stopPropagation(); setIdx(idx + 1) }}
        >
          ›
        </button>
      )}
    </div>
  )
}
