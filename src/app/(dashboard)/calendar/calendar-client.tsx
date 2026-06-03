'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useLang } from '@/lib/lang'
import type { Habit, HabitLog } from '@/types'

type HabitRow = Pick<Habit, 'id' | 'name' | 'domain_slug' | 'is_active'>
type LogRow = Pick<HabitLog, 'habit_id' | 'completed_at'>

interface CalendarClientProps {
  habits: HabitRow[]
  logs: LogRow[]
}

export function CalendarClient({ habits, logs }: CalendarClientProps) {
  const { isRTL } = useLang()
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const { year, month } = viewDate

  // Build a map: date → Set<habit_id>
  const logMap: Record<string, Set<string>> = {}
  for (const log of logs) {
    const d = log.completed_at.split('T')[0]
    if (!logMap[d]) logMap[d] = new Set()
    logMap[d].add(log.habit_id)
  }

  // Active habits (for "total" count)
  const activeHabits = habits.filter((h) => h.is_active)
  const total = activeHabits.length

  // Calendar grid
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay() // 0=Sun
  const daysInMonth = lastDay.getDate()
  const today = new Date().toISOString().split('T')[0]

  // Days array: nulls for padding + day numbers
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`

  const prevMonth = () => {
    setViewDate((prev: { year: number; month: number }) =>
      prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }
    )
    setSelectedDay(null)
  }
  const nextMonth = () => {
    const now = new Date()
    if (year === now.getFullYear() && month === now.getMonth()) return
    setViewDate((prev: { year: number; month: number }) =>
      prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }
    )
    setSelectedDay(null)
  }

  const monthNames = isRTL
    ? ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
    : ['January','February','March','April','May','June','July','August','September','October','November','December']

  const dayLabels = isRTL
    ? ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳']
    : ['Su','Mo','Tu','We','Th','Fr','Sa']

  const selectedLogs = selectedDay ? (logMap[selectedDay] ?? new Set<string>()) : null
  const selectedHabits = selectedLogs
    ? activeHabits.filter((h) => selectedLogs.has(h.id))
    : []

  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  return (
    <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-6">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5 md:max-w-none md:px-0 md:py-8">

        {/* Header */}
        <div className="flex items-center gap-3 md:hidden">
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
              {isRTL ? 'מעקב הרגלים חודשי' : 'Monthly habit tracking'}
            </p>
          </div>
        </div>

        {/* Month navigation */}
        <div
          className="rounded-3xl p-4"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'var(--c-surface-2)', color: 'var(--muted-foreground)' }}
            >
              {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            <span className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
              {monthNames[month]} {year}
            </span>

            <button
              onClick={nextMonth}
              disabled={isCurrentMonth}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
              style={{ background: 'var(--c-surface-2)', color: 'var(--muted-foreground)' }}
            >
              {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {dayLabels.map((label) => (
              <div
                key={label}
                className="text-center text-[10px] font-semibold py-1"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />

              const ds = dateStr(day)
              const completed = logMap[ds]?.size ?? 0
              const isToday = ds === today
              const pct = total > 0 ? completed / total : 0
              const isSelected = selectedDay === ds
              const isFuture = ds > today

              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDay(isSelected ? null : ds)}
                  disabled={isFuture}
                  className="flex flex-col items-center justify-center rounded-xl py-1.5 gap-0.5 transition-all active:scale-90 disabled:opacity-30"
                  style={{
                    background: isSelected
                      ? 'var(--c-primary-glow)'
                      : isToday
                      ? 'var(--c-surface-2)'
                      : undefined,
                    border: isSelected
                      ? '1.5px solid var(--primary)'
                      : isToday
                      ? '1px solid var(--c-border)'
                      : '1px solid transparent',
                  }}
                >
                  <span
                    className="text-[12px] font-semibold leading-none"
                    style={{
                      color: isSelected
                        ? 'var(--primary)'
                        : isToday
                        ? 'var(--foreground)'
                        : 'var(--foreground)',
                    }}
                  >
                    {day}
                  </span>

                  {/* Progress dots */}
                  {!isFuture && total > 0 && (
                    <div className="flex gap-px flex-wrap justify-center" style={{ maxWidth: '24px' }}>
                      {Array.from({ length: Math.min(total, 5) }).map((_, j) => (
                        <span
                          key={j}
                          className="w-1 h-1 rounded-full"
                          style={{
                            background: j < completed
                              ? 'var(--primary)'
                              : 'var(--c-border)',
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Completion fraction for days with data */}
                  {completed > 0 && (
                    <span
                      className="text-[9px] font-bold leading-none"
                      style={{ color: pct >= 1 ? 'var(--primary)' : 'var(--muted-foreground)' }}
                    >
                      {completed}/{total}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <div
            className="rounded-3xl p-4 space-y-3 animate-fade-in"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}
          >
            <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
              {' — '}
              <span style={{ color: 'var(--primary)' }}>
                {selectedHabits.length}/{total}
              </span>
            </p>

            {selectedHabits.length > 0 ? (
              <div className="space-y-1.5">
                {selectedHabits.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'var(--c-surface-2)' }}
                  >
                    <span className="text-[13px]" style={{ color: 'var(--primary)' }}>✓</span>
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>{h.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'לא הושלמו הרגלים ביום זה.' : 'No habits completed this day.'}
              </p>
            )}

            {/* Missed habits */}
            {total - selectedHabits.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  {isRTL ? 'לא הושלמו:' : 'Missed:'}
                </p>
                {activeHabits
                  .filter((h) => !selectedLogs?.has(h.id))
                  .map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                      style={{ background: 'var(--c-surface-2)' }}
                    >
                      <span className="text-[13px]" style={{ color: 'var(--muted-foreground)' }}>○</span>
                      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{h.name}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Monthly summary */}
        <div
          className="rounded-3xl p-4"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}
        >
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted-foreground)' }}>
            {isRTL ? 'סיכום חודשי' : 'Monthly summary'}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(() => {
              let daysActive = 0
              let totalCompleted = 0
              let perfectDays = 0
              for (let d = 1; d <= daysInMonth; d++) {
                const ds = dateStr(d)
                if (ds > today) continue
                const count = logMap[ds]?.size ?? 0
                if (count > 0) daysActive++
                totalCompleted += count
                if (total > 0 && count >= total) perfectDays++
              }
              return [
                { label: isRTL ? 'ימים פעילים' : 'Active days', value: daysActive },
                { label: isRTL ? 'הרגלים הושלמו' : 'Habits done', value: totalCompleted },
                { label: isRTL ? 'ימים מושלמים' : 'Perfect days', value: perfectDays },
              ]
            })().map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>{value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
