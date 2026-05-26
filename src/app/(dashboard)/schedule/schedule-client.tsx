'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DAY_NAMES_HE } from '@/lib/schedule'
import { Trash2, X, Plus, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { HebrewCalendar } from './hebrew-calendar'

// ─── Constants ────────────────────────────────────────────────────────────────
const HOUR_START = 5
const HOUR_END = 23
const ROW_H = 64
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

// ─── Types ────────────────────────────────────────────────────────────────────
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

interface Props {
  userId: string
  userItems: Record<number, ScheduleItem[]>
  allItems: AllItem[]
  todayChecks: CheckRow[]
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
            <button onClick={onCancel} className="p-1 rounded-lg" style={{ color: 'var(--muted-foreground)' }}><X size={16} /></button>
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
        <div className="relative w-full rounded-t-3xl animate-fade-in" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          <div className="w-8 h-1 rounded-full bg-white/20 mx-auto mt-4" />
          <div className="flex gap-2 items-center px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--c-border)' }}>
            <button onClick={handleSave} disabled={busy || !editLabel.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30" style={{ background: 'rgba(34,211,238,0.15)', color: 'rgb(103,232,249)', border: '1px solid rgba(34,211,238,0.25)' }}>
              {busy ? '...' : 'שמור'}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm" style={{ color: 'var(--muted-foreground)' }}>ביטול</button>
            <button onClick={handleDelete} disabled={busy} className="p-2.5 rounded-xl border disabled:opacity-30" style={{ color: 'rgba(248,113,113,0.7)', borderColor: 'rgba(248,113,113,0.2)' }}>
              <Trash2 size={16} />
            </button>
          </div>
          <div className="p-5 pb-8 flex flex-col gap-4">
            <div className="flex gap-2">
              <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className="w-24 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm px-3 py-2.5 focus:outline-none focus:border-cyan-400/30" />
              <input value={editLabel} onChange={e => setEditLabel(e.target.value)} placeholder="שם הפעילות" className="flex-1 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm px-3 py-2.5 focus:outline-none focus:border-cyan-400/30" />
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
      <div className="relative w-full rounded-t-3xl animate-fade-in" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <div className="w-8 h-1 rounded-full bg-white/20 mx-auto mt-4" />
        <div className="flex gap-2 items-center px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--c-border)' }}>
          <button onClick={handleAdd} disabled={busy || !label.trim() || !time} className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30" style={{ background: 'rgba(34,211,238,0.15)', color: 'rgb(103,232,249)', border: '1px solid rgba(34,211,238,0.25)' }}>
            {busy ? '...' : 'הוסף'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm" style={{ color: 'var(--muted-foreground)' }}>ביטול</button>
        </div>
        <div className="p-5 pb-8 flex flex-col gap-4">
          <div className="flex gap-2">
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-24 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm px-3 py-2.5 focus:outline-none focus:border-cyan-400/30" />
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="שם הפעילות" autoFocus className="flex-1 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm px-3 py-2.5 focus:outline-none focus:border-cyan-400/30" />
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
function ActivityBlock({ item, isToday, isChecked, onEdit, onToggle }: {
  item: ScheduleItem
  isToday: boolean
  isChecked: boolean
  onEdit: () => void
  onToggle: () => void
}) {
  const clr = activityColor(item)
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all"
      style={{
        background:  isChecked ? 'rgba(52,211,153,0.06)' : hexBg(clr),
        borderColor: isChecked ? 'rgba(52,211,153,0.25)' : hexBorder(clr),
        opacity:     isChecked ? 0.55 : 1,
      }}
    >
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: clr }} />
      <button onClick={onEdit} className="flex-1 min-w-0 text-right">
        <p className="text-sm font-semibold truncate" style={{ color: isChecked ? 'var(--muted-foreground)' : clr, textDecoration: isChecked ? 'line-through' : 'none' }}>{item.label}</p>
        <p className="text-[10px] font-mono" style={{ color: 'var(--muted-foreground)' }}>{item.time}</p>
      </button>
      {isToday && (
        <button
          onClick={onToggle}
          className="w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            background:  isChecked ? 'rgba(52,211,153,0.20)' : 'transparent',
            borderColor: isChecked ? 'rgba(52,211,153,0.60)' : 'var(--c-border)',
          }}
        >
          {isChecked && <Check size={10} className="text-emerald-400" />}
        </button>
      )}
    </div>
  )
}

// ─── ScheduleTable ────────────────────────────────────────────────────────────
function ScheduleTable({ items, dayOfWeek, isToday, checked, onSelectDay, onEdit, onAdd, onToggle }: {
  items: ScheduleItem[]
  dayOfWeek: number
  isToday: boolean
  checked: Set<string>
  onSelectDay: (d: number) => void
  onEdit: (item: ScheduleItem) => void
  onAdd: (hour: number | null) => void
  onToggle: (time: string) => void
}) {
  const { isDark }  = useTheme()
  const scrollRef   = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
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

  const todayDow = new Date().getDay()
  const dayDate  = new Date()
  dayDate.setDate(dayDate.getDate() + (dayOfWeek - dayDate.getDay()))
  const dayLabel = `${dayDate.getDate()}/${dayDate.getMonth() + 1}`
  const nowH = now.getHours()
  const nowM = now.getMinutes()

  return (
    <div className="flex flex-col h-full">

      {/* Day selector tabs */}
      <div className="px-3 pt-2" dir="rtl">
        <div className="flex gap-1">
          {DAYS.map(d => {
            const active = d === dayOfWeek
            const isTd   = d === todayDow
            return (
              <button
                key={d}
                onClick={() => onSelectDay(d)}
                className="flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                style={{
                  background:  active ? 'rgba(34,211,238,0.15)' : isTd ? w(0.06, isDark) : 'transparent',
                  color:       active ? 'rgb(103,232,249)' : isTd ? w(0.55, isDark) : w(0.28, isDark),
                  border:      active ? '1px solid rgba(34,211,238,0.30)' : isTd ? `1px solid ${w(0.12, isDark)}` : '1px solid transparent',
                }}
              >{DAY_NAMES_HE[d]}</button>
            )
          })}
        </div>

        {/* Date row with prev/next arrows */}
        <div className="flex items-center justify-between mt-2 mb-1">
          <button onClick={() => onSelectDay(Math.max(0, dayOfWeek - 1))} disabled={dayOfWeek === 0} className="p-1.5 rounded-lg disabled:opacity-20" style={{ color: w(0.4, isDark) }}>
            <ChevronRight size={18} />
          </button>
          <div className="text-center">
            <span className="text-sm font-bold" style={{ color: isToday ? 'rgb(103,232,249)' : w(0.7, isDark) }}>{DAY_NAMES_HE[dayOfWeek]}</span>
            <span className="text-[11px] mr-2 font-mono" style={{ color: w(0.28, isDark) }}>{dayLabel}</span>
            {isToday && <span className="text-[9px] mr-1 font-semibold" style={{ color: 'rgb(103,232,249)' }}>היום</span>}
          </div>
          <button onClick={() => onSelectDay(Math.min(5, dayOfWeek + 1))} disabled={dayOfWeek === 5} className="p-1.5 rounded-lg disabled:opacity-20" style={{ color: w(0.4, isDark) }}>
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {/* Hour grid */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ maxHeight: 'calc(100dvh - 260px)' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => {
          const h         = HOUR_START + i
          const hourItems = (itemsByHour[h] ?? []).sort((a, b) => toMin(a.time) - toMin(b.time))
          const isCurHour = isToday && h === nowH

          return (
            <div
              key={h}
              className="flex relative"
              style={{
                minHeight:    ROW_H,
                borderBottom: `1px solid ${isCurHour ? 'rgba(34,211,238,0.20)' : w(0.05, isDark)}`,
                background:   isCurHour ? 'rgba(34,211,238,0.025)' : 'transparent',
              }}
            >
              {/* Current-time indicator */}
              {isCurHour && (
                <div className="absolute inset-x-0 z-10 pointer-events-none" style={{ top: `${(nowM / 60) * ROW_H}px` }}>
                  <div className="h-px" style={{ background: 'rgba(34,211,238,0.50)', marginRight: 48 }} />
                  <div className="absolute w-2 h-2 rounded-full" style={{ background: 'rgb(103,232,249)', top: -4, right: 48 }} />
                </div>
              )}

              {/* Hour label */}
              <div className="w-12 flex-shrink-0 flex items-start justify-center pt-2" style={{ direction: 'ltr' }}>
                <span className="text-[10px] font-mono" style={{ color: isCurHour ? 'rgb(103,232,249)' : w(0.18, isDark) }}>
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>

              {/* Activities — tap empty slot to add */}
              <div
                className="flex-1 flex flex-col gap-1 py-1.5 px-2"
                dir="rtl"
                onClick={() => { if (hourItems.length === 0) onAdd(h) }}
                style={{ cursor: hourItems.length === 0 ? 'pointer' : 'default' }}
              >
                {hourItems.map(item => (
                  <ActivityBlock
                    key={item.id}
                    item={item}
                    isToday={isToday}
                    isChecked={isToday && checked.has(item.time)}
                    onEdit={() => onEdit(item)}
                    onToggle={() => onToggle(item.time)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add button */}
      <div className="px-4 py-3 border-t" style={{ borderColor: w(0.06, isDark) }} dir="rtl">
        <button
          onClick={() => onAdd(null)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: 'rgba(34,211,238,0.08)', color: 'rgb(103,232,249)', border: '1px solid rgba(34,211,238,0.20)' }}
        >
          <Plus size={16} />
          הוסף ל{DAY_NAMES_HE[dayOfWeek]}
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
type TabId = 'calendar' | 'schedule'
const TABS: { id: TabId; label: string }[] = [
  { id: 'calendar', label: 'לוח שנה' },
  { id: 'schedule', label: 'לוז'      },
]

export function SchedulePageClient({
  userId, userItems, allItems, todayChecks,
}: Props) {
  const { isDark }  = useTheme()
  const todayDay  = new Date().getDay()
  const todayDate = new Date().toISOString().split('T')[0]
  const [tab,      setTab]      = useState<TabId>('calendar')
  const [day,      setDay]      = useState(todayDay < 6 ? todayDay : 0)
  const [editItem, setEditItem] = useState<ScheduleItem | null>(null)
  const [addHour,  setAddHour]  = useState<number | null | false>(false)
  const [checked,  setChecked]  = useState<Set<string>>(new Set(todayChecks.map(c => c.time)))
  const router = useRouter()

  const isToday = day === todayDay
  const items   = (userItems[day] ?? []).sort((a, b) => toMin(a.time) - toMin(b.time))

  function getDuplicateCount(label: string, currentDay: number) {
    return allItems.filter(i => i.label === label && i.day_of_week !== currentDay && i.specific_date === null).length
  }

  async function saveEdit(id: string, scope: 'single' | 'all' | 'once', time: string, label: string, type: string, color: string | null, dayOfWeek: number) {
    const sb = createClient()
    if (scope === 'single') {
      await sb.from('user_schedule').update({ time, label, type, color }).eq('id', id)
    } else if (scope === 'all') {
      const orig = allItems.find(i => i.id === id)
      if (!orig) return
      for (const mid of allItems.filter(i => i.label === orig.label && i.specific_date === null).map(i => i.id))
        await sb.from('user_schedule').update({ time, label, type, color }).eq('id', mid)
    } else {
      await sb.from('user_schedule').insert({ user_id: userId, day_of_week: dayOfWeek, time, label, type, color, sort_order: 0, specific_date: getWeekDate(dayOfWeek) })
    }
    router.refresh()
  }

  async function deleteItem(id: string) {
    await createClient().from('user_schedule').delete().eq('id', id)
    router.refresh()
  }

  async function addItem(time: string, label: string, type: string, color: string | null) {
    await createClient().from('user_schedule').insert({ user_id: userId, day_of_week: day, time, label, type, color, sort_order: 0 })
    router.refresh()
  }

  async function toggleCheck(time: string) {
    const sb = createClient()
    if (checked.has(time)) {
      setChecked(p => { const n = new Set(p); n.delete(time); return n })
      await sb.from('activity_checks').delete().eq('user_id', userId).eq('date', todayDate).eq('time', time)
    } else {
      setChecked(p => new Set([...p, time]))
      await sb.from('activity_checks').upsert({ user_id: userId, date: todayDate, time })
    }
  }

  const tabBar = (
    <div className="flex rounded-2xl p-1" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)' }}>
      {TABS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all duration-200"
          style={{
            background: tab === id ? 'rgba(34,211,238,0.15)' : 'transparent',
            color:      tab === id ? 'rgb(103,232,249)' : 'var(--muted-foreground)',
            border:     tab === id ? '1px solid rgba(34,211,238,0.25)' : '1px solid transparent',
          }}
        >{label}</button>
      ))}
    </div>
  )

  const tableView = (
    <ScheduleTable
      items={items}
      dayOfWeek={day}
      isToday={isToday}
      checked={checked}
      onSelectDay={setDay}
      onEdit={setEditItem}
      onAdd={h => setAddHour(h ?? null)}
      onToggle={toggleCheck}
    />
  )

  return (
    <div className="pt-2 pb-32 md:pb-8">

      {/* ── MOBILE ─────────────────────────────────────────────────────────── */}
      <div className="md:hidden flex flex-col" style={{ height: 'calc(100dvh - 100px)' }}>
        <div className="flex-shrink-0 px-4 pt-2 pb-3">{tabBar}</div>
        <div className="flex-1 overflow-hidden">
          {tab === 'calendar' && <HebrewCalendar weeklyItems={userItems} />}
          {tab === 'schedule' && tableView}
        </div>
      </div>

      {/* ── DESKTOP ─────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex gap-6 px-4 items-start" dir="rtl">
        {/* Calendar panel */}
        <div
          className="flex-shrink-0 rounded-3xl overflow-hidden"
          style={{
            width: 380,
            background: 'var(--card)',
            border: '1px solid var(--c-border)',
          }}
        >
          <div className="px-4 pt-4 pb-1 border-b" style={{ borderColor: 'var(--c-border)' }}>
            <h2 className="text-sm font-black" style={{ color: 'var(--foreground)' }}>לוח שנה</h2>
          </div>
          <HebrewCalendar weeklyItems={userItems} />
        </div>

        {/* Schedule panel */}
        <div
          className="flex-1 rounded-3xl overflow-hidden"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--c-border)',
            minHeight: 'calc(100dvh - 120px)',
          }}
        >
          <div className="px-4 pt-4 pb-1 border-b" style={{ borderColor: 'var(--c-border)' }}>
            <h2 className="text-sm font-black" style={{ color: 'var(--foreground)' }}>לוז שבועי</h2>
          </div>
          {tableView}
        </div>
      </div>

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
