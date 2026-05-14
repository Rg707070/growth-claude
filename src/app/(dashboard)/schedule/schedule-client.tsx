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

const TYPE_BG: Record<string, string> = {
  torah:  'bg-amber-500/20 text-amber-200',
  shiur:  'bg-blue-500/20 text-blue-200',
  prayer: 'bg-emerald-500/20 text-emerald-200',
  sports: 'bg-red-500/20 text-red-200',
  break:  'bg-white/8 text-white/40',
  other:  'bg-white/5 text-white/60',
}

const DAYS = [0, 1, 2, 3, 4, 5] // ראשון עד שישי (ללא שבת בטבלה)

interface Props {
  byDay: Record<number, ScheduleRow[]>
  userId: string
  dayNames: string[]
}

interface EditState {
  id: string | null
  day: number
  time: string
  label: string
  type: string
}

export function SchedulePageClient({ byDay, userId, dayNames }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Collect all unique times sorted
  const allTimes = [...new Set(
    DAYS.flatMap((d) => (byDay[d] ?? []).map((r) => r.time))
  )].sort((a, b) => {
    const [ah, am] = a.split(':').map(Number)
    const [bh, bm] = b.split(':').map(Number)
    return ah * 60 + am - (bh * 60 + bm)
  })

  // Build lookup: time → day → item
  const cell = (time: string, day: number): ScheduleRow | undefined =>
    (byDay[day] ?? []).find((r) => r.time === time)

  const openNew = (day: number, time?: string) =>
    setEditing({ id: null, day, time: time ?? '08:00', label: '', type: 'other' })

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
      await supabase.from('user_schedule').insert({
        user_id: userId,
        day_of_week: editing.day,
        time: editing.time,
        label: editing.label.trim(),
        type: editing.type,
        sort_order: (byDay[editing.day] ?? []).length,
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

  return (
    <div className="pt-12 pb-32">
      {/* Title */}
      <div className="flex items-center justify-between mb-4 px-4">
        <h1 className="text-xl font-bold text-white">לוח זמנים</h1>
        <button
          onClick={() => openNew(new Date().getDay())}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 text-sm hover:bg-cyan-500/30 transition-colors"
        >
          <Plus size={15} />
          הוסף
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto px-2">
        <table className="w-full border-collapse" style={{ minWidth: '520px' }}>
          {/* Header row */}
          <thead>
            <tr>
              <th className="sticky right-0 z-10 bg-[oklch(0.08_0.035_240)] w-14 py-2 text-right pr-3 text-white/30 text-[10px] font-semibold">
                שעה
              </th>
              {DAYS.map((d) => (
                <th
                  key={d}
                  className="py-2 px-1 text-center text-[11px] font-bold"
                  style={{ color: d === new Date().getDay() ? '#22D3EE' : 'rgba(255,255,255,0.4)' }}
                >
                  {dayNames[d]}
                  {d === new Date().getDay() && (
                    <span className="block w-1 h-1 rounded-full bg-cyan-400 mx-auto mt-0.5" />
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {allTimes.map((time, ti) => (
              <tr
                key={time}
                className={ti % 2 === 0 ? 'bg-white/[0.02]' : ''}
              >
                {/* Time column — sticky right */}
                <td className="sticky right-0 z-10 bg-inherit py-1.5 pr-3 text-right">
                  <span className="text-white/30 text-[10px] font-mono">{time}</span>
                </td>

                {/* Day columns */}
                {DAYS.map((d) => {
                  const item = cell(time, d)
                  return (
                    <td key={d} className="py-1 px-1 text-center align-middle">
                      {item ? (
                        <div
                          className={`group relative rounded-lg px-1.5 py-1 text-[10px] font-medium leading-tight cursor-pointer transition-all hover:opacity-80 ${TYPE_BG[item.type] ?? TYPE_BG.other}`}
                          onClick={() => openEdit(item)}
                        >
                          <span className="block text-center leading-snug" dir="rtl">
                            {item.label}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteItem(item.id) }}
                            className="absolute -top-1 -left-1 hidden group-hover:flex w-4 h-4 rounded-full bg-red-500 text-white items-center justify-center text-[8px]"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openNew(d, time)}
                          className="w-full h-7 rounded-lg border border-dashed border-white/8 text-white/15 hover:border-cyan-500/30 hover:text-cyan-500/40 transition-all text-[10px]"
                        >
                          +
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}

            {/* Empty state */}
            {allTimes.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-white/25 text-sm">
                  הלוז ריק — לחץ &ldquo;הוסף&rdquo; להתחלה
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
                  {!editing.id && <span className="text-white/40 text-xs mr-2">— {dayNames[editing.day]}</span>}
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
                    <div className="flex gap-1 flex-wrap" dir="rtl">
                      {DAYS.map((d) => (
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
                    autoFocus
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

                <button
                  onClick={saveItem}
                  disabled={!editing.label.trim() || saving}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
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
