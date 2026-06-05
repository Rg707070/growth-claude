import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DAY_NAMES_HE } from '@/lib/schedule'
import { DOMAINS } from '@/lib/domains'
import { Trash2, X, Plus, ChevronRight, ChevronLeft, Check, CalendarDays } from 'lucide-react'
import { CalendarClient } from '@/app/(dashboard)/calendar/calendar-client'
import { useTheme } from '@/lib/theme'
import { useLang } from '@/lib/lang'
import { useToast } from '@/hooks/use-toast'
import type { Habit, HabitLog } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CalendarView = 'daily' | 'weekly' | 'monthly' | 'yearly'

interface ScheduleItem {
  id: string
  label: string
  time: string
  day_of_week: number | null
  specific_date: string | null
  color: string | null
  icon: string | null
  notes: string | null
}

interface ActivityCheck {
  time: string
  date: string
}

interface WeekDayData {
  dow: number
  date: string
  label: string
  isFuture: boolean
  habitDone: number
  habitTotal: number
  activityDone: number
  activityTotal: number
}

interface SchedulePageClientProps {
  userId: string
  userItems: Record<number, ScheduleItem[]>
  allItems: ScheduleItem[]
  todayChecks: ActivityCheck[]
  scheduledHabits: Habit[]
  todayCompletedHabitIds: string[]
  allHabits: Habit[]
  weekHabitLogs: HabitLog[]
  weekActivityChecks: ActivityCheck[]
  calendarLogs: HabitLog[]
  domainTasks: DomainTask[]
  domainGoals: DomainGoal[]
}

interface DomainTask {
  id: string
  domain_slug: string
  title: string
  done: boolean
  due_date: string | null
  priority: 'low' | 'normal' | 'high'
}

interface DomainGoal {
  id: string
  domain_slug: string
  title: string
  progress: number
  target: number
  unit: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const DAYS = [0, 1, 2, 3, 4, 5]
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

function getWeekDate(dow: number): string {
  const today = new Date()
  const todayDow = today.getDay()
  const diff = dow - todayDow
  const d = new Date(today)
  d.setDate(today.getDate() + diff)
  return d.toISOString().split('T')[0]
}

const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// ── HabitMiniCard ─────────────────────────────────────────────────────────
function HabitMiniCard({
  habit,
  completed,
  onToggle,
}: {
  habit: Habit
  completed: boolean
  onToggle: (id: string) => void
}) {
  const { isRTL } = useLang()
  const domain = DOMAINS.find(d => d.slug === habit.domain_slug)
  const color = domain?.color ?? '#888'

  return (
    <button
      onClick={() => onToggle(habit.id)}
      className="flex items-center gap-2 w-full text-start px-3 py-2 rounded-xl transition-all active:scale-[0.97]"
      style={{
        background: completed ? `${color}18` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${completed ? color + '44' : 'rgba(255,255,255,0.08)'}`,
        opacity: completed ? 0.7 : 1,
      }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          background: completed ? color : 'transparent',
          border: `2px solid ${completed ? color : 'rgba(255,255,255,0.3)'}`,
        }}
      >
        {completed && <Check size={10} color="#fff" strokeWidth={3} />}
      </div>
      <span
        className="text-[12px] font-medium flex-1 leading-tight"
        style={{
          color: completed ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.85)',
          textDecoration: completed ? 'line-through' : 'none',
        }}
      >
        {isRTL ? habit.name : (habit.name_en || habit.name)}
      </span>
      {domain && (
        <span className="text-base opacity-60">{domain.icon}</span>
      )}
    </button>
  )
}

// ── DomainSummaryCard ─────────────────────────────────────────────────────
function DomainSummaryCard({
  domain,
  tasks,
  goals,
}: {
  domain: typeof DOMAINS[0]
  tasks: DomainTask[]
  goals: DomainGoal[]
}) {
  const { isRTL } = useLang()
  const activeTasks = tasks.filter(t => !t.done)
  const highPriority = activeTasks.filter(t => t.priority === 'high')
  const activeGoals = goals.filter(g => g.progress < g.target)

  if (activeTasks.length === 0 && activeGoals.length === 0) return null

  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: `${domain.color}10`,
        border: `1px solid ${domain.color}25`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{domain.icon}</span>
        <span className="text-[12px] font-semibold" style={{ color: domain.color }}>
          {isRTL ? domain.nameHe : domain.nameEn}
        </span>
      </div>
      {highPriority.length > 0 && (
        <div className="space-y-1 mb-2">
          {highPriority.slice(0, 2).map(task => (
            <div key={task.id} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#ef4444' }} />
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{task.title}</span>
            </div>
          ))}
        </div>
      )}
      {activeTasks.length > 0 && highPriority.length === 0 && (
        <div className="text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {activeTasks.length} {isRTL ? 'משימות' : 'tasks'}
        </div>
      )}
      {activeGoals.length > 0 && (
        <div className="space-y-1">
          {activeGoals.slice(0, 1).map(goal => {
            const pct = Math.min(100, Math.round((goal.progress / goal.target) * 100))
            return (
              <div key={goal.id}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>{goal.title}</span>
                  <span style={{ color: domain.color }}>{pct}%</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div
                    className="h-1 rounded-full transition-all"
                    style={{ width: `${pct}%`, background: domain.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── TimeSlot ─────────────────────────────────────────────────────────────
function TimeSlot({
  hour,
  items,
  onAdd,
  onEdit,
  isToday,
  isCurrentHour,
  nowTotalMin,
  checked,
  onCheck,
  scheduledHabits,
  completedHabitIds,
  onToggleHabit,
  activeHabitId,
}: {
  hour: number
  items: ScheduleItem[]
  onAdd: (hour: number) => void
  onEdit: (item: ScheduleItem) => void
  isToday: boolean
  isCurrentHour: boolean
  nowTotalMin: number
  checked: Set<string>
  onCheck: (time: string) => void
  scheduledHabits: Habit[]
  completedHabitIds: Set<string>
  onToggleHabit: (id: string) => void
  activeHabitId: string | undefined
}) {
  const { isRTL } = useLang()
  const label = `${String(hour).padStart(2, '0')}:00`
  const hourHabits = (scheduledHabits ?? []).filter(h => h.schedule_time !== null && Math.floor(toMin(h.schedule_time!) / 60) === hour)
  const hourHabits2 = (scheduledHabits ?? []).filter(h => {
    if (!h.schedule_time) return false
    const hMin = toMin(h.schedule_time)
    return Math.floor(hMin / 60) === hour
  })
  const sortedHabits = hourHabits2.sort((a, b) => toMin(a.schedule_time!) - toMin(b.schedule_time!))
  const isEmpty = items.length === 0 && hourHabits.length === 0

  return (
    <div className="flex gap-2">
      {/* Time label */}
      <div className="w-12 flex-shrink-0 text-[11px] text-end pt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {label}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        {/* Current time indicator */}
        {isCurrentHour && isToday && (
          <div className="flex items-center gap-1.5 mb-1" style={{ marginTop: `${(nowTotalMin % 60) / 60 * 40}px` }}>
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }} />
            <div className="flex-1 h-px" style={{ background: 'var(--primary)' }} />
          </div>
        )}

        {/* Schedule items */}
        {items.map(item => {
          const isPast = isToday && toMin(item.time) < nowTotalMin
          const isChecked = checked.has(item.time)
          return (
            <div
              key={item.id}
              className="flex items-center gap-2 mb-1"
            >
              <button
                onClick={() => onCheck(item.time)}
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: isChecked ? 'var(--primary)' : 'transparent',
                  border: `2px solid ${isChecked ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}`,
                }}
              >
                {isChecked && <Check size={10} color="#000" strokeWidth={3} />}
              </button>
              <button
                onClick={() => onEdit(item)}
                className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-start transition-all hover:brightness-110"
                style={{
                  background: item.color ? `${item.color}22` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${item.color ? item.color + '33' : 'rgba(255,255,255,0.08)'}`,
                  opacity: isPast && !isChecked ? 0.5 : 1,
                }}
              >
                {item.icon && <span className="text-sm">{item.icon}</span>}
                <span className="text-[12px]" style={{ color: 'var(--foreground)' }}>{item.label}</span>
                <span className="text-[10px] ms-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {item.time.slice(0, 5)}
                </span>
              </button>
            </div>
          )
        })}

        {/* Habits */}
        {sortedHabits.map(habit => {
          const isActive = habit.id === activeHabitId
          const isCompleted = completedHabitIds.has(habit.id)
          return (
            <div key={habit.id} className="mb-1">
              <HabitMiniCard habit={habit} completed={isCompleted} onToggle={onToggleHabit} />
            </div>
          )
        })}

        {/* Add button */}
        {isEmpty && (
          <button
            onClick={() => onAdd(hour)}
            className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] transition-all hover:opacity-80"
            style={{
              border: '1px dashed rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            <Plus size={10} />
            {isRTL ? 'הוסף' : 'Add'}
          </button>
        )}
        {!isEmpty && (
          <button
            onClick={() => onAdd(hour)}
            className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] opacity-30 hover:opacity-60 transition-opacity"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Plus size={8} /> {isRTL ? 'הוסף' : 'Add'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── EditModal ─────────────────────────────────────────────────────────────
function EditModal({
  item,
  onSave,
  onDelete,
  onClose,
  getDuplicateCount,
}: {
  item: ScheduleItem
  onSave: (id: string, scope: 'single' | 'all') => void
  onDelete: (id: string, scope: 'single' | 'all') => void
  onClose: () => void
  getDuplicateCount: (label: string, day: number) => number
}) {
  const { isRTL } = useLang()
  const [label, setLabel] = useState(item.label)
  const [time,  setTime]  = useState(item.time.slice(0, 5))
  const [color, setColor] = useState(item.color ?? '#3B82F6')
  const [icon,  setIcon]  = useState(item.icon ?? '')
  const [notes, setNotes] = useState(item.notes ?? '')
  const [scope, setScope] = useState<'single' | 'all'>(
    item.specific_date ? 'single' : 'all'
  )

  const dupCount = getDuplicateCount(item.label, item.day_of_week ?? -1)
  const isRecurring = item.specific_date === null && dupCount > 0

  const EMOJIS = ['📚','🏋️','🧘','💼','🎵','🍽️','💊','🛌','✝️','📝','💡','🚶','🏃','🎯','💰','👥','🔬','🎨','⚽','🚿']
  const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16','#F97316','#6366F1']

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="w-full max-w-lg rounded-t-3xl p-5 space-y-4"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>
            {isRTL ? 'ערוך פעילות' : 'Edit activity'}
          </h3>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--muted-foreground)' }} /></button>
        </div>

        {/* Label */}
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder={isRTL ? 'שם הפעילות' : 'Activity name'}
          className="w-full px-3 py-2 rounded-xl text-sm"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--foreground)', border: '1px solid var(--c-card-border)' }}
        />

        {/* Time */}
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--foreground)', border: '1px solid var(--c-card-border)' }}
        />

        {/* Emojis */}
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => setIcon(e)}
              className="w-8 h-8 rounded-lg text-base transition-all"
              style={{ background: icon === e ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)' }}
            >{e}</button>
          ))}
        </div>

        {/* Colors */}
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full transition-all"
              style={{ background: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
            />
          ))}
        </div>

        {/* Notes */}
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={isRTL ? 'הערות...' : 'Notes...'}
          rows={2}
          className="w-full px-3 py-2 rounded-xl text-sm resize-none"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--foreground)', border: '1px solid var(--c-card-border)' }}
        />

        {/* Scope (recurring) */}
        {isRecurring && (
          <div className="flex gap-2">
            <button
              onClick={() => setScope('single')}
              className="flex-1 py-1.5 rounded-xl text-xs font-medium"
              style={{
                background: scope === 'single' ? 'var(--primary)' : 'rgba(255,255,255,0.07)',
                color: scope === 'single' ? '#000' : 'var(--muted-foreground)',
              }}
            >
              {isRTL ? 'רק היום' : 'Just today'}
            </button>
            <button
              onClick={() => setScope('all')}
              className="flex-1 py-1.5 rounded-xl text-xs font-medium"
              style={{
                background: scope === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.07)',
                color: scope === 'all' ? '#000' : 'var(--muted-foreground)',
              }}
            >
              {isRTL ? 'תמיד' : 'Always'}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onDelete(item.id, scope)}
            className="p-2.5 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => {
              item.label = label; item.time = time + ':00'; item.color = color; item.icon = icon; item.notes = notes
              onSave(item.id, scope)
            }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--primary)', color: '#000' }}
          >
            {isRTL ? 'שמור' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AddModal ─────────────────────────────────────────────────────────────
function AddModal({
  defaultHour,
  onAdd,
  onClose,
}: {
  defaultHour: number
  onAdd: (label: string, time: string, color: string, icon: string, notes: string, recurring: boolean) => void
  onClose: () => void
}) {
  const { isRTL } = useLang()
  const [label, setLabel]       = useState('')
  const [time,  setTime]        = useState(`${String(defaultHour).padStart(2, '0')}:00`)
  const [color, setColor]       = useState('#3B82F6')
  const [icon,  setIcon]        = useState('')
  const [notes, setNotes]       = useState('')
  const [recurring, setRecurring] = useState(true)

  const EMOJIS = ['📚','🏋️','🧘','💼','🎵','🍽️','💊','🛌','✝️','📝','💡','🚶','🏃','🎯','💰','👥','🔬','🎨','⚽','🚿']
  const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16','#F97316','#6366F1']

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="w-full max-w-lg rounded-t-3xl p-5 space-y-4"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-card-border)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>
            {isRTL ? 'הוסף פעילות' : 'Add activity'}
          </h3>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--muted-foreground)' }} /></button>
        </div>

        {/* Label */}
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder={isRTL ? 'שם הפעילות' : 'Activity name'}
          className="w-full px-3 py-2 rounded-xl text-sm"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--foreground)', border: '1px solid var(--c-card-border)' }}
        />

        {/* Time */}
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--foreground)', border: '1px solid var(--c-card-border)' }}
        />

        {/* Emojis */}
        <div className="flex flex-wrap gap-1.5">
          {EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => setIcon(e)}
              className="w-8 h-8 rounded-lg text-base transition-all"
              style={{ background: icon === e ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)' }}
            >{e}</button>
          ))}
        </div>

        {/* Colors */}
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full transition-all"
              style={{ background: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
            />
          ))}
        </div>

        {/* Notes */}
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={isRTL ? 'הערות...' : 'Notes...'}
          rows={2}
          className="w-full px-3 py-2 rounded-xl text-sm resize-none"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--foreground)', border: '1px solid var(--c-card-border)' }}
        />

        {/* Recurring */}
        <button
          onClick={() => setRecurring(!recurring)}
          className="flex items-center gap-2 text-xs"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <div
            className="w-4 h-4 rounded flex items-center justify-center"
            style={{ background: recurring ? 'var(--primary)' : 'rgba(255,255,255,0.1)', border: '1px solid var(--c-card-border)' }}
          >
            {recurring && <Check size={10} color="#000" strokeWidth={3} />}
          </div>
          {isRTL ? 'חזור כל שבוע' : 'Repeat weekly'}
        </button>

        {/* Add */}
        <button
          onClick={() => { if (label.trim()) onAdd(label, time, color, icon, notes, recurring) }}
          className="w-full py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--primary)', color: '#000' }}
        >
          {isRTL ? 'הוסף' : 'Add'}
        </button>
      </div>
    </div>
  )
}

// ── CalendarHeatmapMonth ──────────────────────────────────────────────────
function CalendarHeatmapMonth({
  year,
  month,
  logs,
  allHabits,
  onDayClick,
}: {
  year: number
  month: number
  logs: HabitLog[]
  allHabits: Habit[]
  onDayClick: (dateStr: string) => void
}) {
  const dailyHabits = allHabits.filter(h => h.frequency === 'daily')
  const totalHabits = dailyHabits.length

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = new Date().toISOString().split('T')[0]

  const logMap: Record<string, number> = {}
  logs.forEach(l => {
    const d = l.completed_at
    logMap[d] = (logMap[d] ?? 0) + 1
  })

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const MONTH_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
  const MONTH_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="mb-4">
      <p className="text-[11px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {MONTH_EN[month]} {year}
      </p>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const count = logMap[dateStr] ?? 0
          const pct = totalHabits > 0 ? count / totalHabits : 0
          const isToday = dateStr === todayStr
          const isFuture = dateStr > todayStr
          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onDayClick(dateStr)}
              className="aspect-square rounded-sm transition-opacity"
              style={{
                background: isFuture
                  ? 'rgba(255,255,255,0.03)'
                  : pct > 0.8 ? 'var(--primary)'
                  : pct > 0.5 ? 'rgba(var(--primary-rgb),0.6)'
                  : pct > 0.2 ? 'rgba(var(--primary-rgb),0.3)'
                  : 'rgba(255,255,255,0.07)',
                outline: isToday ? '2px solid var(--primary)' : 'none',
                outlineOffset: '1px',
                cursor: isFuture ? 'default' : 'pointer',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── YearlyHeatmap ─────────────────────────────────────────────────────────
function YearlyHeatmap({
  logs,
  allHabits,
  onDayClick,
}: {
  logs: HabitLog[]
  allHabits: Habit[]
  onDayClick: (dateStr: string) => void
}) {
  const now = new Date()
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  return (
    <div className="overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 200px)' }}>
      {months.map(({ year, month }) => (
        <CalendarHeatmapMonth
          key={`${year}-${month}`}
          year={year}
          month={month}
          logs={logs}
          allHabits={allHabits}
          onDayClick={onDayClick}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component — SchedulePageClient
// ─────────────────────────────────────────────────────────────────────────────

export function SchedulePageClient({
  userId, userItems, allItems, todayChecks, scheduledHabits, todayCompletedHabitIds,
  allHabits, weekHabitLogs, weekActivityChecks, calendarLogs,
  domainTasks, domainGoals,
}: SchedulePageClientProps) {
  const { isRTL }  = useLang()
  const { theme }  = useTheme()
  const { toast }  = useToast()
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
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)

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
    const activityTotal = activities.length
    const activeDomains = [...new Set(dailyHabits.map(h => h.domain_slug))]

    return {
      dow,
      date,
      label: isRTL ? DAY_NAMES_HE[dow] : DAY_LABELS_EN[dow],
      isFuture,
      habitDone,
      habitTotal,
      activityDone,
      activityTotal,
    }
  })

  const pastAndToday = weekData.filter(d => !d.isFuture)
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

  async function saveEdit(id: string, scope: 'single' | 'all') {
    const item = editItem!
    const sb = createClient()
    if (scope === 'all') {
      await sb.from('user_schedule').update({ label: item.label, time: item.time, color: item.color, icon: item.icon, notes: item.notes }).eq('user_id', userId).eq('label', editItem!.label).is('specific_date', null)
    } else {
      const date = getWeekDate(item.day_of_week!)
      await sb.from('user_schedule').upsert({ id, user_id: userId, label: item.label, time: item.time, color: item.color, icon: item.icon, notes: item.notes, specific_date: date, day_of_week: null })
    }
    setEditItem(null)
    router.refresh()
  }

  async function deleteItem(id: string, scope: 'single' | 'all') {
    const sb = createClient()
    if (scope === 'all') {
      await sb.from('user_schedule').delete().eq('user_id', userId).eq('label', editItem!.label).is('specific_date', null)
    } else {
      await sb.from('user_schedule').delete().eq('id', id)
    }
    setEditItem(null)
    router.refresh()
  }

  async function addItem(label: string, time: string, color: string, icon: string, notes: string, recurring: boolean) {
    const sb = createClient()
    const date = getWeekDate(day)
    await sb.from('user_schedule').insert({
      user_id: userId,
      label,
      time: time + ':00',
      color,
      icon: icon || null,
      notes: notes || null,
      day_of_week: recurring ? day : null,
      specific_date: recurring ? null : date,
    })
    setAddHour(false)
    router.refresh()
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
      toast('שגיאה בשמירה', 'error')
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


  const handleResetDay = async () => {
    setResetting(true)
    const sb = createClient()
    await Promise.all([
      sb.from('habit_logs').delete().eq('user_id', userId).eq('completed_at', todayDate),
      sb.from('activity_checks').delete().eq('user_id', userId).eq('date', todayDate),
      sb.from('night_checkins').delete().eq('user_id', userId).eq('date', todayDate),
      sb.from('schedule_reflections').delete().eq('user_id', userId).eq('date', todayDate),
    ])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`night_checkin_${todayDate}`)
    }
    setResetting(false)
    setConfirmReset(false)
    router.refresh()
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
        <div className="flex-1">
          <h1 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
            {isRTL ? 'לוח שנה' : 'Calendar'}
          </h1>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'תכנן את השבוע שלך' : 'Plan your week'}
          </p>
        </div>
        {completedHabitIds.size > 0 && (
          <div className="flex items-center gap-2">
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="text-[11px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-opacity hover:opacity-90"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}
              >
                ↺ {isRTL ? 'אפס יום' : 'Reset day'}
              </button>
            ) : (
              <>
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {isRTL ? 'למחוק את כל ההתקדמות של היום?' : "Clear all today's progress?"}
                </span>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="text-[11px] px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                >
                  {isRTL ? 'ביטול' : 'Cancel'}
                </button>
                <button
                  onClick={handleResetDay}
                  disabled={resetting}
                  className="text-[11px] px-2.5 py-1 rounded-lg font-semibold disabled:opacity-50"
                  style={{ background: 'rgba(239,68,68,0.55)', color: '#fff' }}
                >
                  {resetting ? '...' : isRTL ? 'אפס' : 'Reset'}
                </button>
              </>
            )}
          </div>
        )}
      </div>