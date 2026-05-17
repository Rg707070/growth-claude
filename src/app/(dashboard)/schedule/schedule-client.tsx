'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WEEKLY_SCHEDULE, DAY_NAMES_HE } from '@/lib/schedule'
import type { ScheduleItem } from '@/lib/schedule'

// ─── Timeline geometry ────────────────────────────────────────────────────────
const START_HOUR = 5
const END_HOUR   = 22
const PX_PER_MIN = 1.5
const HOUR_H     = PX_PER_MIN * 60
const TOTAL_H    = (END_HOUR - START_HOUR) * 60 * PX_PER_MIN
const LABEL_W    = 44
const HOURS      = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

function toMin(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
function toY(time: string): number {
  return (toMin(time) - START_HOUR * 60) * PX_PER_MIN
}
function blockH(items: ScheduleItem[], i: number): number {
  const start = toMin(items[i].time)
  const end   = i + 1 < items.length
    ? Math.min(toMin(items[i + 1].time), start + 120)
    : start + 60
  return Math.max((end - start) * PX_PER_MIN - 3, 32)
}

// ─── Design ───────────────────────────────────────────────────────────────────
const RECURRING = new Set(['08:30', '11:50', '12:00', '13:00', '15:30', '18:45'])
const MORNING   = new Set(['05:45', '06:00', '06:45', '07:25', '07:35', '07:40', '08:00'])

const COL: Record<string, { bg: string; border: string; text: string }> = {
  torah:  { bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.30)',  text: '#fde68a' },
  shiur:  { bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.30)',  text: '#bae6fd' },
  prayer: { bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.30)',  text: '#a7f3d0' },
  sports: { bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.30)', text: '#fca5a5' },
  break:  { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.35)' },
  other:  { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.40)' },
}
const col = (type: string) => COL[type] ?? COL.other

// ─── Types ────────────────────────────────────────────────────────────────────
interface Reflection { date: string; notes: string }
interface UserItem   { time: string; label: string; type: string }
interface Props {
  userId:      string
  reflections: Reflection[]
  userItems:   Record<number, UserItem[]>
}

const DAYS = [0, 1, 2, 3, 4, 5]

// ─── Component ────────────────────────────────────────────────────────────────
export function SchedulePageClient({ userId, reflections, userItems }: Props) {
  const todayDay  = new Date().getDay()
  const todayDate = new Date().toISOString().split('T')[0]

  const [day, setDay]           = useState(todayDay < 6 ? todayDay : 0)
  const [nowMin, setNowMin]     = useState(() => {
    const n = new Date()
    return n.getHours() * 60 + n.getMinutes()
  })
  const [reflOpen, setReflOpen] = useState(false)
  const [reflText, setReflText] = useState(
    reflections.find((r) => r.date === todayDate)?.notes ?? ''
  )
  const [addOpen, setAddOpen]   = useState(false)
  const [newTime, setNewTime]   = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType]   = useState('other')
  const [saving, setSaving]     = useState(false)
  const router = useRouter()

  // Live clock
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date()
      setNowMin(n.getHours() * 60 + n.getMinutes())
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  // Auto-scroll to current time when viewing today
  useEffect(() => {
    if (day !== todayDay) return
    const nowY      = (nowMin - START_HOUR * 60) * PX_PER_MIN
    const headerEst = 220
    window.scrollTo({ top: Math.max(0, nowY + headerEst - 240), behavior: 'smooth' })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day])

  // Merge hardcoded + user-added items for selected day
  const baseItems  = WEEKLY_SCHEDULE[day] ?? []
  const extraItems = (userItems[day] ?? []) as ScheduleItem[]
  const items: ScheduleItem[] = [...baseItems, ...extraItems].sort(
    (a, b) => toMin(a.time) - toMin(b.time)
  )

  const isToday = day === todayDay
  const nowY    = (nowMin - START_HOUR * 60) * PX_PER_MIN

  const currentItem = isToday
    ? [...items].reverse().find((it) => toMin(it.time) <= nowMin) ?? null
    : null
  const currentIdx  = currentItem ? items.findIndex((it) => it.time === currentItem.time) : -1
  const nextItem    = currentIdx >= 0 ? items[currentIdx + 1] ?? null : null

  // Save reflection
  async function saveRefl() {
    if (!reflText.trim()) return
    setSaving(true)
    const sb = createClient()
    await sb.from('schedule_reflections').upsert({
      user_id: userId,
      date:    todayDate,
      notes:   reflText.trim(),
    })
    setSaving(false)
    setReflOpen(false)
    router.refresh()
  }

  // Add custom schedule item
  async function addItem() {
    if (!newTime || !newLabel.trim()) return
    setSaving(true)
    const sb = createClient()
    await sb.from('user_schedule').insert({
      user_id:     userId,
      day_of_week: day,
      time:        newTime,
      label:       newLabel.trim(),
      type:        newType,
      sort_order:  0,
    })
    setSaving(false)
    setAddOpen(false)
    setNewTime('')
    setNewLabel('')
    setNewType('other')
    router.refresh()
  }

  const todaySaved = reflections.some((r) => r.date === todayDate)

  return (
    <div className="pt-12 pb-32">

      {/* ── Day tabs ── */}
      <div className="px-4 mb-3" dir="rtl">
        <div className="flex gap-1">
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-xl transition-all ${
                d === day
                  ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/25'
                  : d === todayDay
                  ? 'bg-white/5 text-white/45 border border-white/10'
                  : 'text-white/20'
              }`}
            >
              {DAY_NAMES_HE[d]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Current activity card (today only) ── */}
      {isToday && currentItem && (
        <div className="px-4 mb-3 animate-fade-in" dir="rtl">
          <div
            className="rounded-2xl p-4 border"
            style={{
              background:   col(currentItem.type).bg,
              borderColor:  col(currentItem.type).border,
              boxShadow:    `0 0 24px ${col(currentItem.type).border.replace('0.30', '0.12')}`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: col(currentItem.type).border }}
              />
              <span className="text-[10px] text-white/30 tracking-widest uppercase">עכשיו</span>
            </div>
            <p className="text-[17px] font-semibold" style={{ color: col(currentItem.type).text }}>
              {currentItem.label}
            </p>
            {nextItem && (
              <p className="text-[11px] text-white/30 mt-2">
                הבא · {nextItem.label} · {nextItem.time}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Top-right actions ── */}
      <div className="px-4 mb-4 flex justify-between items-center" dir="rtl">
        <button
          onClick={() => setAddOpen((v) => !v)}
          className="text-[11px] px-3 py-1.5 rounded-lg border bg-white/4 text-white/30 border-white/8 hover:text-white/50 transition-colors"
        >
          + הוסף ללוז
        </button>
        <button
          onClick={() => setReflOpen((v) => !v)}
          className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors ${
            todaySaved
              ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20'
              : 'bg-white/4 text-white/30 border-white/8 hover:text-white/50'
          }`}
        >
          {todaySaved ? '✓ נרשם היום' : '+ מה היה היום'}
        </button>
      </div>

      {/* ── Add item panel ── */}
      {addOpen && (
        <div className="px-4 mb-4 animate-fade-in" dir="rtl">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-24 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm px-2 py-1.5 focus:outline-none focus:border-cyan-400/30"
              />
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="שם הפעילות"
                className="flex-1 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm px-3 py-1.5 focus:outline-none focus:border-cyan-400/30 placeholder:text-white/20"
              />
            </div>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm px-3 py-1.5 focus:outline-none"
            >
              <option value="torah">📖 תורה</option>
              <option value="shiur">🎓 שיעור</option>
              <option value="prayer">🙏 תפילה</option>
              <option value="sports">⚽ ספורט</option>
              <option value="break">☕ הפסקה</option>
              <option value="other">• אחר</option>
            </select>
            <div className="flex gap-2 mt-1">
              <button
                onClick={addItem}
                disabled={saving || !newTime || !newLabel.trim()}
                className="px-4 py-1.5 rounded-lg bg-cyan-400/15 text-cyan-300 text-sm font-medium border border-cyan-400/20 disabled:opacity-30"
              >
                {saving ? 'שומר...' : 'הוסף'}
              </button>
              <button onClick={() => setAddOpen(false)} className="px-3 py-1.5 text-white/25 text-sm">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reflection panel ── */}
      {reflOpen && (
        <div className="px-4 mb-4 animate-fade-in" dir="rtl">
          <textarea
            value={reflText}
            onChange={(e) => setReflText(e.target.value)}
            placeholder="מה קרה בפועל? מה השתנה מהלוז?"
            className="w-full rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm p-3 resize-none focus:outline-none focus:border-cyan-400/30 placeholder:text-white/20 leading-relaxed"
            rows={2}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={saveRefl}
              disabled={saving || !reflText.trim()}
              className="px-4 py-1.5 rounded-lg bg-cyan-400/15 text-cyan-300 text-sm font-medium border border-cyan-400/20 disabled:opacity-30"
            >
              {saving ? 'שומר...' : 'שמור'}
            </button>
            <button onClick={() => setReflOpen(false)} className="px-3 py-1.5 text-white/25 text-sm">
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* ── Timeline ── */}
      <div className="px-4" dir="rtl">
        <div className="relative" style={{ height: `${TOTAL_H}px` }}>

          {/* Hour grid */}
          {HOURS.map((h) => {
            const y = (h - START_HOUR) * HOUR_H
            const isHalfHour = false // future: add half-hour lines
            void isHalfHour
            return (
              <div
                key={h}
                className="absolute right-0 left-0 flex items-center"
                style={{ top: `${y}px` }}
              >
                <span
                  className="text-[9px] text-white/15 font-mono flex-shrink-0 text-right"
                  style={{ width: `${LABEL_W}px` }}
                >
                  {String(h).padStart(2, '0')}:00
                </span>
                <div className="flex-1 h-px bg-white/[0.05]" />
              </div>
            )
          })}

          {/* Activity blocks */}
          {items.map((item, idx) => {
            const y          = toY(item.time)
            const h          = blockH(items, idx)
            const isMorning  = MORNING.has(item.time)
            const isRecurr   = RECURRING.has(item.time)
            const isCurrent  = isToday && item === currentItem
            const isPast     = isToday && toMin(item.time) < nowMin && !isCurrent
            const c          = col(item.type)
            const opacity    = isMorning ? 0.30 : isRecurr ? 0.40 : isPast ? 0.45 : 1

            return (
              <div
                key={`${item.time}-${item.label}`}
                className="absolute rounded-xl border overflow-hidden transition-all duration-300 animate-fade-in"
                style={{
                  top:         `${y + 1}px`,
                  height:      `${h}px`,
                  right:       `${LABEL_W + 8}px`,
                  left:        0,
                  background:  isCurrent ? c.bg.replace('0.10', '0.20') : c.bg,
                  borderColor: isCurrent ? c.border : c.border.replace('0.30', '0.12'),
                  opacity,
                  boxShadow:   isCurrent ? `0 0 18px ${c.border.replace('0.30', '0.20')}` : 'none',
                }}
              >
                <div className="px-3 h-full flex flex-col justify-center overflow-hidden">
                  <span
                    className="text-[11px] font-medium leading-tight line-clamp-2"
                    style={{ color: c.text }}
                  >
                    {item.label}
                  </span>
                  {h > 44 && (
                    <span className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.18)' }}>
                      {item.time}
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Now line */}
          {isToday && nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60 && (
            <div
              className="absolute z-10 pointer-events-none"
              style={{
                top:   `${nowY}px`,
                right: `${LABEL_W + 8}px`,
                left:  0,
              }}
            >
              <div style={{ height: '1px', background: 'rgba(34,211,238,0.55)' }} />
              <div
                style={{
                  position:  'absolute',
                  top:       '-4px',
                  right:     '-4px',
                  width:     '9px',
                  height:    '9px',
                  borderRadius: '50%',
                  background:   'rgb(34,211,238)',
                  boxShadow:    '0 0 10px rgba(34,211,238,0.9)',
                }}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
