'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ScheduleRow } from './page'

const TYPE_OPTIONS = [
  { value: 'torah',  label: 'תורה',  color: 'text-amber-400'  },
  { value: 'shiur',  label: 'שיעור', color: 'text-blue-400'   },
  { value: 'prayer', label: 'תפילה', color: 'text-emerald-400'},
  { value: 'sports', label: 'ספורט', color: 'text-red-400'    },
  { value: 'break',  label: 'הפסקה', color: 'text-white/40'   },
  { value: 'other',  label: 'אחר',   color: 'text-white/60'   },
]

const TYPE_COLORS: Record<string, string> = {
  torah:  'border-amber-500/30 bg-amber-500/8',
  shiur:  'border-blue-500/30 bg-blue-500/8',
  prayer: 'border-emerald-500/30 bg-emerald-500/8',
  sports: 'border-red-500/30 bg-red-500/8',
  break:  'border-white/10 bg-white/5',
  other:  'border-white/10 bg-white/5',
}

const TYPE_DOT: Record<string, string> = {
  torah:  'bg-amber-400',
  shiur:  'bg-blue-400',
  prayer: 'bg-emerald-400',
  sports: 'bg-red-400',
  break:  'bg-white/30',
  other:  'bg-white/30',
}

interface Props {
  byDay: Record<number, ScheduleRow[]>
  userId: string
  dayNames: string[]
}

interface EditState {
  id: string | null  // null = new item
  day: number
  time: string
  label: string
  type: string
}

export function SchedulePageClient({ byDay, userId, dayNames }: Props) {
  const router = useRouter()
  const [activeDay, setActiveDay] = useState(new Date().getDay())
  const [editing, setEditing] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const openNew = () =>
    setEditing({ id: null, day: activeDay, time: '08:00', label: '', type: 'other' })

  const openEdit = (row: ScheduleRow) =>
    setEditing({ id: row.id, day: row.day_of_week, time: row.time, label: row.label, type: row.type })

  const saveItem = async () => {
    if (!editing || !editing.label.trim() || saving) return
    setSaving(true)
    if (editing.id) {
      await supabase
        .from('user_schedule')
        .update({ time: editing.time, label: editing.label.trim(), type: editing.type })
        .eq('id', editing.id)
    } else {
      const existing = byDay[editing.day] ?? []
      await supabase.from('user_schedule').insert({
        user_id: userId,
        day_of_week: editing.day,
        time: editing.time,
        label: editing.label.trim(),
        type: editing.type,
        sort_order: existing.length,
      })
    }
    setSaving(false)
    setEditing(null)
    router.refresh()
  }

  const deleteItem = async (id: string) => {
    await supabase.from('user_schedule').delete().eq('id', id)
    router.refresh()
  }

  const items = (byDay[activeDay] ?? []).slice().sort((a, b) => {
    const [ah, am] = a.time.split(':').map(Number)
    const [bh, bm] = b.time.split(':').map(Number)
    return ah * 60 + am - (bh * 60 + bm)
  })

  return (
    <div className="px-4 pt-12 pb-32">
      {/* Title */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">לוח זמנים</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 text-sm hover:bg-cyan-500/30 transition-colors"
        >
          <Plus size={15} />
          הוסף
        </button>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
          <button
            key={d}
            onClick={() => setActiveDay(d)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeDay === d
                ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                : 'bg-white/8 text-white/50 hover:bg-white/15'
            }`}
          >
            {dayNames[d]}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {items.length === 0 && (
          <div className="text-center py-12 text-white/25 text-sm">
            אין פריטים ליום זה — לחץ &ldquo;הוסף&rdquo; להוספה
          </div>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-xl border ${TYPE_COLORS[item.type] ?? TYPE_COLORS.other}`}
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_DOT[item.type] ?? 'bg-white/30'}`} />
            <span className="text-white/40 text-xs font-mono flex-shrink-0 w-10">{item.time}</span>
            <p className="flex-1 text-sm text-white font-medium truncate" dir="rtl">{item.label}</p>
            <button
              onClick={() => openEdit(item)}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => deleteItem(item.id)}
              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Edit / Add sheet */}
      {editing && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="fixed bottom-20 left-0 right-0 z-50 px-4">
            <div className="bg-[oklch(0.12_0.04_240)] border border-white/10 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold text-sm">
                  {editing.id ? 'עריכת פריט' : 'פריט חדש'}
                </span>
                <button onClick={() => setEditing(null)} className="text-white/30 hover:text-white/70">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Day selector (only for new) */}
                {!editing.id && (
                  <div>
                    <label className="text-white/40 text-xs mb-1.5 block">יום</label>
                    <div className="flex gap-1 flex-wrap">
                      {[0,1,2,3,4,5,6].map((d) => (
                        <button
                          key={d}
                          onClick={() => setEditing(e => e ? { ...e, day: d } : e)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            editing.day === d
                              ? 'bg-cyan-500 text-white'
                              : 'bg-white/8 text-white/50 hover:bg-white/15'
                          }`}
                        >
                          {dayNames[d]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time */}
                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">שעה</label>
                  <input
                    type="time"
                    value={editing.time}
                    onChange={(e) => setEditing(ed => ed ? { ...ed, time: e.target.value } : ed)}
                    className="w-full bg-white/8 border border-white/12 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {/* Label */}
                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">תיאור</label>
                  <input
                    autoFocus={!editing.id}
                    value={editing.label}
                    onChange={(e) => setEditing(ed => ed ? { ...ed, label: e.target.value } : ed)}
                    onKeyDown={(e) => e.key === 'Enter' && saveItem()}
                    placeholder="למשל: סדר גמרא עיון..."
                    dir="rtl"
                    className="w-full bg-white/8 border border-white/12 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">סוג</label>
                  <div className="flex gap-2 flex-wrap">
                    {TYPE_OPTIONS.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setEditing(ed => ed ? { ...ed, type: t.value } : ed)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          editing.type === t.value
                            ? `${t.color} bg-white/15 ring-1 ring-current`
                            : 'text-white/40 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <button
                  onClick={saveItem}
                  disabled={!editing.label.trim() || saving}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  {saving ? 'שומר...' : 'שמור'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
