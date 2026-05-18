'use client'

import { useState } from 'react'
import { Plus, Check, Edit2, X, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { DailyTrack } from '@/types'

interface Props {
  userId: string
  initialTracks: DailyTrack[]
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function TorahDailySchedule({ userId, initialTracks }: Props) {
  const supabase = createClient()
  const [tracks, setTracks] = useState<DailyTrack[]>(initialTracks)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newContent, setNewContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)

  async function addTrack() {
    if (!newName.trim() || !newContent.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('torah_daily_tracks')
      .insert({
        user_id: userId,
        name: newName.trim(),
        content: newContent.trim(),
        sort_order: tracks.length,
      })
      .select()
      .single()
    if (data) setTracks((prev) => [...prev, data as DailyTrack])
    setNewName('')
    setNewContent('')
    setAdding(false)
    setSaving(false)
  }

  async function toggleDone(id: string, done: boolean) {
    const last_done = done ? null : todayStr()
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, last_done } : t)))
    await supabase.from('torah_daily_tracks').update({ last_done }).eq('id', id)
  }

  async function saveEdit(id: string) {
    if (!editContent.trim()) { setEditingId(null); return }
    const content = editContent.trim()
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, content } : t)))
    setEditingId(null)
    await supabase.from('torah_daily_tracks').update({ content }).eq('id', id)
  }

  async function removeTrack(id: string) {
    setTracks((prev) => prev.filter((t) => t.id !== id))
    await supabase.from('torah_daily_tracks').delete().eq('id', id)
  }

  return (
    <div className="space-y-2" dir="rtl">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setAdding(true)}
          className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: '#f59e0b' }}
        >
          <Plus size={12} />
          הוסף
        </button>
        <p className="text-xs text-white/40">לימודים קבועים</p>
      </div>

      {tracks.length === 0 && !adding && (
        <p className="text-xs text-white/25 text-center py-3">הגדר את הלימודים הקבועים שלך</p>
      )}

      {tracks.map((track) => {
        const done = track.last_done === todayStr()
        return (
          <div
            key={track.id}
            className="rounded-xl p-3 transition-all"
            style={{
              background: done ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${done ? 'rgba(245,158,11,0.22)' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            <div className="flex items-start gap-2">
              <button
                onClick={() => removeTrack(track.id)}
                className="mt-0.5 shrink-0 text-white/15 hover:text-red-400/50 transition-colors"
              >
                <X size={11} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleDone(track.id, done)}
                    className="shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all"
                    style={{
                      borderColor: done ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                      background: done ? '#f59e0b' : 'transparent',
                    }}
                  >
                    {done && <Check size={11} color="#000" strokeWidth={3} />}
                  </button>
                  <p className="text-xs font-medium" style={{ color: done ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.45)' }}>
                    {track.name}
                  </p>
                </div>

                {editingId === track.id ? (
                  <div className="flex gap-1.5 mt-1.5 items-center">
                    <button onClick={() => saveEdit(track.id)} className="shrink-0 text-amber-400/60 hover:text-amber-400 transition-colors">
                      <Save size={13} />
                    </button>
                    <input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(track.id) }}
                      autoFocus
                      className="flex-1 bg-transparent text-sm text-white outline-none border-b text-right"
                      style={{ borderColor: 'rgba(245,158,11,0.3)' }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1 gap-2">
                    <button
                      onClick={() => { setEditingId(track.id); setEditContent(track.content) }}
                      className="shrink-0 text-white/15 hover:text-amber-400/50 transition-colors"
                    >
                      <Edit2 size={11} />
                    </button>
                    <p
                      className="text-sm text-right leading-snug"
                      style={{
                        color: done ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.78)',
                        textDecoration: done ? 'line-through' : 'none',
                      }}
                    >
                      {track.content}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {adding && (
        <div
          className="rounded-xl p-3 space-y-2"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="שם הלימוד (דף יומי, הלכה יומית...)"
            className="w-full bg-transparent text-sm text-white placeholder-white/20 outline-none text-right border-b py-1"
            style={{ borderColor: 'rgba(245,158,11,0.2)' }}
            autoFocus
          />
          <input
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addTrack() }}
            placeholder="מה ללמוד (ברכות ב:א...)"
            className="w-full bg-transparent text-sm text-white placeholder-white/20 outline-none text-right border-b py-1"
            style={{ borderColor: 'rgba(245,158,11,0.2)' }}
          />
          <div className="flex gap-2 pt-1">
            <button
              onClick={addTrack}
              disabled={!newName.trim() || !newContent.trim() || saving}
              className="text-xs px-3 py-1.5 rounded-lg transition-opacity disabled:opacity-30"
              style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}
            >
              הוסף
            </button>
            <button
              onClick={() => { setAdding(false); setNewName(''); setNewContent('') }}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
