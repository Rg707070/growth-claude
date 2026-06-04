'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DAY_NAMES_HE } from '@/lib/schedule'
import { DOMAINS } from '@/lib/domains'
import { Trash2, X, Plus, ChevronRight, ChevronLeft, Check, CalendarDays } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { useLang } from '@/lib/lang'
import { useToast } from '@/components/ui/toast'
import type { DomainTask, DomainGoal } from '@/types/ecosystem'
import type { FamilyTask, FamilyEvent } from '@/types/family'

// ─── Constants ────────────────────────────────────────────────────────────────
const HOUR_START = 5
const HOUR_END = 23
const ROW_H = 28
const DAYS = [0, 1, 2, 3, 4, 5]

const PRESET_COLORS = [
  '#6366F1', '#0EA5E9', '#0D9488', '#10B981',
  '#84CC16', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#6B7280', '#e5e7eb',
]

const TYPE_COLORS: Record<string, string> = {
  torah:  '#5eead4',
  shiur:  '#34d399',
  prayer: '#6ee7b7',
  sports: '#86efac',
  break:  'rgba(255,255,255,0.25)',
  other:  'rgba(255,255,255,0.30)',
}

const TYPE_OPTIONS = [
  { value: 'torah',  label: 'תורה'  },
  { value: 'shiur',  label: 'שיעור' },
  { value: 'prayer', label: 'תפילה' },
  { value: 'sports', label: 'ספורט' },
  { value: 'break',  label: 'הפסקה' },
  { value: 'other',  label: 'אחר'   },
]

const MONTH_NAMES_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
const DAY_SHORT_HE = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','שב']

// ─── Types ────────────────────────────────────────────────────────────────────
type CalendarView = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'

interface ScheduleItem {
  id: string
  time: string
  label: string
  type: string
  color?: string | null
  specificDate: string | null
}

interface AllItem {
  id: string
  day_of_week: number
  label: string
  time: string
  specific_date: string | null
}

interface CheckRow { time: string; note: string | null }

interface ScheduledHabit {
  id: string
  name: string
  domain_slug: string
  schedule_time: string
}

interface HabitFull {
  id: string
  name: string
  domain_slug: string
  frequency: 'daily' | 'weekly'
  schedule_time: string | null
}

interface HabitLogEntry {
  habit_id: string
  completed_at: string
}

interface ActivityCheckEntry {
  date: string
  time: string
}

interface Props {
  userId: string
  userItems: Record<number, ScheduleItem[]>
  allItems: AllItem[]
  todayChecks: CheckRow[]
  scheduledHabits: ScheduledHabit[]
  todayCompletedHabitIds: string[]
  allHabits: HabitFull[]
  weekHabitLogs: HabitLogEntry[]
  weekActivityChecks: ActivityCheckEntry[]
  domainTasks: DomainTask[]
  domainGoals: DomainGoal[]
  familyTasks: FamilyTask[]
  familyEvents: FamilyEvent[]
}

interface WeekDayData {
  dow: number
  date: string
  isFuture: boolean
  dateNum: number
  completedHabitSet: Set<string>
  habitDone: number
  habitTotal: number
  activityDone: number
  activityTotal: number
  activeDomains: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function getWeekDate(dayOfWeek: number): string {
  const today = new Date()
  const d = new Date(today)
  d.setDate(today.getDate() + (dayOfWeek - today.getDay()))
  return d.toISOString().split('T')[0]
}

function activityColor(item: ScheduleItem): string {
  return item.color ?? TYPE_COLORS[item.type] ?? 'rgba(255,255,255,0.30)'
}

function w(a: number, dk: boolean): string {
  return dk ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${Math.min(0.8, a * 2)})`
}

function hexBg(color: string): string {
  return color.startsWith('#') ? `${color}22` : color.replace(/[\d.]+\)$/, '0.12)')
}

function hexBorder(color: string): string {
  return color.startsWith('#') ? `${color}55` : color.replace(/[\d.]+\)$/, '0.35)')
}

// ─── ScopeModal ───────────────────────────────────────────────────────────────
function ScopeModal({ label, matchCount, onSelect, onCancel }: {
  label: string; matchCount: number
  onSelect: (scope: 'single' | 'all' | 'once') => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm animate-fade-in" style={{ background: 'var(--card)', border: '1px solid var(--c-border)', borderRadius: '24px', overflow: 'hidden' }}>
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>שינוי &quot;{label}&quot;</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>קיים ב-{matchCount} ימים נוספים</p>
            </div>
            <button onClick={onCancel} aria-label="סגור" className="p-1 rounded-lg" style={{ color: 'var(--muted-foreground)' }}><X size={16} /></button>
          </div>
        </div>
        <div className="p-3 flex flex-col gap-2">
          {([
            { scope: 'single' as const, icon: '📌', title: 'רק ביום זה',                sub: 'שינוי ליום זה בלבד', bg: 'rgba(99,102,241,0.15)' },
            { scope: 'all'    as const, icon: '🔄', title: `כל הימים (${matchCount+1})`, sub: 'שינוי בכל הימים',   bg: 'rgba(34,211,238,0.12)' },
            { scope: 'once'   as const, icon: '⚡', title: 'חד פעמי',                    sub: 'רק השבוע',           bg: 'rgba(52,211,153,0.15)' },
          ]).map(({ scope, icon, title, sub, bg }) => (
            <button key={scope} onClick={() => onSelect(scope)}
              className="flex items-center gap-3 w-full text-right px-4 py-3 rounded-2xl"
              style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base" style={{ background: bg }}>{icon}</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{title}</p>
                <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── ColorPicker ──────────────────────────────────────────────────────────────
function ColorPicker({ value, onChange }: { value: string | null; onChange: (c: string | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px]"
        style={{
          background:  'var(--muted)',
          borderColor: value === null ? 'rgb(103,232,249)' : 'var(--c-border)',
          color:       'var(--muted-foreground)',
        }}
      >∅</button>
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className="w-7 h-7 rounded-full border-2 transition-all"
          style={{
            background:  c,
            borderColor: value === c ? 'rgb(103,232,249)' : 'transparent',
            boxShadow:   value === c ? `0 0 8px ${c}88` : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ─── EditSheet ────────────────────────────────────────────────────────────────
function EditSheet({ item, dayOfWeek, getDuplicateCount, onSave, onDelete, onClose }: {
  item: ScheduleItem
  dayOfWeek: number
  getDuplicateCount: (label: string, day: number) => number
  onSave: (id: string, scope: 'single' | 'all' | 'once', time: string, label: string, type: string, color: string | null, dayOfWeek: number) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}) {
  const { t } = useLang()
  const [editTime,  setEditTime]  = useState(item.time)
  const [editLabel, setEditLabel] = useState(item.label)
  const [editType,  setEditType]  = useState(item.type)
  const [editColor, setEditColor] = useState<string | null>(item.color ?? null)
  const [showScope, setShowScope] = useState(false)
  const [busy,      setBusy]      = useState(false)

  function handleSave() {
    if (!editLabel.trim() || !editTime) return
    if (getDuplicateCount(item.label, dayOfWeek) > 0) setShowScope(true)
    else confirmSave('single')
  }

  async function confirmSave(scope: 'single' | 'all' | 'once') {
    setShowScope(false); setBusy(true)
    await onSave(item.id, scope, editTime, editLabel.trim(), editType, editColor, dayOfWeek)
    setBusy(false); onClose()
  }

  async function handleDelete() { setBusy(true); await onDelete(item.id); onClose() }

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
      <div className="fixed inset-0 z-40 flex items-end" dir="rtl">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 w-full rounded-t-3xl animate-fade-in flex flex-col" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', maxHeight: '80dvh' }}>
          <div className="w-8 h-1 rounded-full bg-white/20 mx-auto mt-4 flex-shrink-0" />
          <div className="flex gap-2 items-center px-5 pt-4 pb-3 border-b flex-shrink-0" style={{ borderColor: 'var(--c-border)' }}>
            <button onClick={handleSave} disabled={busy || !editLabel.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30" style={{ background: 'rgba(34,211,238,0.15)', color: 'rgb(103,232,249)', border: '1px solid rgba(34,211,238,0.25)' }}>
              {busy ? '...' : 'שמור'}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm" style={{ color: 'var(--muted-foreground)' }}>ביטול</button>
            <button onClick={handleDelete} disabled={busy} className="p-2.5 rounded-xl border disabled:opacity-30" style={{ color: 'rgba(248,113,113,0.7)', borderColor: 'rgba(248,113,113,0.2)' }}>
              <Trash2 size={16} />
            </button>
          </div>
          <div className="p-5 flex flex-col gap-4 overflow-y-auto" style={{ paddingBottom: 'max(80px, env(safe-area-inset-bottom, 80px))' }}>
            <div className="flex gap-2">
              <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className="w-24 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm px-3 py-2.5 focus:outline-none focus:border-cyan-400/30" />
              <input value={editLabel} onChange={e => setEditLabel(e.target.value)} placeholder={t('activityName')} className="flex-1 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm px-3 py-2.5 focus:outline-none focus:border-cyan-400/30" />
            </div>
            <select value={editType} onChange={e => setEditType(e.target.value)} className="rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm px-3 py-2.5 focus:outline-none">
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div>
              <p className="text-[11px] mb-2" style={{ color: 'var(--muted-foreground)' }}>צבע</p>
              <ColorPicker value={editColor} onChange={setEditColor} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── AddSheet ─────────────────────────────────────────────────────────────────
function AddSheet({ defaultHour, onAdd, onClose }: {
  defaultHour: number | null
  onAdd: (time: string, label: string, type: string, color: string | null) => Promise<void>
  onClose: () => void
}) {
  const { t } = useLang()
  const defaultTime = defaultHour !== null ? `${String(defaultHour).padStart(2, '0')}:00` : ''
  const [time,  setTime]  = useState(defaultTime)
  const [label, setLabel] = useState('')
  const [type,  setType]  = useState('other')
  const [color, setColor] = useState<string | null>(null)
  const [busy,  setBusy]  = useState(false)

  async function handleAdd() {
    if (!time || !label.trim()) return
    setBusy(true)
    await onAdd(time, label.trim(), type, color)
    setBusy(false); onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full rounded-t-3xl animate-fade-in flex flex-col" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', maxHeight: '80dvh' }}>
        <div className="w-8 h-1 rounded-full bg-white/20 mx-auto mt-4 flex-shrink-0" />
        <div className="flex gap-2 items-center px-5 pt-4 pb-3 border-b flex-shrink-0" style={{ borderColor: 'var(--c-border)' }}>
          <button onClick={handleAdd} disabled={busy || !label.trim() || !time} className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30" style={{ background: 'rgba(34,211,238,0.15)', color: 'rgb(103,232,249)', border: '1px solid rgba(34,211,238,0.25)' }}>
            {busy ? '...' : 'הוסף'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm" style={{ color: 'var(--muted-foreground)' }}>ביטול</button>
        </div>
        <div className="p-5 flex flex-col gap-4 overflow-y-auto" style={{ paddingBottom: 'max(80px, env(safe-area-inset-bottom, 80px))' }}>
          <div className="flex gap-2">
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-24 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm px-3 py-2.5 focus:outline-none focus:border-cyan-400/30" />
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder={t('activityName')} autoFocus className="flex-1 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm px-3 py-2.5 focus:outline-none focus:border-cyan-400/30" />
          </div>
          <select value={type} onChange={e => setType(e.target.value)} className="rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm px-3 py-2.5 focus:outline-none">
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div>
            <p className="text-[11px] mb-2" style={{ color: 'var(--muted-foreground)' }}>צבע</p>
            <ColorPicker value={color} onChange={setColor} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ActivityBlock ────────────────────────────────────────────────────────────
function ActivityBlock({ item, isToday, isChecked, isActive, onEdit, onToggle }: {
  item: ScheduleItem
  isToday: boolean
  isChecked: boolean
  isActive?: boolean
  onEdit: () => void
  onToggle: () => void
}) {
  const clr = activityColor(item)
  return (
    <div
      className="flex items-center gap-1 rounded-lg border transition-all overflow-hidden"
      style={{
        height: 22,
        background:  isChecked ? 'rgba(52,211,153,0.06)' : isActive ? (clr.startsWith('#') ? `${clr}33` : clr.replace(/[\d.]+\)$/, '0.20)')) : hexBg(clr),
        borderColor: isChecked ? 'rgba(52,211,153,0.25)' : isActive ? (clr.startsWith('#') ? `${clr}99` : clr.replace(/[\d.]+\)$/, '0.50)')) : hexBorder(clr),
        borderRightWidth: 3,
        borderRightColor: clr,
        opacity:     isChecked ? 0.55 : 1,
      }}
    >
      <button onClick={onEdit} className="flex-1 min-w-0 flex items-center gap-1 px-1.5 h-full overflow-hidden" dir="rtl">
        <span className="text-[10px] font-semibold truncate flex-1" style={{ color: isChecked ? 'var(--muted-foreground)' : clr, textDecoration: isChecked ? 'line-through' : 'none' }}>{item.label}</span>
        <span className="text-[9px] font-mono flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>{item.time.slice(0,5)}</span>
      </button>
      {isToday && (
        <button
          onClick={onToggle}
          className="w-5 h-full px-1 flex items-center justify-center flex-shrink-0 transition-all border-r"
          style={{
            background:  isChecked ? 'rgba(52,211,153,0.20)' : 'transparent',
            borderColor: isChecked ? 'rgba(52,211,153,0.30)' : 'var(--c-border)',
          }}
        >
          {isChecked && <Check size={8} className="text-emerald-400" />}
        </button>
      )}
    </div>
  )
}

// ─── HabitBlock ───────────────────────────────────────────────────────────────
function HabitBlock({ habit, isCompleted, isToday, isActive, onToggle }: {
  habit: ScheduledHabit
  isCompleted: boolean
  isToday: boolean
  isActive?: boolean
  onToggle: () => Promise<void>
}) {
  const domain = DOMAINS.find(d => d.slug === habit.domain_slug)
  const clr = domain?.color ?? '#6366F1'
  return (
    <div
      className="flex items-center gap-1 rounded-lg border transition-all overflow-hidden"
      style={{
        height: 22,
        background:  isCompleted ? 'rgba(52,211,153,0.06)' : isActive ? `${clr}28` : `${clr}18`,
        borderColor: isCompleted ? 'rgba(52,211,153,0.25)' : isActive ? `${clr}80` : `${clr}40`,
        borderRightWidth: 3,
        borderRightColor: clr,
        opacity:     isCompleted ? 0.55 : 1,
      }}
    >
      <div className="flex-1 min-w-0 flex items-center gap-1 px-1.5 h-full overflow-hidden" dir="rtl">
        <span className="text-xs flex-shrink-0 leading-none">{domain?.icon ?? '✦'}</span>
        <span className="text-[10px] font-semibold truncate flex-1" style={{ color: isCompleted ? 'var(--muted-foreground)' : clr, textDecoration: isCompleted ? 'line-through' : 'none' }}>{habit.name}</span>
        <span className="text-[9px] font-mono flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>{habit.schedule_time.slice(0, 5)}</span>
      </div>
      {isToday && (
        <button
          onClick={onToggle}
          className="w-5 h-full px-1 flex items-center justify-center flex-shrink-0 transition-all border-r"
          style={{
            background:  isCompleted ? 'rgba(52,211,153,0.20)' : 'transparent',
            borderColor: isCompleted ? 'rgba(52,211,153,0.30)' : `${clr}40`,
          }}
        >
          {isCompleted && <Check size={8} className="text-emerald-400" />}
        </button>
      )}
    </div>
  )
}

// ─── ScheduleTable ────────────────────────────────────────────────────────────
function ScheduleTable({ items, habits, completedHabitIds, dayOfWeek, isToday, checked, onSelectDay, onEdit, onAdd, onToggle, onToggleHabit }: {
  items: ScheduleItem[]
  habits: ScheduledHabit[]
  completedHabitIds: Set<string>
  dayOfWeek: number
  isToday: boolean
  checked: Set<string>
  onSelectDay: (d: number) => void
  onEdit: (item: ScheduleItem) => void
  onAdd: (hour: number | null) => void
  onToggle: (time: string) => void
  onToggleHabit: (habitId: string) => Promise<void>
}) {
  const { isDark }  = useTheme()
  const scrollRef   = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const h = new Date().getHours()
    if (h >= HOUR_START) {
      const top = Math.max(0, (h - HOUR_START - 1) * ROW_H)
      scrollRef.current?.scrollTo({ top, behavior: 'smooth' })
    }
  }, [dayOfWeek])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 50) {
      onSelectDay(dx < 0 ? Math.min(5, dayOfWeek + 1) : Math.max(0, dayOfWeek - 1))
    }
  }

  const itemsByHour: Record<number, ScheduleItem[]> = {}
  for (const item of items) {
    const h = parseInt(item.time.split(':')[0])
    if (h >= HOUR_START && h <= HOUR_END) {
      if (!itemsByHour[h]) itemsByHour[h] = []
      itemsByHour[h].push(item)
    }
  }

  const habitsByHour: Record<number, ScheduledHabit[]> = {}
  for (const habit of habits) {
    const h = parseInt(habit.schedule_time.split(':')[0])
    if (h >= HOUR_START && h <= HOUR_END) {
      if (!habitsByHour[h]) habitsByHour[h] = []
      habitsByHour[h].push(habit)
    }
  }

  const dayDate = new Date()
  dayDate.setDate(dayDate.getDate() + (dayOfWeek - dayDate.getDay()))
  const dayLabel = `${dayDate.getDate()}/${dayDate.getMonth() + 1}`
  const nowH = now?.getHours() ?? -1
  const nowM = now?.getMinutes() ?? 0
  const nowTotalMin = isToday && now ? nowH * 60 + nowM : -1

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Date header — RTL: first child = RIGHT = earlier (Sunday dir), last child = LEFT = later (Friday dir) */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0" dir="rtl"
        style={{ borderBottom: `1px solid ${w(0.06, isDark)}` }}>
        <button
          onClick={() => onSelectDay(Math.max(0, dayOfWeek - 1))}
          disabled={dayOfWeek === 0}
          className="p-1.5 rounded-lg disabled:opacity-20"
          style={{ color: w(0.4, isDark) }}
        >
          <ChevronRight size={18} />
        </button>
        <div className="text-center">
          <span className="text-sm font-bold" style={{ color: isToday ? 'rgb(103,232,249)' : w(0.7, isDark) }}>
            {DAY_NAMES_HE[dayOfWeek]}
          </span>
          <span className="text-[11px] mr-2 font-mono" style={{ color: w(0.28, isDark) }}>{dayLabel}</span>
          {isToday && (
            <span className="text-[9px] mr-1 font-semibold" style={{ color: 'rgb(103,232,249)' }}>היום</span>
          )}
        </div>
        <button
          onClick={() => onSelectDay(Math.min(5, dayOfWeek + 1))}
          disabled={dayOfWeek === 5}
          className="p-1.5 rounded-lg disabled:opacity-20"
          style={{ color: w(0.4, isDark) }}
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Hour grid */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-0"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => {
          const h          = HOUR_START + i
          const hourItems  = (itemsByHour[h] ?? []).sort((a, b) => toMin(a.time) - toMin(b.time))
          const hourHabits = (habitsByHour[h] ?? []).sort((a, b) => toMin(a.schedule_time) - toMin(b.schedule_time))
          const isCurHour  = isToday && h === nowH
          const isEmpty    = hourItems.length === 0 && hourHabits.length === 0
          const activeItemId  = isCurHour ? (hourItems.filter(it => toMin(it.time) <= nowTotalMin).at(-1)?.id ?? null) : null
          const activeHabitId = isCurHour ? (hourHabits.filter(hb => toMin(hb.schedule_time) <= nowTotalMin).at(-1)?.id ?? null) : null

          return (
            <div
              key={h}
              className="flex relative"
              style={{
                minHeight:    ROW_H,
                borderBottom: `1px solid ${w(0.05, isDark)}`,
                borderLeft:   '2px solid transparent',
                background:   isCurHour ? 'rgba(34,211,238,0.04)' : 'transparent',
              }}
            >
              {/* Hour label */}
              <div className="w-8 flex-shrink-0 flex items-start justify-center pt-1" style={{ direction: 'ltr' }}>
                {isCurHour ? (
                  <span
                    className="text-[9px] font-mono font-bold rounded-full flex items-center justify-center"
                    style={{
                      color:      'oklch(0.08 0.035 240)',
                      background: 'rgb(103,232,249)',
                      width: 18, height: 18, lineHeight: 1,
                    }}
                  >
                    {String(h).padStart(2, '0')}
                  </span>
                ) : (
                  <span className="text-[9px] font-mono" style={{ color: w(0.18, isDark) }}>
                    {String(h).padStart(2, '0')}
                  </span>
                )}
              </div>

              {/* Activities + Habits */}
              <div
                className="flex-1 flex flex-col gap-0.5 py-0.5 px-1"
                dir="rtl"
                onClick={() => { if (isEmpty) onAdd(h) }}
                style={{ cursor: isEmpty ? 'pointer' : 'default' }}
              >
                {hourItems.map(item => (
                  <ActivityBlock
                    key={item.id}
                    item={item}
                    isToday={isToday}
                    isChecked={isToday && checked.has(item.time)}
                    isActive={item.id === activeItemId}
                    onEdit={() => onEdit(item)}
                    onToggle={() => onToggle(item.time)}
                  />
                ))}
                {hourHabits.map(habit => (
                  <HabitBlock
                    key={habit.id}
                    habit={habit}
                    isCompleted={completedHabitIds.has(habit.id)}
                    isToday={isToday}
                    isActive={habit.id === activeHabitId}
                    onToggle={() => onToggleHabit(habit.id)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add button */}
      <div className="px-3 py-2 border-t flex-shrink-0" style={{ borderColor: w(0.06, isDark) }} dir="rtl">
        <button
          onClick={() => onAdd(null)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
          style={{ background: 'rgba(34,211,238,0.08)', color: 'rgb(103,232,249)', border: '1px solid rgba(34,211,238,0.20)' }}
        >
          <Plus size={13} />
          הוסף ל{DAY_NAMES_HE[dayOfWeek]}
        </button>
      </div>
    </div>
  )
}

// ─── WeeklyOverview ───────────────────────────────────────────────────────────
function WeeklyOverview({ weekData, dailyHabits, userItems, isDark, onSelectDayAndView }: {
  weekData: WeekDayData[]
  dailyHabits: HabitFull[]
  userItems: Record<number, ScheduleItem[]>
  isDark: boolean
  onSelectDayAndView: (dow: number) => void
}) {
  const todayDay = new Date().getDay()

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-2" dir="rtl">
      {DAYS.map(dow => {
        const dayD = weekData.find(d => d.dow === dow)
        if (!dayD) return null
        const items = (userItems[dow] ?? []).sort((a, b) => toMin(a.time) - toMin(b.time))
        const isToday = dow === todayDay
        const compRate = dayD.habitTotal > 0 && !dayD.isFuture ? dayD.habitDone / dayD.habitTotal : 0

        return (
          <button
            key={dow}
            onClick={() => onSelectDayAndView(dow)}
            className="w-full text-right rounded-2xl p-4 transition-all active:scale-[0.99]"
            style={{
              background: isToday ? 'rgba(34,211,238,0.06)' : w(0.04, isDark),
              border: `1px solid ${isToday ? 'rgba(34,211,238,0.20)' : w(0.06, isDark)}`,
            }}
          >
            {/* Day header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: isToday ? 'rgb(103,232,249)' : w(0.8, isDark) }}>
                  {DAY_NAMES_HE[dow]}
                </span>
                <span className="text-xs font-mono" style={{ color: w(0.3, isDark) }}>{dayD.dateNum}</span>
                {isToday && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(34,211,238,0.15)', color: 'rgb(103,232,249)' }}>
                    היום
                  </span>
                )}
              </div>
              {!dayD.isFuture && dayD.habitTotal > 0 && (
                <span className="text-xs font-bold"
                  style={{ color: compRate >= 1 ? 'rgb(52,211,153)' : w(0.45, isDark) }}>
                  {dayD.habitDone}/{dayD.habitTotal}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {dayD.habitTotal > 0 && !dayD.isFuture && (
              <div className="h-1 rounded-full overflow-hidden mb-2" style={{ background: w(0.08, isDark) }}>
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${compRate * 100}%`,
                    background: compRate >= 1 ? 'rgb(52,211,153)' : 'rgb(103,232,249)',
                  }} />
              </div>
            )}

            {/* Activity preview */}
            {items.length > 0 && (
              <div className="flex flex-col gap-1 mb-2">
                {items.slice(0, 3).map(item => {
                  const clr = activityColor(item)
                  return (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: clr }} />
                      <span className="text-xs truncate" style={{ color: w(0.55, isDark) }}>
                        {item.time.slice(0, 5)} {item.label}
                      </span>
                    </div>
                  )
                })}
                {items.length > 3 && (
                  <span className="text-[10px] pr-3.5" style={{ color: w(0.28, isDark) }}>
                    +{items.length - 3} עוד
                  </span>
                )}
              </div>
            )}

            {/* Domain dots */}
            {dayD.activeDomains.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {dayD.activeDomains.map(slug => {
                  const d = DOMAINS.find(x => x.slug === slug)
                  if (!d) return null
                  const allDone = !dayD.isFuture && dailyHabits
                    .filter(h => h.domain_slug === slug)
                    .every(h => dayD.completedHabitSet.has(h.id))
                  return (
                    <div key={slug} className="w-2 h-2 rounded-full"
                      style={{ background: allDone ? d.color : `${d.color}50` }} />
                  )
                })}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── MonthlyView ──────────────────────────────────────────────────────────────
function MonthlyView({ userId, allHabits, isDark, monthOffset, onMonthOffsetChange, onSelectDate }: {
  userId: string
  allHabits: HabitFull[]
  isDark: boolean
  monthOffset: number
  onMonthOffsetChange: (o: number) => void
  onSelectDate: (dateStr: string) => void
}) {
  const [dayData, setDayData] = useState<Record<string, { habits: number; activities: number }>>({})
  const [loading, setLoading] = useState(true)
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [clickedCell, setClickedCell] = useState<string | null>(null)

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const { startDate, endDate, year, month, daysInMonth, startDow } = useMemo(() => {
    const base = new Date()
    const vm = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1)
    const y = vm.getFullYear()
    const m = vm.getMonth()
    const first = new Date(y, m, 1)
    const last  = new Date(y, m + 1, 0)
    return {
      startDate:  first.toISOString().split('T')[0],
      endDate:    last.toISOString().split('T')[0],
      year: y, month: m,
      daysInMonth: last.getDate(),
      startDow:   first.getDay(),
    }
  }, [monthOffset])

  const dailyHabitCount = useMemo(() => allHabits.filter(h => h.frequency === 'daily').length, [allHabits])

  useEffect(() => {
    setLoading(true)
    const sb = createClient()
    Promise.all([
      sb.from('habit_logs').select('completed_at').eq('user_id', userId).gte('completed_at', startDate).lte('completed_at', endDate),
      sb.from('activity_checks').select('date').eq('user_id', userId).gte('date', startDate).lte('date', endDate),
    ]).then(([{ data: logs }, { data: checks }]) => {
      const dd: Record<string, { habits: number; activities: number }> = {}
      for (const log of logs ?? []) {
        if (!dd[log.completed_at]) dd[log.completed_at] = { habits: 0, activities: 0 }
        dd[log.completed_at].habits++
      }
      for (const check of checks ?? []) {
        if (!dd[check.date]) dd[check.date] = { habits: 0, activities: 0 }
        dd[check.date].activities++
      }
      setDayData(dd)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [userId, startDate, endDate])

  const cells: (number | null)[] = [
    ...Array<null>(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function handleCellClick(dateStr: string) {
    setClickedCell(dateStr)
    setTimeout(() => { setClickedCell(null); onSelectDate(dateStr) }, 180)
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3" dir="rtl">
      {/* Month navigation — RTL: first child = RIGHT = go to earlier month */}
      <div className="flex items-center justify-between">
        <button onClick={() => onMonthOffsetChange(monthOffset - 1)} className="p-1.5 rounded-lg"
          style={{ color: w(0.5, isDark) }}>
          <ChevronRight size={18} />
        </button>
        <span className="text-sm font-bold" style={{ color: w(0.85, isDark) }}>
          {MONTH_NAMES_HE[month]} {year}
        </span>
        <button onClick={() => onMonthOffsetChange(monthOffset + 1)} disabled={monthOffset >= 0}
          className="p-1.5 rounded-lg disabled:opacity-20"
          style={{ color: w(0.5, isDark) }}>
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Day-of-week headers — RTL: index 0 (Sunday/א׳) on right, index 6 (Shabbat) on left */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_SHORT_HE.map((name, i) => (
          <div key={i} className="text-center text-[10px] font-semibold py-1"
            style={{ color: i === 6 ? 'rgba(248,113,113,0.6)' : w(0.35, isDark) }}>
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <span className="text-sm" style={{ color: w(0.3, isDark) }}>טוען...</span>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} />
            const mm = String(month + 1).padStart(2, '0')
            const dd = String(day).padStart(2, '0')
            const dateStr = `${year}-${mm}-${dd}`
            const isToday   = dateStr === todayStr
            const isFuture  = dateStr > todayStr
            const isShabbat = new Date(`${dateStr}T12:00:00`).getDay() === 6
            const isClickable = !isFuture && !isShabbat
            const entry = dayData[dateStr]
            const habitRate = dailyHabitCount > 0 && entry ? Math.min(1, entry.habits / dailyHabitCount) : 0
            const isHovered = hoveredCell === dateStr
            const isClicked = clickedCell === dateStr

            let bg = 'transparent'
            if (!isFuture && !isShabbat && entry) bg = `rgba(34,211,238,${0.06 + habitRate * 0.25})`
            if (isShabbat) bg = 'rgba(248,113,113,0.06)'
            if (isToday)   bg = 'rgba(34,211,238,0.15)'

            return (
              <div
                key={idx}
                onClick={() => isClickable && handleCellClick(dateStr)}
                onMouseEnter={() => isClickable && setHoveredCell(dateStr)}
                onMouseLeave={() => setHoveredCell(null)}
                className="aspect-square flex flex-col items-center justify-center rounded-xl"
                style={{
                  background: bg,
                  border: isToday
                    ? '1px solid rgba(34,211,238,0.40)'
                    : isHovered && isClickable
                      ? '1px solid rgba(34,211,238,0.28)'
                      : '1px solid transparent',
                  opacity: isFuture ? 0.35 : 1,
                  cursor: isClickable ? 'pointer' : 'default',
                  transform: isClicked ? 'scale(1.18)' : isHovered && isClickable ? 'scale(1.06)' : 'scale(1)',
                  transition: 'transform 160ms cubic-bezier(.34,1.56,.64,1), border-color 120ms ease',
                  zIndex: isClicked || isHovered ? 1 : 0,
                  position: 'relative',
                }}
              >
                <span className="text-[11px] font-bold leading-none"
                  style={{ color: isToday ? 'rgb(103,232,249)' : isShabbat ? 'rgba(248,113,113,0.7)' : w(0.7, isDark) }}>
                  {day}
                </span>
                {isShabbat ? (
                  <span className="text-[7px] leading-none mt-0.5" style={{ color: 'rgba(248,113,113,0.45)' }}>שב׳</span>
                ) : (
                  !isFuture && entry && (
                    <div className="flex gap-0.5 mt-0.5">
                      {entry.habits > 0 && <div className="w-1 h-1 rounded-full" style={{ background: 'rgb(52,211,153)' }} />}
                      {entry.activities > 0 && <div className="w-1 h-1 rounded-full" style={{ background: 'rgb(103,232,249)' }} />}
                    </div>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 justify-center pt-1 pb-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: 'rgb(52,211,153)' }} />
          <span className="text-[10px]" style={{ color: w(0.4, isDark) }}>הרגלים</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: 'rgb(103,232,249)' }} />
          <span className="text-[10px]" style={{ color: w(0.4, isDark) }}>פעילויות</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(248,113,113,0.5)' }} />
          <span className="text-[10px]" style={{ color: w(0.4, isDark) }}>שבת</span>
        </div>
        <span className="text-[9px] opacity-40" style={{ color: w(0.5, isDark) }}>· לחץ ליומי</span>
      </div>
    </div>
  )
}

// ─── YearlyTooltip ────────────────────────────────────────────────────────────
function YearlyTooltip({ dateStr, count, dailyHabitCount, isDark }: {
  dateStr: string
  count: number
  dailyHabitCount: number
  isDark: boolean
}) {
  const d = new Date(dateStr + 'T12:00:00')
  const rate = dailyHabitCount > 0 ? Math.round((count / dailyHabitCount) * 100) : 0
  return (
    <div style={{
      padding: '7px 11px',
      borderRadius: 10,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      background: isDark ? 'rgba(6,14,26,0.90)' : 'rgba(238,248,255,0.92)',
      border: '1px solid rgba(34,211,238,0.30)',
      boxShadow: '0 8px 28px rgba(0,0,0,0.38), 0 0 0 1px rgba(34,211,238,0.08)',
      direction: 'rtl',
      whiteSpace: 'nowrap',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgb(103,232,249)' }}>
        {DAY_SHORT_HE[d.getDay()]} {d.getDate()} {MONTH_NAMES_HE[d.getMonth()]}
      </div>
      <div style={{ fontSize: 9, marginTop: 2, color: count > 0 ? w(0.65, isDark) : w(0.32, isDark) }}>
        {d.getDay() === 6 ? 'שבת' : count > 0 ? `${count} הרגלים${dailyHabitCount > 0 ? ` · ${rate}%` : ''}` : 'אין פעילות'}
      </div>
    </div>
  )
}

// ─── QuarterHeatmap ───────────────────────────────────────────────────────────
function QuarterHeatmap({ weeks, byDay, dailyHabitCount, todayStr, isDark, onCellClick }: {
  weeks: string[][]
  byDay: Record<string, number>
  dailyHabitCount: number
  todayStr: string
  isDark: boolean
  onCellClick: (dateStr: string) => void
}) {
  const [tooltip, setTooltip] = useState<{ dateStr: string; top: number; left: number } | null>(null)
  const [clickedCell, setClickedCell] = useState<string | null>(null)

  function getCellColor(dateStr: string): string {
    if (dateStr > todayStr) return w(0.04, isDark)
    const dow = new Date(dateStr + 'T12:00:00').getDay()
    if (dow === 6) return 'rgba(248,113,113,0.10)'
    const count = byDay[dateStr] ?? 0
    if (count === 0) return w(0.07, isDark)
    const rate = dailyHabitCount > 0 ? count / dailyHabitCount : 0.5
    if (rate <= 0.25) return 'rgba(34,211,238,0.22)'
    if (rate <= 0.5)  return 'rgba(34,211,238,0.44)'
    if (rate <= 0.75) return 'rgba(34,211,238,0.64)'
    return 'rgba(52,211,153,0.84)'
  }

  function handleMouseEnter(e: React.MouseEvent<HTMLDivElement>, dateStr: string) {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({ dateStr, top: rect.top, left: rect.left + rect.width / 2 })
  }

  function handleClick(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00')
    if (dateStr > todayStr || d.getDay() === 6) return
    setTooltip(null)
    setClickedCell(dateStr)
    setTimeout(() => { setClickedCell(null); onCellClick(dateStr) }, 200)
  }

  return (
    <div style={{ direction: 'ltr', position: 'relative' }}>
      {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
        <div key={dayIdx} className="flex items-center" style={{ gap: 2, marginBottom: 2 }}>
          <div style={{
            width: 12, fontSize: 7, flexShrink: 0, textAlign: 'right', paddingRight: 2,
            color: dayIdx === 6 ? 'rgba(248,113,113,0.45)' : w(0.22, isDark),
          }}>
            {DAY_SHORT_HE[dayIdx].replace('׳', '')}
          </div>
          {weeks.map((week, wIdx) => {
            const dateStr = week[dayIdx]
            const d = new Date(dateStr + 'T12:00:00')
            const isClickable = dateStr <= todayStr && d.getDay() !== 6
            const isClicked = clickedCell === dateStr
            return (
              <div
                key={wIdx}
                onMouseEnter={e => handleMouseEnter(e, dateStr)}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => handleClick(dateStr)}
                style={{
                  width: 9, height: 9, flexShrink: 0, borderRadius: 2,
                  background: getCellColor(dateStr),
                  cursor: isClickable ? 'pointer' : 'default',
                  transform: isClicked ? 'scale(1.7)' : 'scale(1)',
                  transition: 'transform 200ms cubic-bezier(.34,1.56,.64,1)',
                  position: 'relative', zIndex: isClicked ? 3 : 1,
                }}
              />
            )
          })}
        </div>
      ))}
      {tooltip && (
        <div style={{
          position: 'fixed',
          top: tooltip.top - 62,
          left: Math.max(4, Math.min(tooltip.left - 58, (typeof window !== 'undefined' ? window.innerWidth : 400) - 125)),
          zIndex: 300,
          pointerEvents: 'none',
        }}>
          <YearlyTooltip
            dateStr={tooltip.dateStr}
            count={byDay[tooltip.dateStr] ?? 0}
            dailyHabitCount={dailyHabitCount}
            isDark={isDark}
          />
        </div>
      )}
    </div>
  )
}

// ─── YearlyView ───────────────────────────────────────────────────────────────
function YearlyView({ userId, allHabits, isDark, onSelectDate }: {
  userId: string
  allHabits: HabitFull[]
  isDark: boolean
  onSelectDate: (dateStr: string) => void
}) {
  const [byDay, setByDay] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [totalDone, setTotalDone] = useState(0)

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const startDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 364)
    return d.toISOString().split('T')[0]
  }, [])

  const dailyHabitCount = useMemo(() => allHabits.filter(h => h.frequency === 'daily').length, [allHabits])

  useEffect(() => {
    const sb = createClient()
    sb.from('habit_logs')
      .select('completed_at')
      .eq('user_id', userId)
      .gte('completed_at', startDate)
      .lte('completed_at', todayStr)
      .then(({ data: logs }) => {
        const bd: Record<string, number> = {}
        for (const log of logs ?? []) {
          bd[log.completed_at] = (bd[log.completed_at] ?? 0) + 1
        }
        setByDay(bd)
        setTotalDone(Object.values(bd).reduce((s, v) => s + v, 0))

        let s = 0
        const cur = new Date()
        for (let i = 0; i < 365; i++) {
          const ds = cur.toISOString().split('T')[0]
          if (ds < startDate) break
          if (cur.getDay() !== 6) {
            if (bd[ds] && bd[ds] >= Math.max(1, Math.floor(dailyHabitCount * 0.5))) s++
            else break
          }
          cur.setDate(cur.getDate() - 1)
        }
        setStreak(s)
        setLoading(false)
      })
      .then(undefined, () => setLoading(false))
  }, [userId, startDate, todayStr, dailyHabitCount])

  const allWeeks = useMemo(() => {
    const startSun = new Date(startDate + 'T12:00:00')
    startSun.setDate(startSun.getDate() - startSun.getDay())
    const end = new Date(todayStr + 'T12:00:00')
    const result: string[][] = []
    const cur = new Date(startSun)
    while (cur <= end) {
      const week: string[] = []
      for (let i = 0; i < 7; i++) {
        week.push(cur.toISOString().split('T')[0])
        cur.setDate(cur.getDate() + 1)
      }
      result.push(week)
    }
    return result
  }, [startDate, todayStr])

  type QuarterData = { key: string; label: string; monthRange: string; weeks: string[][]; total: number }

  const quarters = useMemo((): QuarterData[] => {
    const QLABELS = ['Q1', 'Q2', 'Q3', 'Q4']
    const QRANGES = ['ינ׳–מרץ', 'אפ׳–יוני', 'יול׳–ספ׳', 'אוק׳–דצ׳']
    const map = new Map<string, QuarterData>()
    for (const week of allWeeks) {
      const d = new Date(week[0] + 'T12:00:00')
      const y = d.getFullYear()
      const qi = Math.floor(d.getMonth() / 3)
      const key = `${y}-Q${qi + 1}`
      if (!map.has(key)) map.set(key, { key, label: `${QLABELS[qi]} ${y}`, monthRange: QRANGES[qi], weeks: [], total: 0 })
      const q = map.get(key)!
      q.weeks.push(week)
      for (const ds of week) q.total += byDay[ds] ?? 0
    }
    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key))
  }, [allWeeks, byDay])

  const activeDayCount = useMemo(() => Object.keys(byDay).length, [byDay])
  const totalDays = useMemo(() => {
    let count = 0
    const cur = new Date(startDate + 'T12:00:00')
    const end = new Date(todayStr + 'T12:00:00')
    while (cur <= end) { if (cur.getDay() !== 6) count++; cur.setDate(cur.getDate() + 1) }
    return count
  }, [startDate, todayStr])

  const LEGEND_COLORS = [w(0.07, isDark), 'rgba(34,211,238,0.22)', 'rgba(34,211,238,0.44)', 'rgba(34,211,238,0.64)', 'rgba(52,211,153,0.84)']

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4" dir="rtl">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl p-3 text-center" style={{ background: w(0.04, isDark), border: `1px solid ${w(0.06, isDark)}` }}>
          <div className="text-lg font-bold" style={{ color: 'rgb(103,232,249)' }}>{totalDone}</div>
          <div className="text-[10px] mt-0.5" style={{ color: w(0.4, isDark) }}>הרגלים השנה</div>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: w(0.04, isDark), border: `1px solid ${w(0.06, isDark)}` }}>
          <div className="text-lg font-bold" style={{ color: 'rgb(52,211,153)' }}>{streak}</div>
          <div className="text-[10px] mt-0.5" style={{ color: w(0.4, isDark) }}>ימים ברצף</div>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: w(0.04, isDark), border: `1px solid ${w(0.06, isDark)}` }}>
          <div className="text-lg font-bold" style={{ color: 'rgb(250,204,21)' }}>
            {totalDays > 0 ? Math.round((activeDayCount / totalDays) * 100) : 0}%
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: w(0.4, isDark) }}>ימים פעילים</div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <span className="text-sm" style={{ color: w(0.3, isDark) }}>טוען...</span>
        </div>
      ) : (
        <>
          {/* Q1–Q4 grid */}
          <div className="grid grid-cols-2 gap-3">
            {quarters.map(q => (
              <div key={q.key} className="rounded-2xl overflow-hidden"
                style={{ background: w(0.03, isDark), border: `1px solid ${w(0.06, isDark)}` }}>
                {/* Quarter header */}
                <div className="px-3 py-2 flex items-center justify-between"
                  style={{ background: w(0.04, isDark), borderBottom: `1px solid ${w(0.05, isDark)}` }}>
                  <div>
                    <div className="text-[10px] font-bold" style={{ color: 'rgb(103,232,249)' }}>{q.label}</div>
                    <div className="text-[8px]" style={{ color: w(0.32, isDark) }}>{q.monthRange}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold leading-none" style={{ color: w(0.75, isDark) }}>{q.total}</div>
                    <div className="text-[8px]" style={{ color: w(0.28, isDark) }}>הרגלים</div>
                  </div>
                </div>
                {/* Mini heatmap */}
                <div className="p-2 overflow-x-auto">
                  <QuarterHeatmap
                    weeks={q.weeks}
                    byDay={byDay}
                    dailyHabitCount={dailyHabitCount}
                    todayStr={todayStr}
                    isDark={isDark}
                    onCellClick={onSelectDate}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Legend — RTL: יותר on right, פחות on left */}
          <div className="flex items-center gap-2 justify-center">
            <span style={{ fontSize: 10, color: w(0.35, isDark) }}>יותר · לחץ לחודשי</span>
            {[...LEGEND_COLORS].reverse().map((clr, i) => (
              <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: clr, flexShrink: 0 }} />
            ))}
            <span style={{ fontSize: 10, color: w(0.35, isDark) }}>פחות</span>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Sync Overview ────────────────────────────────────────────────────────────
const URGENCY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  normal: '#eab308',
  low: '#6b7280',
}

const URGENCY_LABELS: Record<string, { he: string; en: string }> = {
  critical: { he: 'קריטי', en: 'Crit' },
  high:     { he: 'גבוה',  en: 'High' },
  normal:   { he: 'רגיל',  en: 'Norm' },
  low:      { he: 'נמוך',  en: 'Low'  },
}

function urgOrder(u: string): number {
  return u === 'critical' ? 0 : u === 'high' ? 1 : u === 'normal' ? 2 : 3
}

type SyncPeriod = 'day' | 'week' | 'month'
type NormTask = { id: string; title: string; urgency: string; due_date: string | null }

function AllItemsOverview({
  allHabits, completedHabitIds, domainTasks, domainGoals, familyTasks, familyEvents, isDark,
}: {
  allHabits: HabitFull[]
  completedHabitIds: Set<string>
  domainTasks: DomainTask[]
  domainGoals: DomainGoal[]
  familyTasks: FamilyTask[]
  familyEvents: FamilyEvent[]
  isDark: boolean
}) {
  const [period, setPeriod] = useState<SyncPeriod>('day')
  const { isRTL, t } = useLang()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const weekStartDate = new Date(today)
  weekStartDate.setDate(today.getDate() - today.getDay())
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekStartDate.getDate() + 6)
  const weekStartStr = weekStartDate.toISOString().split('T')[0]
  const weekEndStr   = weekEndDate.toISOString().split('T')[0]

  const monthStartStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const monthEndStr   = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

  function isTaskDateInPeriod(dateStr: string | null): boolean {
    if (!dateStr) return true
    if (period === 'day')  return dateStr <= todayStr
    if (period === 'week') return dateStr >= weekStartStr && dateStr <= weekEndStr
    return dateStr >= monthStartStr && dateStr <= monthEndStr
  }

  function isEventInPeriod(eventDate: string): boolean {
    if (period === 'day')  return eventDate === todayStr
    if (period === 'week') return eventDate >= weekStartStr && eventDate <= weekEndStr
    return eventDate >= monthStartStr && eventDate <= monthEndStr
  }

  function fmtDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00')
    return `${d.getDate()}/${d.getMonth() + 1}`
  }

  const cards = DOMAINS.map(domain => {
    const habits = allHabits.filter(h => h.domain_slug === domain.slug)

    let tasks: NormTask[]
    if (domain.slug === 'family') {
      tasks = familyTasks
        .filter(ft => isTaskDateInPeriod(ft.due_date))
        .map(ft => ({ id: ft.id, title: ft.title, urgency: ft.urgency, due_date: ft.due_date }))
    } else {
      tasks = domainTasks
        .filter(dt => dt.domain_slug === domain.slug && isTaskDateInPeriod(dt.due_date))
        .map(dt => ({ id: dt.id, title: dt.title, urgency: dt.urgency, due_date: dt.due_date }))
    }
    tasks.sort((a, b) => {
      const diff = urgOrder(a.urgency) - urgOrder(b.urgency)
      if (diff !== 0) return diff
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      return a.due_date ? -1 : b.due_date ? 1 : 0
    })

    const goals = domain.slug !== 'family'
      ? domainGoals.filter(g => g.domain_slug === domain.slug)
      : []
    const events = domain.slug === 'family'
      ? familyEvents.filter(e => isEventInPeriod(e.event_date))
      : []

    return { domain, habits, tasks, goals, events }
  }).filter(c => c.habits.length > 0 || c.tasks.length > 0 || c.goals.length > 0 || c.events.length > 0)

  return (
    <div className="flex-1 min-h-0 flex flex-col" style={{ borderTop: `1px solid ${w(0.06, isDark)}` }}>
      {/* Period filter */}
      <div className="flex-shrink-0 max-w-2xl mx-auto w-full px-4 py-2">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: w(0.05, isDark) }}>
          {([
            { id: 'day'   as const, label: isRTL ? 'היום' : 'Today' },
            { id: 'week'  as const, label: isRTL ? 'שבוע' : 'Week'  },
            { id: 'month' as const, label: isRTL ? 'חודש' : 'Month' },
          ]).map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: period === p.id ? 'rgba(34,211,238,0.12)' : 'transparent',
                color:      period === p.id ? 'rgb(103,232,249)' : w(0.4, isDark),
                border:     period === p.id ? '1px solid rgba(34,211,238,0.25)' : '1px solid transparent',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Domain cards */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 max-w-2xl mx-auto w-full">
        {cards.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm" style={{ color: w(0.3, isDark) }}>{t('noItemsForPeriod')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map(({ domain, habits, tasks, goals, events }) => {
              const total = habits.length + tasks.length + goals.length + events.length
              return (
                <div
                  key={domain.slug}
                  className="rounded-2xl p-4"
                  style={{ background: `${domain.color}10`, border: `1px solid ${domain.color}30` }}
                >
                  {/* Domain header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{domain.icon}</span>
                      <span className="text-sm font-bold" style={{ color: domain.color }}>
                        {isRTL ? domain.nameHe : domain.nameEn}
                      </span>
                    </div>
                    <span className="text-[10px]" style={{ color: w(0.3, isDark) }}>{total}</span>
                  </div>

                  <div className="space-y-1.5">
                    {/* Habits */}
                    {habits.map(h => {
                      const done = completedHabitIds.has(h.id)
                      return (
                        <div key={h.id} className="flex items-center gap-2 text-xs">
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                            style={{
                              background: done ? `${domain.color}35` : w(0.07, isDark),
                              color: done ? domain.color : w(0.3, isDark),
                            }}
                          >
                            {done ? '✓' : '○'}
                          </span>
                          <span style={{ color: done ? w(0.35, isDark) : w(0.75, isDark), textDecoration: done ? 'line-through' : 'none' }}>
                            {h.name}
                          </span>
                        </div>
                      )
                    })}

                    {/* Tasks */}
                    {tasks.map(task => {
                      const od = task.due_date !== null && task.due_date < todayStr
                      const urg = URGENCY_LABELS[task.urgency] ?? { he: 'רגיל', en: 'Norm' }
                      return (
                        <div key={task.id} className="flex items-center gap-2 text-xs">
                          <span
                            className="px-1.5 py-0.5 rounded-md text-[9px] font-bold flex-shrink-0"
                            style={{
                              background: `${URGENCY_COLORS[task.urgency] ?? '#6b7280'}22`,
                              color: URGENCY_COLORS[task.urgency] ?? '#6b7280',
                            }}
                          >
                            {isRTL ? urg.he : urg.en}
                          </span>
                          <span className="flex-1 min-w-0 truncate" style={{ color: w(0.75, isDark) }}>{task.title}</span>
                          {task.due_date && (
                            <span className="text-[10px] flex-shrink-0" style={{ color: od ? '#ef4444' : w(0.35, isDark) }}>
                              {fmtDate(task.due_date)}
                            </span>
                          )}
                        </div>
                      )
                    })}

                    {/* Goals */}
                    {goals.map(g => (
                      <div key={g.id} className="flex items-center gap-2 text-xs">
                        <span className="text-[11px] flex-shrink-0">🎯</span>
                        <span className="flex-1 min-w-0 truncate" style={{ color: w(0.65, isDark) }}>{g.title}</span>
                      </div>
                    ))}

                    {/* Family events */}
                    {events.map(e => (
                      <div key={e.id} className="flex items-center gap-2 text-xs">
                        <span className="text-[11px] flex-shrink-0">📅</span>
                        <span className="flex-1 min-w-0 truncate" style={{ color: w(0.75, isDark) }}>{e.title}</span>
                        <span className="text-[10px] flex-shrink-0" style={{ color: w(0.35, isDark) }}>
                          {fmtDate(e.event_date)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SchedulePageClient({
  userId, userItems, allItems, todayChecks, scheduledHabits, todayCompletedHabitIds,
  allHabits, weekHabitLogs, weekActivityChecks,
  domainTasks, domainGoals, familyTasks, familyEvents,
}: Props) {
  const { isDark } = useTheme()
  const { isRTL, t }  = useLang()
  const { toast } = useToast()
  const todayDay   = new Date().getDay()
  const todayDate  = new Date().toISOString().split('T')[0]

  const [view,        setView]        = useState<CalendarView>('daily')
  const [day,         setDay]         = useState(todayDay < 6 ? todayDay : 0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [editItem, setEditItem] = useState<ScheduleItem | null>(null)
  const [addHour,  setAddHour]  = useState<number | null | false>(false)
  const [checked,  setChecked]  = useState<Set<string>>(new Set(todayChecks.map(c => c.time)))
  const [completedHabitIds, setCompletedHabitIds] = useState<Set<string>>(new Set(todayCompletedHabitIds))
  const router = useRouter()

  const isToday = day === todayDay
  const items   = (userItems[day] ?? []).sort((a, b) => toMin(a.time) - toMin(b.time))

  // ── Week data ────────────────────────────────────────────────────────────────
  const dailyHabits = allHabits.filter(h => h.frequency === 'daily')

  const weekData: WeekDayData[] = DAYS.map(dow => {
    const date     = getWeekDate(dow)
    const isFuture = date > todayDate
    const activities = userItems[dow] ?? []

    const completedHabitSet = dow === todayDay
      ? new Set([...completedHabitIds])
      : new Set(weekHabitLogs.filter(l => l.completed_at === date).map(l => l.habit_id))

    const checkedActivityTimes = dow === todayDay
      ? new Set([...checked])
      : new Set(weekActivityChecks.filter(c => c.date === date).map(c => c.time))

    const dateObj = new Date(date + 'T12:00:00')
    const habitDone  = dailyHabits.filter(h => completedHabitSet.has(h.id)).length
    const habitTotal = dailyHabits.length
    const activityDone = activities.filter(a => checkedActivityTimes.has(a.time)).length
    const activeDomains = [...new Set(dailyHabits.map(h => h.domain_slug))]

    return {
      dow, date, isFuture,
      dateNum: dateObj.getDate(),
      completedHabitSet,
      habitDone, habitTotal,
      activityDone,
      activityTotal: activities.length,
      activeDomains,
    }
  })

  const pastAndToday   = weekData.filter(d => !d.isFuture || d.dow === todayDay)
  const weekHabitDone  = pastAndToday.reduce((s, d) => s + d.habitDone, 0)
  const weekHabitTotal = pastAndToday.reduce((s, d) => s + d.habitTotal, 0)
  const weekActDone    = pastAndToday.reduce((s, d) => s + d.activityDone, 0)
  const weekActTotal   = pastAndToday.reduce((s, d) => s + d.activityTotal, 0)

  // ── Drill-down handlers ──────────────────────────────────────────────────────
  function drillFromYearly(dateStr: string) {
    const today = new Date()
    const d = new Date(dateStr + 'T12:00:00')
    const offset = (d.getFullYear() - today.getFullYear()) * 12 + (d.getMonth() - today.getMonth())
    setMonthOffset(offset)
    setView('monthly')
  }

  function drillFromMonthly(dateStr: string) {
    const dow = new Date(dateStr + 'T12:00:00').getDay()
    if (dow < 6) { setDay(dow); setView('daily') }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function getDuplicateCount(label: string, currentDay: number) {
    return allItems.filter(i => i.label === label && i.day_of_week !== currentDay && i.specific_date === null).length
  }

  async function saveEdit(id: string, scope: 'single' | 'all' | 'once', time: string, label: string, type: string, color: string | null, dayOfWeek: number) {
    try {
      const sb = createClient()
      if (scope === 'single') {
        const { error } = await sb.from('user_schedule').update({ time, label, type, color }).eq('id', id)
        if (error) throw error
      } else if (scope === 'all') {
        const orig = allItems.find(i => i.id === id)
        if (!orig) return
        for (const mid of allItems.filter(i => i.label === orig.label && i.specific_date === null).map(i => i.id)) {
          const { error } = await sb.from('user_schedule').update({ time, label, type, color }).eq('id', mid)
          if (error) throw error
        }
      } else {
        const { error } = await sb.from('user_schedule').insert({ user_id: userId, day_of_week: dayOfWeek, time, label, type, color, sort_order: 0, specific_date: getWeekDate(dayOfWeek) })
        if (error) throw error
      }
      router.refresh()
    } catch {
      toast(t('saveFailed'), 'error')
    }
  }

  async function deleteItem(id: string) {
    try {
      const { error } = await createClient().from('user_schedule').delete().eq('id', id)
      if (error) throw error
      router.refresh()
    } catch {
      toast(t('saveFailed'), 'error')
    }
  }

  async function addItem(time: string, label: string, type: string, color: string | null) {
    try {
      const { error } = await createClient().from('user_schedule').insert({ user_id: userId, day_of_week: day, time, label, type, color, sort_order: 0 })
      if (error) throw error
      router.refresh()
    } catch {
      toast(t('saveFailed'), 'error')
    }
  }

  async function toggleCheck(time: string) {
    const sb = createClient()
    const wasChecked = checked.has(time)
    if (wasChecked) {
      setChecked(p => { const n = new Set(p); n.delete(time); return n })
    } else {
      setChecked(p => new Set([...p, time]))
    }
    try {
      const { error } = wasChecked
        ? await sb.from('activity_checks').delete().eq('user_id', userId).eq('date', todayDate).eq('time', time)
        : await sb.from('activity_checks').upsert({ user_id: userId, date: todayDate, time })
      if (error) throw error
    } catch {
      setChecked(p => {
        const n = new Set(p)
        if (wasChecked) n.add(time); else n.delete(time)
        return n
      })
      toast(t('saveFailed'), 'error')
    }
  }

  async function toggleHabit(habitId: string) {
    const sb = createClient()
    const wasDone = completedHabitIds.has(habitId)
    if (wasDone) {
      setCompletedHabitIds(p => { const n = new Set(p); n.delete(habitId); return n })
    } else {
      setCompletedHabitIds(p => new Set([...p, habitId]))
    }
    try {
      const { error } = wasDone
        ? await sb.from('habit_logs').delete().eq('user_id', userId).eq('habit_id', habitId).eq('completed_at', todayDate)
        : await sb.from('habit_logs').upsert({ user_id: userId, habit_id: habitId, completed_at: todayDate })
      if (error) throw error
    } catch {
      setCompletedHabitIds(p => {
        const n = new Set(p)
        if (wasDone) n.add(habitId); else n.delete(habitId)
        return n
      })
      toast(t('saveFailed'), 'error')
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 64px)' }}>

      {/* Header */}
      <div className="flex-shrink-0 max-w-2xl mx-auto w-full px-4 pt-5 pb-3 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--c-primary-glow)', color: 'var(--primary)' }}
        >
          <CalendarDays size={20} />
        </div>
        <div>
          <h1 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
            {isRTL ? 'לוח שנה' : 'Calendar'}
          </h1>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'תכנן את השבוע שלך' : 'Plan your week'}
          </p>
        </div>
      </div>

      {/* Weekly stats strip — always visible */}
      <div className="flex-shrink-0 max-w-2xl mx-auto w-full px-4 pb-2">
        <div className="rounded-2xl px-4 py-3"
          style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-semibold" style={{ color: w(0.45, isDark) }}>
                  {isRTL ? 'הרגלים' : 'Habits'}
                </span>
                <span className="text-[11px] font-bold" style={{ color: w(0.65, isDark) }}>
                  {weekHabitDone}/{weekHabitTotal}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: w(0.07, isDark) }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${weekHabitTotal > 0 ? (weekHabitDone / weekHabitTotal) * 100 : 0}%`, background: 'rgb(52,211,153)' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-semibold" style={{ color: w(0.45, isDark) }}>
                  {isRTL ? 'פעילויות' : 'Activities'}
                </span>
                <span className="text-[11px] font-bold" style={{ color: w(0.65, isDark) }}>
                  {weekActDone}/{weekActTotal}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: w(0.07, isDark) }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${weekActTotal > 0 ? (weekActDone / weekActTotal) * 100 : 0}%`, background: 'rgb(103,232,249)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View tab bar */}
      <div className="flex-shrink-0 max-w-2xl mx-auto w-full px-4 pb-2">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: w(0.05, isDark) }}>
          {([
            { id: 'daily'   as const, label: 'יומי'   },
            { id: 'weekly'  as const, label: 'שבועי'  },
            { id: 'monthly' as const, label: 'חודשי'  },
            { id: 'yearly'  as const, label: 'שנתי'   },
            { id: 'all'     as const, label: isRTL ? 'הכל' : 'All' },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: view === tab.id ? 'rgba(34,211,238,0.12)' : 'transparent',
                color:      view === tab.id ? 'rgb(103,232,249)' : w(0.4, isDark),
                border:     view === tab.id ? '1px solid rgba(34,211,238,0.25)' : '1px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Daily view */}
      {view === 'daily' && (
        <>
          {/* 6-day mini calendar */}
          <div className="flex-shrink-0 max-w-2xl mx-auto w-full px-4 pb-2">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
              {weekData.map(dayD => {
                const isSel     = dayD.dow === day
                const isTd      = dayD.dow === todayDay
                const compRate  = dayD.habitTotal > 0 && !dayD.isFuture ? dayD.habitDone / dayD.habitTotal : 0
                const compColor = compRate >= 1 ? 'rgb(52,211,153)' : compRate > 0 ? 'rgb(103,232,249)' : w(0.12, isDark)

                return (
                  <button
                    key={dayD.dow}
                    onClick={() => setDay(dayD.dow)}
                    className="flex flex-col items-center rounded-2xl py-2 px-1 gap-1 transition-all"
                    style={{
                      background: isSel
                        ? (isTd ? 'rgba(34,211,238,0.14)' : w(0.07, isDark))
                        : isTd ? w(0.04, isDark) : 'transparent',
                      border: isSel
                        ? (isTd ? '1px solid rgba(34,211,238,0.30)' : `1px solid ${w(0.14, isDark)}`)
                        : '1px solid transparent',
                    }}
                  >
                    <span className="text-[9px] font-bold leading-none"
                      style={{ color: isTd ? 'rgb(103,232,249)' : w(0.38, isDark) }}>
                      {DAY_NAMES_HE[dayD.dow]}
                    </span>
                    <span className="text-[15px] font-bold leading-none"
                      style={{ color: isTd ? 'rgb(103,232,249)' : isSel ? w(0.85, isDark) : w(0.55, isDark) }}>
                      {dayD.dateNum}
                    </span>
                    {dayD.habitTotal > 0 && (
                      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: w(0.07, isDark) }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${compRate * 100}%`, background: !dayD.isFuture ? compColor : 'transparent' }} />
                      </div>
                    )}
                    {!dayD.isFuture && (
                      <div className="flex gap-0.5 flex-wrap justify-center min-h-[8px]">
                        {dayD.activeDomains.slice(0, 4).map(slug => {
                          const d = DOMAINS.find(x => x.slug === slug)
                          if (!d) return null
                          const allDone = dailyHabits
                            .filter(h => h.domain_slug === slug)
                            .every(h => dayD.completedHabitSet.has(h.id))
                          return (
                            <div key={slug} className="w-1.5 h-1.5 rounded-full"
                              style={{ background: allDone ? d.color : `${d.color}50` }} />
                          )
                        })}
                      </div>
                    )}
                    {dayD.activityTotal > 0 && (
                      <span className="text-[8px]" style={{ color: w(0.22, isDark) }}>{dayD.activityTotal}◆</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Hourly schedule */}
          <div className="flex-1 min-h-0 max-w-2xl mx-auto w-full flex flex-col"
            style={{ borderTop: `1px solid ${w(0.06, isDark)}` }}>
            <ScheduleTable
              items={items}
              habits={scheduledHabits}
              completedHabitIds={completedHabitIds}
              dayOfWeek={day}
              isToday={isToday}
              checked={checked}
              onSelectDay={setDay}
              onEdit={setEditItem}
              onAdd={h => setAddHour(h ?? null)}
              onToggle={toggleCheck}
              onToggleHabit={toggleHabit}
            />
          </div>
        </>
      )}

      {/* Weekly view */}
      {view === 'weekly' && (
        <div className="flex-1 min-h-0 max-w-2xl mx-auto w-full flex flex-col"
          style={{ borderTop: `1px solid ${w(0.06, isDark)}` }}>
          <WeeklyOverview
            weekData={weekData}
            dailyHabits={dailyHabits}
            userItems={userItems}
            isDark={isDark}
            onSelectDayAndView={(dow) => { setDay(dow); setView('daily') }}
          />
        </div>
      )}

      {/* Monthly view */}
      {view === 'monthly' && (
        <div className="flex-1 min-h-0 max-w-2xl mx-auto w-full flex flex-col"
          style={{ borderTop: `1px solid ${w(0.06, isDark)}` }}>
          <MonthlyView
            userId={userId}
            allHabits={allHabits}
            isDark={isDark}
            monthOffset={monthOffset}
            onMonthOffsetChange={setMonthOffset}
            onSelectDate={drillFromMonthly}
          />
        </div>
      )}

      {/* Yearly view */}
      {view === 'yearly' && (
        <div className="flex-1 min-h-0 max-w-2xl mx-auto w-full flex flex-col"
          style={{ borderTop: `1px solid ${w(0.06, isDark)}` }}>
          <YearlyView userId={userId} allHabits={allHabits} isDark={isDark} onSelectDate={drillFromYearly} />
        </div>
      )}

      {/* All items view */}
      {view === 'all' && (
        <AllItemsOverview
          allHabits={allHabits}
          completedHabitIds={completedHabitIds}
          domainTasks={domainTasks}
          domainGoals={domainGoals}
          familyTasks={familyTasks}
          familyEvents={familyEvents}
          isDark={isDark}
        />
      )}

      {/* Sheets */}
      {editItem && (
        <EditSheet
          item={editItem}
          dayOfWeek={day}
          getDuplicateCount={getDuplicateCount}
          onSave={saveEdit}
          onDelete={deleteItem}
          onClose={() => setEditItem(null)}
        />
      )}
      {addHour !== false && (
        <AddSheet
          defaultHour={addHour}
          onAdd={addItem}
          onClose={() => setAddHour(false)}
        />
      )}
    </div>
  )
}
