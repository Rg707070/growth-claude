'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle2, Clock } from 'lucide-react'
import type { Habit, HabitLog, LearningSession, DailyTrack } from '@/types'

const COLOR = '#0F766E'
const GREEN = '#16a34a'

const DAY_HEADERS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

interface DayData {
  date: string
  sessionMinutes: number
  sessionCount: number
  completedHabitIds: string[]
}

interface Props {
  habits: Habit[]
  allLogs: HabitLog[]
  sessions: LearningSession[]
  dailyTracks: DailyTrack[]
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function formatDateHe(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function TorahCalendarTab({ habits, allLogs, sessions, dailyTracks: _dailyTracks }: Props) {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(todayStr)

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y: number) => y - 1); setViewMonth(11) }
    else setViewMonth((m: number) => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y: number) => y + 1); setViewMonth(0) }
    else setViewMonth((m: number) => m + 1)
    setSelectedDay(null)
  }

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getDay() // 0=Sun

  // Build day data
  const dayDataMap = useMemo(() => {
    const map: Record<string, DayData> = {}

    for (const s of sessions) {
      const date = s.created_at.split('T')[0]
      const [sy, sm] = date.split('-').map(Number)
      if (sy !== viewYear || sm - 1 !== viewMonth) continue
      if (!map[date]) map[date] = { date, sessionMinutes: 0, sessionCount: 0, completedHabitIds: [] }
      map[date].sessionMinutes += Math.round(s.duration_seconds / 60)
      map[date].sessionCount++
    }

    for (const log of allLogs) {
      const date = log.completed_at
      const [ly, lm] = date.split('-').map(Number)
      if (ly !== viewYear || lm - 1 !== viewMonth) continue
      if (!map[date]) map[date] = { date, sessionMinutes: 0, sessionCount: 0, completedHabitIds: [] }
      if (!map[date].completedHabitIds.includes(log.habit_id)) {
        map[date].completedHabitIds.push(log.habit_id)
      }
    }

    return map
  }, [sessions, allLogs, viewYear, viewMonth])

  // Calendar grid cells
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const selectedData = selectedDay ? dayDataMap[selectedDay] : undefined
  const selectedSessions = selectedDay
    ? sessions.filter(s => s.created_at.startsWith(selectedDay))
    : []
  const selectedHabits = selectedData
    ? habits.map(h => ({ ...h, done: selectedData.completedHabitIds.includes(h.id) }))
    : habits.map(h => ({ ...h, done: false }))

  // Monthly summary stats
  const monthSessions = sessions.filter(s => {
    const [sy, sm] = s.created_at.split('T')[0].split('-').map(Number)
    return sy === viewYear && sm - 1 === viewMonth
  })
  const monthMinutes = monthSessions.reduce((acc, s) => acc + Math.round(s.duration_seconds / 60), 0)
  const activeDays = (Object.values(dayDataMap) as DayData[]).filter(d => d.sessionCount > 0 || d.completedHabitIds.length > 0).length

  return (
    <div className="space-y-4">

      {/* Month navigation */}
      <div className="flex items-center justify-between" dir="ltr">
        <button
          onClick={prevMonth}
          className="p-2 rounded-xl transition-all active:scale-95"
          style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
        >
          <ChevronLeft size={18} style={{ color: 'var(--muted-foreground)' }} />
        </button>
        <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{monthName}</p>
        <button
          onClick={nextMonth}
          className="p-2 rounded-xl transition-all active:scale-95"
          style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
        >
          <ChevronRight size={18} style={{ color: 'var(--muted-foreground)' }} />
        </button>
      </div>

      {/* Month summary bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl p-3 text-center" style={{ background: `${COLOR}12`, border: `1px solid ${COLOR}28` }}>
          <p className="text-lg font-bold" style={{ color: COLOR }}>{monthMinutes}</p>
          <p className="text-[10px] font-medium" style={{ color: COLOR }}>דקות לימוד</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: `${COLOR}12`, border: `1px solid ${COLOR}28` }}>
          <p className="text-lg font-bold" style={{ color: COLOR }}>{monthSessions.length}</p>
          <p className="text-[10px] font-medium" style={{ color: COLOR }}>סשנים</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: `${COLOR}12`, border: `1px solid ${COLOR}28` }}>
          <p className="text-lg font-bold" style={{ color: COLOR }}>{activeDays}</p>
          <p className="text-[10px] font-medium" style={{ color: COLOR }}>ימים פעילים</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-2xl p-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_HEADERS_HE.map((d, i) => (
            <div key={i} className="text-center py-1">
              <span className="text-[11px] font-semibold" style={{ color: 'var(--muted-foreground)' }}>{d}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />
            const dateStr = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(day)}`
            const data = dayDataMap[dateStr]
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDay
            const hasSessions = (data?.sessionCount ?? 0) > 0
            const hasHabits = (data?.completedHabitIds.length ?? 0) > 0
            const habitRatio = habits.length > 0 ? (data?.completedHabitIds.length ?? 0) / habits.length : 0
            const allHabitsDone = habits.length > 0 && habitRatio === 1

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className="flex flex-col items-center justify-start pt-1.5 pb-1 rounded-xl transition-all active:scale-95"
                style={{
                  minHeight: '52px',
                  background: isSelected
                    ? COLOR
                    : isToday
                    ? `${COLOR}20`
                    : 'transparent',
                  border: `1px solid ${
                    isSelected ? COLOR : isToday ? `${COLOR}50` : 'transparent'
                  }`,
                }}
              >
                <span
                  className="text-[13px] font-semibold leading-none mb-1"
                  style={{ color: isSelected ? 'white' : isToday ? COLOR : 'var(--foreground)' }}
                >
                  {day}
                </span>
                {/* Indicator dots */}
                <div className="flex gap-[3px] items-center justify-center">
                  {hasSessions && (
                    <div
                      className="rounded-full"
                      style={{
                        width: '5px', height: '5px',
                        background: isSelected ? 'rgba(255,255,255,0.9)' : COLOR,
                      }}
                    />
                  )}
                  {hasHabits && (
                    <div
                      className="rounded-full"
                      style={{
                        width: allHabitsDone ? '6px' : '5px',
                        height: allHabitsDone ? '6px' : '5px',
                        background: isSelected ? 'rgba(255,255,255,0.7)' : GREEN,
                      }}
                    />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-5 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLOR }} />
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>לימוד</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: GREEN }} />
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>הרגלים</span>
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div
          className="rounded-2xl p-4 space-y-4"
          style={{ background: 'var(--card)', border: `1px solid ${COLOR}30` }}
        >
          <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
            {formatDateHe(selectedDay)}
          </p>

          {/* Session stats */}
          {selectedData && selectedData.sessionCount > 0 ? (
            <div>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 rounded-xl p-3" style={{ background: `${COLOR}12` }}>
                  <div className="flex items-center gap-1 mb-1">
                    <Clock size={12} style={{ color: COLOR }} />
                    <span className="text-[11px] font-medium" style={{ color: COLOR }}>דקות לימוד</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: COLOR }}>{selectedData.sessionMinutes}</p>
                </div>
                <div className="flex-1 rounded-xl p-3" style={{ background: `${COLOR}12` }}>
                  <div className="flex items-center gap-1 mb-1">
                    <BookOpen size={12} style={{ color: COLOR }} />
                    <span className="text-[11px] font-medium" style={{ color: COLOR }}>סשנים</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: COLOR }}>{selectedData.sessionCount}</p>
                </div>
              </div>
              <div className="space-y-1">
                {selectedSessions.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: `${COLOR}0d` }}
                  >
                    <span className="text-xs tabular-nums" style={{ color: COLOR }}>
                      {Math.round(s.duration_seconds / 60)} דק׳
                    </span>
                    <span className="text-xs font-medium text-right" style={{ color: 'var(--foreground)' }}>
                      {s.text_title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-1">
              <BookOpen size={14} style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>לא נרשם לימוד</span>
            </div>
          )}

          {/* Habits */}
          {habits.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                הרגלים
              </p>
              <div className="space-y-1.5">
                {selectedHabits.map(h => (
                  <div key={h.id} className="flex items-center gap-2.5">
                    <CheckCircle2
                      size={16}
                      className="shrink-0"
                      style={{ color: h.done ? GREEN : 'var(--border)' }}
                    />
                    <span
                      className="text-sm"
                      style={{
                        color: h.done ? 'var(--foreground)' : 'var(--muted-foreground)',
                        textDecoration: h.done ? 'none' : 'none',
                      }}
                    >
                      {h.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
