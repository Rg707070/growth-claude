'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, Users } from 'lucide-react'
import type { Habit, HabitLog } from '@/types'
import type { FriendContact, FriendEvent, FriendInteraction } from '@/types/friends'

const DAY_HEADERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

interface DayData {
  date: string
  completedHabitIds: string[]
  interactionCount: number
  eventIds: string[]
}

interface Props {
  habits: Habit[]
  allLogs: HabitLog[]
  interactions: FriendInteraction[]
  events: FriendEvent[]
  contacts: FriendContact[]
  color: string
  isRTL: boolean
}

function pad2(n: number) { return String(n).padStart(2, '0') }

const CATEGORY_EMOJI: Record<string, string> = {
  hangout: '🤝',
  birthday: '🎂',
  trip: '✈️',
  meal: '🍽️',
  call: '📞',
  celebration: '🎉',
  other: '📅',
}

export function FriendsCalendarTab({
  habits, allLogs, interactions, events, contacts, color, isRTL,
}: Props) {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(todayStr)

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
    setSelectedDay(null)
  }

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()

  const dayDataMap = useMemo(() => {
    const map: Record<string, DayData> = {}
    const ensure = (d: string) => {
      if (!map[d]) map[d] = { date: d, completedHabitIds: [], interactionCount: 0, eventIds: [] }
    }
    for (const log of allLogs) {
      const [ly, lm] = log.completed_at.split('-').map(Number)
      if (ly !== viewYear || lm - 1 !== viewMonth) continue
      ensure(log.completed_at)
      if (!map[log.completed_at].completedHabitIds.includes(log.habit_id))
        map[log.completed_at].completedHabitIds.push(log.habit_id)
    }
    for (const i of interactions) {
      const [iy, im] = i.date.split('-').map(Number)
      if (iy !== viewYear || im - 1 !== viewMonth) continue
      ensure(i.date)
      map[i.date].interactionCount++
    }
    for (const e of events) {
      const [ey, em] = e.event_date.split('-').map(Number)
      if (ey !== viewYear || em - 1 !== viewMonth) continue
      ensure(e.event_date)
      map[e.event_date].eventIds.push(e.id)
    }
    return map
  }, [allLogs, interactions, events, viewYear, viewMonth])

  // Month summary stats
  const monthDays = Object.values(dayDataMap)
  const daysWithHabits = monthDays.filter((d) => d.completedHabitIds.length > 0).length
  const totalInteractions = monthDays.reduce((sum, d) => sum + d.interactionCount, 0)
  const monthEvents = monthDays.reduce((sum, d) => sum + d.eventIds.length, 0)

  const selectedData = selectedDay ? dayDataMap[selectedDay] : null
  const contactMap = useMemo(() => {
    const m: Record<string, FriendContact> = {}
    for (const c of contacts) m[c.id] = c
    return m
  }, [contacts])

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="space-y-4">
      {/* Month summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: isRTL ? 'ימים פעילים' : 'Active days', value: daysWithHabits, icon: <CheckCircle2 size={14} /> },
          { label: isRTL ? 'שיחות' : 'Interactions', value: totalInteractions, icon: <Users size={14} /> },
          { label: isRTL ? 'מפגשים' : 'Events', value: monthEvents, icon: <CalendarDays size={14} /> },
        ].map(({ label, value, icon }) => (
          <div
            key={label}
            className="rounded-xl p-3 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--c-border)' }}
          >
            <div className="flex items-center justify-center gap-1 mb-1" style={{ color }}>
              {icon}
            </div>
            <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{value}</p>
            <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Calendar card */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--card)', border: '1px solid var(--c-border)' }}
      >
        {/* Nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg" style={{ background: 'var(--secondary)' }}>
            <ChevronRight size={16} style={{ color: 'var(--muted-foreground)' }} />
          </button>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{monthName}</p>
          <button
            onClick={nextMonth}
            disabled={viewYear === today.getFullYear() && viewMonth === today.getMonth()}
            className="p-1.5 rounded-lg disabled:opacity-30"
            style={{ background: 'var(--secondary)' }}
          >
            <ChevronLeft size={16} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map((h) => (
            <div key={h} className="text-center text-[10px] font-medium py-1" style={{ color: 'var(--muted-foreground)' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} />
            const dateStr = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(day)}`
            const data = dayDataMap[dateStr]
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDay
            const habitRatio = data ? (habits.length > 0 ? data.completedHabitIds.length / habits.length : 0) : 0
            const hasEvent = data && data.eventIds.length > 0

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className="aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 relative"
                style={{
                  background: isSelected
                    ? color
                    : isToday
                    ? `${color}30`
                    : data && habitRatio > 0
                    ? `${color}${Math.round(habitRatio * 0.35 * 255).toString(16).padStart(2, '0')}`
                    : 'transparent',
                  border: isToday && !isSelected ? `1px solid ${color}55` : '1px solid transparent',
                }}
              >
                <span
                  className="text-xs font-medium leading-none"
                  style={{ color: isSelected ? 'white' : isToday ? color : 'var(--foreground)' }}
                >
                  {day}
                </span>
                {data && data.completedHabitIds.length > 0 && !isSelected && (
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {data.completedHabitIds.slice(0, 3).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full"
                        style={{ background: isToday ? color : `${color}99` }}
                      />
                    ))}
                    {data.completedHabitIds.length > 3 && (
                      <span className="text-[8px]" style={{ color: 'var(--muted-foreground)' }}>+</span>
                    )}
                  </div>
                )}
                {hasEvent && (
                  <div
                    className="absolute top-0.5 end-0.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: isSelected ? 'white' : '#f59e0b' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day detail */}
      {selectedDay && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: 'var(--card)', border: `1px solid ${color}33` }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {new Date(`${selectedDay}T00:00:00`).toLocaleDateString('he-IL', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </p>

          {/* Habits */}
          {habits.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'הרגלים' : 'Habits'}
              </p>
              {habits.map((h) => {
                const done = selectedData?.completedHabitIds.includes(h.id) ?? false
                return (
                  <div key={h.id} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: done ? `${color}22` : 'var(--secondary)', border: `1px solid ${done ? color : 'var(--border)'}` }}
                    >
                      {done && <div className="w-2 h-2 rounded-full" style={{ background: color }} />}
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: done ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                    >
                      {h.name}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Events on this day */}
          {selectedData && selectedData.eventIds.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? 'מפגשים' : 'Events'}
              </p>
              {selectedData.eventIds.map((eid) => {
                const ev = events.find((e) => e.id === eid)
                if (!ev) return null
                return (
                  <div
                    key={eid}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
                  >
                    <span className="text-sm">{CATEGORY_EMOJI[ev.category] ?? '📅'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{ev.title}</p>
                      {ev.contact_ids.length > 0 && (
                        <p className="text-[10px] truncate" style={{ color: 'var(--muted-foreground)' }}>
                          {ev.contact_ids.map((cid) => contactMap[cid]?.name).filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Interactions on this day */}
          {selectedData && selectedData.interactionCount > 0 && (
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                {isRTL ? `${selectedData.interactionCount} שיחות/הודעות` : `${selectedData.interactionCount} interactions`}
              </p>
              <div className="flex flex-wrap gap-1">
                {interactions
                  .filter((i) => i.date === selectedDay)
                  .map((i) => {
                    const c = contactMap[i.contact_id]
                    if (!c) return null
                    return (
                      <span
                        key={i.id}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${color}22`, color }}
                      >
                        {c.name}
                      </span>
                    )
                  })}
              </div>
            </div>
          )}

          {!selectedData && (
            <p className="text-xs text-center py-2" style={{ color: 'var(--muted-foreground)' }}>
              {isRTL ? 'אין פעילות ביום זה' : 'No activity this day'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
