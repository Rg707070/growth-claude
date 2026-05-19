'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DAY_NAMES_HE } from '@/lib/schedule'
import { Check, MessageSquare, Pencil, Trash2, X } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { HeatMap } from '@/components/heat-map'
import { WeeklyChart } from '@/components/weekly-chart'
import { WeeklySummary } from '@/components/weekly-summary'
import { FridaySummary } from '@/components/friday-summary'
import { AIInsights } from '@/components/ai-insights'
import { AchievementsDisplay } from '@/components/achievements-display'
import { ACHIEVEMENTS, getUnlockedIds } from '@/lib/achievements'
import type { AchievementData } from '@/lib/achievements'

// ─── Design ───────────────────────────────────────────────────────────────────
function col(type: string, isDark: boolean) {
  const map = isDark ? COL_DARK : COL_LIGHT
  return map[type] ?? map.other
}

const COL_DARK: Record<string, { bg: string; border: string; text: string }> = {
  torah:  { bg: 'rgba(77,124,15,0.15)',   border: 'rgba(77,124,15,0.40)',   text: '#bef264' },
  shiur:  { bg: 'rgba(15,118,110,0.15)',  border: 'rgba(15,118,110,0.40)',  text: '#5eead4' },
  prayer: { bg: 'rgba(5,150,105,0.15)',   border: 'rgba(5,150,105,0.40)',   text: '#6ee7b7' },
  sports: { bg: 'rgba(22,163,74,0.15)',   border: 'rgba(22,163,74,0.40)',   text: '#86efac' },
  break:  { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.35)' },
  other:  { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.40)' },
}
const COL_LIGHT: Record<string, { bg: string; border: string; text: string }> = {
  torah:  { bg: 'rgba(77,124,15,0.08)',   border: 'rgba(77,124,15,0.30)',   text: '#4d7c0f' },
  shiur:  { bg: 'rgba(15,118,110,0.08)',  border: 'rgba(15,118,110,0.30)',  text: '#0f766e' },
  prayer: { bg: 'rgba(5,150,105,0.08)',   border: 'rgba(5,150,105,0.30)',   text: '#047857' },
  sports: { bg: 'rgba(22,163,74,0.08)',   border: 'rgba(22,163,74,0.30)',   text: '#166534' },
  break:  { bg: 'rgba(0,0,0,0.03)',       border: 'rgba(0,0,0,0.10)',       text: '#6b7280' },
  other:  { bg: 'rgba(0,0,0,0.03)',       border: 'rgba(0,0,0,0.10)',       text: '#6b7280' },
}

const TYPE_OPTIONS = [
  { value: 'torah',  label: 'תורה'  },
  { value: 'shiur',  label: 'שיעור' },
  { value: 'prayer', label: 'תפילה' },
  { value: 'sports', label: 'ספורט' },
  { value: 'break',  label: 'הפסקה' },
  { value: 'other',  label: 'אחר'   },
]

function toMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// Returns calendar date for a given day-of-week in the current week
function getWeekDate(dayOfWeek: number): string {
  const today = new Date()
  const d     = new Date(today)
  d.setDate(today.getDate() + (dayOfWeek - today.getDay()))
  return d.toISOString().split('T')[0]
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ScheduleItem {
  id:           string
  time:         string
  label:        string
  type:         string
  specificDate: string | null
}
interface AllItem { id: string; day_of_week: number; label: string; time: string; specific_date: string | null }
interface Reflection { date: string; notes: string }
interface CheckRow   { time: string; note: string | null }

interface WeekSummary {
  bestDomain:     string
  streak:         number
  completionPct:  number
  habitCount:     number
  topDomainSlug:  string
  habitsCompleted: number
}

interface Props {
  userId:               string
  reflections:          Reflection[]
  userItems:            Record<number, ScheduleItem[]>
  allItems:             AllItem[]
  todayChecks:          CheckRow[]
  heatMapDays:          { date: string; pct: number }[]
  weeklyActivity:       { date: string; count: number }[]
  weekXP:               number
  achievementData:      AchievementData
  weekSummary:          WeekSummary
  weeklyScheduleChecks: { date: string; count: number }[]
}

// ─── Save scope modal ─────────────────────────────────────────────────────────
interface ScopeModalProps {
  label:       string
  matchCount:  number
  onSelect:    (scope: 'single' | 'all' | 'once') => void
  onCancel:    () => void
}

function ScopeModal({ label, matchCount, onSelect, onCancel }: ScopeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-3xl p-5 animate-fade-in" style={{ background: 'var(--c-fab-sheet)', border: '1px solid var(--c-border)' }}>
        <p className="text-sm font-semibold text-white mb-1">שינוי "{label}"</p>
        <p className="text-[11px] text-white/35 mb-4">
          נמצא ב-{matchCount} ימים נוספים. לשנות איפה?
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onSelect('single')}
            className="w-full text-right px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          >
            <p className="text-sm font-medium text-white">רק ביום זה</p>
            <p className="text-[10px] text-white/35 mt-0.5">שינוי קבוע ליום הזה בלבד בלוז</p>
          </button>
          <button
            onClick={() => onSelect('all')}
            className="w-full text-right px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
          >
            <p className="text-sm font-medium text-white">בכל הימים ({matchCount + 1})</p>
            <p className="text-[10px] text-white/35 mt-0.5">שינוי קבוע בכל הימים שיש את הפעילות</p>
          </button>
          <button
            onClick={() => onSelect('once')}
            className="w-full text-right px-4 py-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.10] transition-colors"
          >
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300">חד פעמי</p>
            <p className="text-[10px] text-emerald-600/50 dark:text-emerald-300/50 mt-0.5">רק השבוע, הלוז הקבוע לא ישתנה</p>
          </button>
        </div>
        <button onClick={onCancel} className="absolute top-4 left-4 text-white/20 hover:text-white/50">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── ActivityCard ─────────────────────────────────────────────────────────────
interface CardProps {
  item:       ScheduleItem
  dayOfWeek:  number
  checked:    boolean
  note:       string
  isCurrent:  boolean
  isPast:     boolean
  showCheck:  boolean
  onToggle:   () => void
  onNote:     (text: string) => void
  onSave:     (id: string, scope: 'single' | 'all' | 'once', time: string, label: string, type: string, dayOfWeek: number) => Promise<void>
  onDelete:   (id: string) => Promise<void>
  getDuplicateCount: (label: string, currentDayOfWeek: number) => number
}

function ActivityCard({ item, dayOfWeek, checked, note, isCurrent, isPast, showCheck, onToggle, onNote, onSave, onDelete, getDuplicateCount }: CardProps) {
  const { isDark } = useTheme()
  const [noteOpen, setNoteOpen]   = useState(!!note)
  const [noteText, setNoteText]   = useState(note)
  const [editMode, setEditMode]   = useState(false)
  const [editTime, setEditTime]   = useState(item.time)
  const [editLabel, setEditLabel] = useState(item.label)
  const [editType, setEditType]   = useState(item.type)
  const [showScope, setShowScope] = useState(false)
  const [busy, setBusy]           = useState(false)

  const c = col(item.type, isDark)
  const opacity = checked ? 0.45 : isPast ? 0.55 : 1

  function handleSaveClick() {
    if (!editLabel.trim() || !editTime) return
    const dupes = getDuplicateCount(item.label, dayOfWeek)
    if (dupes > 0) {
      setShowScope(true)
    } else {
      confirmSave('single')
    }
  }

  async function confirmSave(scope: 'single' | 'all' | 'once') {
    setShowScope(false)
    setBusy(true)
    await onSave(item.id, scope, editTime, editLabel.trim(), editType, dayOfWeek)
    setBusy(false)
    setEditMode(false)
  }

  async function handleDelete() {
    setBusy(true)
    await onDelete(item.id)
  }

  // ── Edit mode ──
  if (editMode) {
    return (
      <>
        {showScope && (
          <ScopeModal
            label={item.label}
            matchCount={getDuplicateCount(item.label, dayOfWeek)}
            onSelect={confirmSave}
            onCancel={() => setShowScope(false)}
          />
        )}
        <div className="rounded-2xl border border-white/12 bg-white/[0.04] overflow-hidden animate-fade-in" dir="rtl">
          <div className="p-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)}
                className="w-24 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm px-2 py-1.5 focus:outline-none focus:border-cyan-400/30"
              />
              <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                className="flex-1 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm px-3 py-1.5 focus:outline-none focus:border-cyan-400/30"
              />
            </div>
            <select value={editType} onChange={(e) => setEditType(e.target.value)}
              className="rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm px-3 py-1.5 focus:outline-none"
            >
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="flex gap-2 items-center">
              <button onClick={handleSaveClick} disabled={busy || !editLabel.trim()}
                className="px-4 py-1.5 rounded-lg bg-cyan-400/15 text-cyan-300 text-sm font-medium border border-cyan-400/20 disabled:opacity-30"
              >
                {busy ? '...' : 'שמור'}
              </button>
              <button
                onClick={() => { setEditMode(false); setEditLabel(item.label); setEditTime(item.time); setEditType(item.type) }}
                className="px-3 py-1.5 text-white/25 text-sm"
              >
                ביטול
              </button>
              <button onClick={handleDelete} disabled={busy}
                className="mr-auto p-1.5 text-red-400/50 hover:text-red-400/80 transition-colors disabled:opacity-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Normal mode ──
  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-200 animate-fade-in"
      style={{
        background:  checked ? 'rgba(52,211,153,0.05)' : isCurrent ? c.bg.replace('0.08', '0.16') : c.bg,
        borderColor: checked ? 'rgba(52,211,153,0.25)'  : isCurrent ? c.border : c.border.replace('0.25', '0.10'),
        opacity,
        boxShadow:   isCurrent ? `0 0 20px ${c.border.replace('0.25', '0.12')}` : 'none',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3" dir="rtl">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium leading-snug"
              style={{ color: checked ? 'rgba(255,255,255,0.35)' : c.text, textDecoration: checked ? 'line-through' : 'none' }}
            >
              {item.label}
            </p>
            {item.specificDate && (
              <span className="text-[9px] text-cyan-400/60 border border-cyan-400/20 rounded px-1">חד פעמי</span>
            )}
          </div>
          <p className="text-[10px] text-white/20 mt-0.5 font-mono">{item.time}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setEditMode(true)} className="text-white/15 hover:text-white/40 transition-colors">
            <Pencil size={12} />
          </button>
          {showCheck && (
            <button onClick={() => setNoteOpen((v) => !v)}
              className={`transition-colors ${noteOpen || note ? 'text-white/40' : 'text-white/15 hover:text-white/30'}`}
            >
              <MessageSquare size={13} />
            </button>
          )}
          {showCheck && (
            <button onClick={onToggle}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                checked ? 'bg-emerald-400/20 border-emerald-400/50' : 'border-white/15 hover:border-white/30'
              }`}
            >
              {checked && <Check size={10} className="text-emerald-400" />}
            </button>
          )}
        </div>
      </div>
      {noteOpen && showCheck && (
        <div className="px-4 pb-3" dir="rtl">
          <input value={noteText} onChange={(e) => setNoteText(e.target.value)}
            onBlur={() => { if (noteText !== note) onNote(noteText) }}
            placeholder="הוסף הערה..."
            className="w-full text-[12px] text-white/60 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 focus:outline-none focus:border-white/20 placeholder:text-white/20"
          />
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const DAYS = [0, 1, 2, 3, 4, 5]

export function SchedulePageClient({ userId, reflections, userItems, allItems, todayChecks, heatMapDays, weeklyActivity, weekXP, achievementData, weekSummary, weeklyScheduleChecks }: Props) {
  const { isDark } = useTheme()

  const todayDay  = new Date().getDay()
  const todayDate = new Date().toISOString().split('T')[0]
  const nowMin    = new Date().getHours() * 60 + new Date().getMinutes()

  const [day, setDay]           = useState(todayDay < 6 ? todayDay : 0)
  const [reflOpen, setReflOpen] = useState(false)
  const [reflText, setReflText] = useState(reflections.find((r) => r.date === todayDate)?.notes ?? '')
  const [addOpen, setAddOpen]   = useState(false)
  const [newTime, setNewTime]   = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType]   = useState('other')
  const [saving, setSaving]     = useState(false)

  const [checked, setChecked] = useState<Set<string>>(new Set(todayChecks.map((c) => c.time)))
  const [notes, setNotes]     = useState<Record<string, string>>(
    Object.fromEntries(todayChecks.filter((c) => c.note).map((c) => [c.time, c.note!]))
  )
  const router = useRouter()

  // How many OTHER days have the same label (excluding current day and one-time items)
  function getDuplicateCount(label: string, currentDay: number): number {
    return allItems.filter(
      (i) => i.label === label && i.day_of_week !== currentDay && i.specific_date === null
    ).length
  }

  async function saveEdit(id: string, scope: 'single' | 'all' | 'once', time: string, label: string, type: string, dayOfWeek: number) {
    const sb = createClient()

    if (scope === 'single') {
      await sb.from('user_schedule').update({ time, label, type }).eq('id', id)

    } else if (scope === 'all') {
      // Find original label to match all instances
      const original = allItems.find((i) => i.id === id)
      if (!original) return
      const matchIds = allItems
        .filter((i) => i.label === original.label && i.specific_date === null)
        .map((i) => i.id)
      for (const mid of matchIds) {
        await sb.from('user_schedule').update({ time, label, type }).eq('id', mid)
      }

    } else {
      // One-time: insert a new row for this specific week's date, don't touch the original
      const specificDate = getWeekDate(dayOfWeek)
      await sb.from('user_schedule').insert({
        user_id:       userId,
        day_of_week:   dayOfWeek,
        time,
        label,
        type,
        sort_order:    0,
        specific_date: specificDate,
      })
    }
    router.refresh()
  }

  async function deleteItem(id: string) {
    const sb = createClient()
    await sb.from('user_schedule').delete().eq('id', id)
    router.refresh()
  }

  async function toggleCheck(time: string) {
    const sb = createClient()
    if (checked.has(time)) {
      setChecked((p) => { const n = new Set(p); n.delete(time); return n })
      await sb.from('activity_checks').delete().eq('user_id', userId).eq('date', todayDate).eq('time', time)
    } else {
      setChecked((p) => new Set([...p, time]))
      await sb.from('activity_checks').upsert({ user_id: userId, date: todayDate, time })
    }
  }

  async function saveNote(time: string, text: string) {
    setNotes((p) => ({ ...p, [time]: text }))
    const sb = createClient()
    await sb.from('activity_checks').upsert({ user_id: userId, date: todayDate, time, note: text || null })
    if (!checked.has(time)) setChecked((p) => new Set([...p, time]))
  }

  async function addItem() {
    if (!newTime || !newLabel.trim()) return
    setSaving(true)
    const sb = createClient()
    await sb.from('user_schedule').insert({ user_id: userId, day_of_week: day, time: newTime, label: newLabel.trim(), type: newType, sort_order: 0 })
    setSaving(false)
    setAddOpen(false)
    setNewTime('')
    setNewLabel('')
    setNewType('other')
    router.refresh()
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

  const isToday = day === todayDay
  const items   = (userItems[day] ?? []).sort((a, b) => toMin(a.time) - toMin(b.time))
  const currentItem = isToday
    ? [...items].reverse().find((i) => toMin(i.time) <= nowMin) ?? null
    : null
  const todaySaved = reflections.some((r) => r.date === todayDate)

  return (
    <div className="pt-12 pb-32 md:pt-8 md:pb-12">

      {/* Day tabs — mobile only */}
      <div className="px-4 mb-3 md:hidden" dir="rtl">
        <div className="flex gap-1">
          {DAYS.map((d) => (
            <button key={d} onClick={() => setDay(d)}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-xl transition-all ${
                d === day      ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/25' :
                d === todayDay ? 'bg-white/5 text-white/45 border border-white/10' :
                                 'text-white/20'
              }`}
            >
              {DAY_NAMES_HE[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Page title — desktop only */}
      <div className="hidden md:block mb-6" dir="rtl">
        <h1 className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>
          לוז שבועי
        </h1>
      </div>

      {/* Current activity card */}
      {isToday && currentItem && (
        <div className="px-4 md:px-0 mb-3 animate-fade-in" dir="rtl">
          <div className="rounded-2xl p-4 border" style={{
            background:  col(currentItem.type, isDark).bg.replace('0.08', '0.16'),
            borderColor: col(currentItem.type, isDark).border,
            boxShadow:   `0 0 24px ${col(currentItem.type, isDark).border.replace('0.25', '0.10')}`,
          }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: col(currentItem.type, isDark).border }} />
              <span className="text-[10px] text-white/30 tracking-widest uppercase">עכשיו</span>
            </div>
            <p className="text-[17px] font-semibold" style={{ color: col(currentItem.type, isDark).text }}>{currentItem.label}</p>
            {(() => {
              const idx  = items.findIndex((i) => i.time === currentItem.time)
              const next = items[idx + 1]
              return next ? <p className="text-[11px] text-white/30 mt-2">הבא · {next.label} · {next.time}</p> : null
            })()}
          </div>
        </div>
      )}

      {/* Top actions */}
      <div className="px-4 md:px-0 mb-4 flex justify-between items-center" dir="rtl">
        <button onClick={() => setAddOpen((v) => !v)}
          className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors ${
            addOpen ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20' : 'bg-white/4 text-white/30 border-white/8 hover:text-white/50'
          }`}
        >
          {addOpen ? <X size={12} className="inline ml-1" /> : '+'} הוסף ללוז
        </button>
        <button onClick={() => setReflOpen((v) => !v)}
          className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors ${
            todaySaved ? 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20' : 'bg-white/4 text-white/30 border-white/8 hover:text-white/50'
          }`}
        >
          {todaySaved ? '✓ נרשם היום' : '+ מה היה היום'}
        </button>
      </div>

      {/* Add item panel */}
      {addOpen && (
        <div className="px-4 md:px-0 mb-4 animate-fade-in" dir="rtl">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-2">
            <div className="flex gap-2">
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                className="w-24 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm px-2 py-1.5 focus:outline-none focus:border-cyan-400/30"
              />
              <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="שם הפעילות"
                className="flex-1 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm px-3 py-1.5 focus:outline-none focus:border-cyan-400/30 placeholder:text-white/20"
              />
            </div>
            <div className="flex gap-2">
              <select value={newType} onChange={(e) => setNewType(e.target.value)}
                className="flex-1 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm px-3 py-1.5 focus:outline-none"
              >
                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {/* Day selector — desktop only (mobile uses day tabs) */}
              <select value={day} onChange={(e) => setDay(Number(e.target.value))}
                className="hidden md:block flex-1 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm px-3 py-1.5 focus:outline-none"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{DAY_NAMES_HE[d]}{d === todayDay ? ' (היום)' : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={addItem} disabled={saving || !newTime || !newLabel.trim()}
                className="px-4 py-1.5 rounded-lg bg-cyan-400/15 text-cyan-300 text-sm font-medium border border-cyan-400/20 disabled:opacity-30"
              >
                {saving ? '...' : 'הוסף'}
              </button>
              <button onClick={() => setAddOpen(false)} className="px-3 py-1.5 text-white/25 text-sm">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* Reflection panel */}
      {reflOpen && (
        <div className="px-4 md:px-0 mb-4 animate-fade-in" dir="rtl">
          <textarea value={reflText} onChange={(e) => setReflText(e.target.value)}
            placeholder="מה קרה בפועל? מה השתנה מהלוז?"
            className="w-full rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm p-3 resize-none focus:outline-none focus:border-cyan-400/30 placeholder:text-white/20 leading-relaxed"
            rows={2} autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button onClick={saveRefl} disabled={saving || !reflText.trim()}
              className="px-4 py-1.5 rounded-lg bg-cyan-400/15 text-cyan-300 text-sm font-medium border border-cyan-400/20 disabled:opacity-30"
            >
              {saving ? 'שומר...' : 'שמור'}
            </button>
            <button onClick={() => setReflOpen(false)} className="px-3 py-1.5 text-white/25 text-sm">ביטול</button>
          </div>
        </div>
      )}

      {/* Activity list — mobile: selected day */}
      <div className="md:hidden px-4 flex flex-col gap-2">
        {items.map((item) => {
          const isCurrent = isToday && item === currentItem
          const isPast    = isToday && toMin(item.time) < nowMin && !isCurrent
          return (
            <ActivityCard
              key={item.id}
              item={item}
              dayOfWeek={day}
              checked={isToday && checked.has(item.time)}
              note={notes[item.time] ?? ''}
              isCurrent={isCurrent}
              isPast={isPast}
              showCheck={isToday}
              onToggle={() => toggleCheck(item.time)}
              onNote={(t) => saveNote(item.time, t)}
              onSave={saveEdit}
              onDelete={deleteItem}
              getDuplicateCount={getDuplicateCount}
            />
          )
        })}
        {items.length === 0 && (
          <p className="text-center text-white/20 text-sm py-8">אין פעילויות ביום זה</p>
        )}
      </div>

      {/* Activity grid — desktop: all 6 days side-by-side */}
      <div className="hidden md:grid md:grid-cols-6 md:gap-3" dir="rtl">
        {DAYS.map((d) => {
          const dayItems = (userItems[d] ?? []).sort((a, b) => toMin(a.time) - toMin(b.time))
          const isDayToday = d === todayDay
          const isDaySelected = d === day
          const dayCurrentItem = isDayToday
            ? [...dayItems].reverse().find((i) => toMin(i.time) <= nowMin) ?? null
            : null
          return (
            <div
              key={d}
              className="flex flex-col gap-2 rounded-2xl p-3 transition-all cursor-pointer"
              onClick={() => setDay(d)}
              style={{
                background: isDaySelected
                  ? 'rgba(34,211,238,0.05)'
                  : 'var(--c-surface-2)',
                border: isDaySelected
                  ? '1px solid rgba(34,211,238,0.30)'
                  : isDayToday
                  ? '1px solid rgba(34,211,238,0.18)'
                  : '1px solid var(--c-border)',
              }}
            >
              {/* Day header */}
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--c-border)' }}>
                <span
                  className="text-sm font-bold"
                  style={{ color: isDayToday ? 'rgb(103,232,249)' : 'var(--foreground)' }}
                >
                  {DAY_NAMES_HE[d]}
                </span>
                {isDayToday && (
                  <span className="text-[9px] font-semibold tracking-wider uppercase" style={{ color: 'rgb(103,232,249)' }}>
                    היום
                  </span>
                )}
              </div>
              {/* Items */}
              {dayItems.length === 0 ? (
                <p className="text-center text-white/20 text-xs py-4">—</p>
              ) : (
                dayItems.map((item) => {
                  const isCurrent = isDayToday && item === dayCurrentItem
                  const isPast    = isDayToday && toMin(item.time) < nowMin && !isCurrent
                  return (
                    <ActivityCard
                      key={item.id}
                      item={item}
                      dayOfWeek={d}
                      checked={isDayToday && checked.has(item.time)}
                      note={notes[item.time] ?? ''}
                      isCurrent={isCurrent}
                      isPast={isPast}
                      showCheck={isDayToday}
                      onToggle={() => toggleCheck(item.time)}
                      onNote={(t) => saveNote(item.time, t)}
                      onSave={saveEdit}
                      onDelete={deleteItem}
                      getDuplicateCount={getDuplicateCount}
                    />
                  )
                })
              )}
            </div>
          )
        })}
      </div>

      {/* ── Progress section ────────────────────────────────────────────────── */}
      <ProgressSection
        heatMapDays={heatMapDays}
        weeklyActivity={weeklyActivity}
        weekXP={weekXP}
        achievementData={achievementData}
        weekSummary={weekSummary}
        weeklyScheduleChecks={weeklyScheduleChecks}
      />
    </div>
  )
}

// ─── Progress Section ─────────────────────────────────────────────────────────
interface ProgressSectionProps {
  heatMapDays:          { date: string; pct: number }[]
  weeklyActivity:       { date: string; count: number }[]
  weekXP:               number
  achievementData:      AchievementData
  weekSummary:          WeekSummary
  weeklyScheduleChecks: { date: string; count: number }[]
}

function ProgressSection({ heatMapDays, weeklyActivity, weekXP, achievementData, weekSummary, weeklyScheduleChecks }: ProgressSectionProps) {
  const unlockedIds = getUnlockedIds(achievementData)

  return (
    <div className="px-4 md:px-0 mt-8 space-y-6">
      {/* Divider */}
      <div className="flex items-center gap-3" dir="rtl">
        <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>
          התקדמות
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
      </div>

      <WeeklySummary
        habitsCompleted={weekSummary.habitsCompleted}
        bestDomain={weekSummary.bestDomain}
        streak={weekSummary.streak}
        completionPct={weekSummary.completionPct}
      />

      <FridaySummary
        streak={weekSummary.streak}
        habitsCompleted={weekSummary.habitsCompleted}
      />

      <WeeklyChart days={weeklyActivity} scheduleChecks={weeklyScheduleChecks} />

      <HeatMap days={heatMapDays} />

      <div>
        <div className="flex items-center gap-2 mb-3" dir="rtl">
          <span className="text-lg">🏅</span>
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
            הישגים
          </h2>
          <span className="text-xs mr-auto" style={{ color: 'var(--primary)' }}>
            {unlockedIds.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <AchievementsDisplay unlockedIds={unlockedIds} />
      </div>

      <AIInsights
        weekXP={weekXP}
        streak={weekSummary.streak}
        topDomain={weekSummary.bestDomain}
        completionPct={weekSummary.completionPct}
        habitCount={weekSummary.habitCount}
      />
    </div>
  )
}
