'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { WEEKLY_SCHEDULE, DAY_NAMES_HE } from '@/lib/schedule'
import type { ScheduleItem } from '@/lib/schedule'
import { Check, MessageSquare } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────
const MORNING_TIMES = new Set(['05:45', '06:00', '06:45', '07:25', '07:35', '07:40', '08:00'])
const MORNING_ITEMS = (WEEKLY_SCHEDULE[0] ?? []).filter((i) => MORNING_TIMES.has(i.time))
const RECURRING     = new Set(['08:30', '11:50', '12:00', '13:00', '15:30', '18:45'])

const COL: Record<string, { bg: string; border: string; text: string }> = {
  torah:  { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  text: '#fde68a' },
  shiur:  { bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.25)',  text: '#bae6fd' },
  prayer: { bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.25)',  text: '#a7f3d0' },
  sports: { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', text: '#fca5a5' },
  break:  { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.07)', text: 'rgba(255,255,255,0.35)' },
  other:  { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.07)', text: 'rgba(255,255,255,0.40)' },
}
const col = (type: string) => COL[type] ?? COL.other

function toMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// ─── ActivityCard ─────────────────────────────────────────────────────────────
interface CardProps {
  item:       ScheduleItem
  checked:    boolean
  note:       string
  isCurrent:  boolean
  isPast:     boolean
  isRecurr:   boolean
  isMorning:  boolean
  showCheck:  boolean
  onToggle:   () => void
  onNote:     (text: string) => void
}

function ActivityCard({ item, checked, note, isCurrent, isPast, isRecurr, isMorning, showCheck, onToggle, onNote }: CardProps) {
  const [noteOpen, setNoteOpen] = useState(!!note)
  const [noteText, setNoteText] = useState(note)
  const c = col(item.type)

  const opacity = checked
    ? 0.45
    : isMorning || isRecurr
    ? 0.45
    : isPast
    ? 0.55
    : 1

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-200 animate-fade-in"
      style={{
        background:   checked ? 'rgba(52,211,153,0.05)' : isCurrent ? c.bg.replace('0.08','0.16') : c.bg,
        borderColor:  checked ? 'rgba(52,211,153,0.25)' : isCurrent ? c.border : c.border.replace('0.25','0.10'),
        opacity,
        boxShadow:    isCurrent ? `0 0 20px ${c.border.replace('0.25','0.15')}` : 'none',
      }}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3" dir="rtl">
        {/* Label + time */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium leading-snug"
            style={{
              color:          checked ? 'rgba(255,255,255,0.35)' : c.text,
              textDecoration: checked ? 'line-through' : 'none',
            }}
          >
            {item.label}
          </p>
          <p className="text-[10px] text-white/20 mt-0.5 font-mono">{item.time}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {showCheck && (
            <button
              onClick={() => { setNoteOpen((v) => !v) }}
              className={`transition-colors ${noteOpen || note ? 'text-white/40' : 'text-white/15 hover:text-white/30'}`}
            >
              <MessageSquare size={13} />
            </button>
          )}
          {showCheck && (
            <button
              onClick={onToggle}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                checked
                  ? 'bg-emerald-400/20 border-emerald-400/50'
                  : 'border-white/15 hover:border-white/30'
              }`}
            >
              {checked && <Check size={10} className="text-emerald-400" />}
            </button>
          )}
        </div>
      </div>

      {/* Note input */}
      {noteOpen && showCheck && (
        <div className="px-4 pb-3" dir="rtl">
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onBlur={() => { if (noteText !== note) onNote(noteText) }}
            placeholder="הוסף הערה..."
            className="w-full text-[12px] text-white/60 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/20 placeholder:text-white/20"
          />
        </div>
      )}
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Reflection  { date: string; notes: string }
interface CheckRow    { time: string; note: string | null }
interface UserItem    { time: string; label: string; type: string }

interface Props {
  userId:      string
  reflections: Reflection[]
  userItems:   Record<number, UserItem[]>
  todayChecks: CheckRow[]
}

const DAYS = [0, 1, 2, 3, 4, 5]

// ─── Main Component ───────────────────────────────────────────────────────────
export function SchedulePageClient({ userId, reflections, userItems, todayChecks }: Props) {
  const todayDay  = new Date().getDay()
  const todayDate = new Date().toISOString().split('T')[0]
  const nowMin    = new Date().getHours() * 60 + new Date().getMinutes()

  const [day, setDay]               = useState(todayDay < 6 ? todayDay : 0)
  const [morningOpen, setMorningOpen] = useState(false)
  const [reflOpen, setReflOpen]     = useState(false)
  const [reflText, setReflText]     = useState(
    reflections.find((r) => r.date === todayDate)?.notes ?? ''
  )
  const [saving, setSaving]         = useState(false)

  // Optimistic checks state (only matters when viewing today)
  const [checked, setChecked] = useState<Set<string>>(
    new Set(todayChecks.map((c) => c.time))
  )
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(todayChecks.filter((c) => c.note).map((c) => [c.time, c.note!]))
  )
  const router = useRouter()

  async function toggleCheck(time: string) {
    const sb = createClient()
    if (checked.has(time)) {
      setChecked((prev) => { const n = new Set(prev); n.delete(time); return n })
      await sb.from('activity_checks').delete()
        .eq('user_id', userId).eq('date', todayDate).eq('time', time)
    } else {
      setChecked((prev) => new Set([...prev, time]))
      await sb.from('activity_checks').upsert({ user_id: userId, date: todayDate, time })
    }
  }

  async function saveNote(time: string, text: string) {
    setNotes((prev) => ({ ...prev, [time]: text }))
    const sb = createClient()
    await sb.from('activity_checks').upsert({ user_id: userId, date: todayDate, time, note: text || null })
    if (!checked.has(time)) {
      setChecked((prev) => new Set([...prev, time]))
    }
  }

  async function saveRefl() {
    if (!reflText.trim()) return
    setSaving(true)
    const sb = createClient()
    await sb.from('schedule_reflections').upsert({ user_id: userId, date: todayDate, notes: reflText.trim() })
    setSaving(false)
    setReflOpen(false)
    router.refresh()
  }

  const isToday   = day === todayDay
  const baseItems = WEEKLY_SCHEDULE[day] ?? []
  const extras    = (userItems[day] ?? []) as ScheduleItem[]
  const dayItems  = [...baseItems, ...extras]
    .filter((i) => !MORNING_TIMES.has(i.time))
    .sort((a, b) => toMin(a.time) - toMin(b.time))

  const currentItem = isToday
    ? [...dayItems].reverse().find((i) => toMin(i.time) <= nowMin) ?? null
    : null

  const todaySaved = reflections.some((r) => r.date === todayDate)

  return (
    <div className="pt-12 pb-32">

      {/* Day tabs */}
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

      {/* Current activity card */}
      {isToday && currentItem && (
        <div className="px-4 mb-3 animate-fade-in" dir="rtl">
          <div
            className="rounded-2xl p-4 border"
            style={{
              background:  col(currentItem.type).bg.replace('0.08', '0.16'),
              borderColor: col(currentItem.type).border,
              boxShadow:   `0 0 24px ${col(currentItem.type).border.replace('0.25', '0.10')}`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: col(currentItem.type).border }} />
              <span className="text-[10px] text-white/30 tracking-widest uppercase">עכשיו</span>
            </div>
            <p className="text-[17px] font-semibold" style={{ color: col(currentItem.type).text }}>
              {currentItem.label}
            </p>
            {(() => {
              const idx  = dayItems.findIndex((i) => i.time === currentItem.time)
              const next = dayItems[idx + 1]
              return next ? (
                <p className="text-[11px] text-white/30 mt-2">הבא · {next.label} · {next.time}</p>
              ) : null
            })()}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 mb-4 flex justify-between items-center" dir="rtl">
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

      {/* Reflection panel */}
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
            <button onClick={() => setReflOpen(false)} className="px-3 py-1.5 text-white/25 text-sm">ביטול</button>
          </div>
        </div>
      )}

      {/* Activity list */}
      <div className="px-4 flex flex-col gap-2">

        {/* Morning routine — collapsed */}
        <button
          onClick={() => setMorningOpen((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/6 bg-white/[0.02] text-white/25 text-[11px] transition-colors hover:text-white/40"
          dir="rtl"
        >
          <span>{morningOpen ? '▾' : '▸'}</span>
          <span>שגרת בוקר</span>
          <span className="text-white/15">05:45 – 08:00</span>
        </button>

        {morningOpen && MORNING_ITEMS.map((item) => (
          <ActivityCard
            key={item.time}
            item={item}
            checked={isToday && checked.has(item.time)}
            note={notes[item.time] ?? ''}
            isCurrent={false}
            isPast={isToday && toMin(item.time) < nowMin}
            isRecurr={false}
            isMorning={true}
            showCheck={isToday}
            onToggle={() => toggleCheck(item.time)}
            onNote={(t) => saveNote(item.time, t)}
          />
        ))}

        {/* Day items */}
        {dayItems.map((item) => {
          const isCurrentItem = isToday && item === currentItem
          const isPast        = isToday && toMin(item.time) < nowMin && !isCurrentItem

          return (
            <ActivityCard
              key={item.time + item.label}
              item={item}
              checked={isToday && checked.has(item.time)}
              note={notes[item.time] ?? ''}
              isCurrent={isCurrentItem}
              isPast={isPast}
              isRecurr={RECURRING.has(item.time)}
              isMorning={false}
              showCheck={isToday}
              onToggle={() => toggleCheck(item.time)}
              onNote={(t) => saveNote(item.time, t)}
            />
          )
        })}

      </div>
    </div>
  )
}
